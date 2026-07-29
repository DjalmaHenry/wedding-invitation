import {
  createGiftPayment,
  findGiftPaymentByMercadoPagoId,
  updateGiftPaymentStatus,
} from "../../../../db/gift-payments";
import { findGiftItem } from "../../../../lib/gifts";
import {
  createMercadoPagoPix,
  getMercadoPagoPayment,
  normalizePaymentStatus,
} from "../../../../lib/mercado-pago";

type CreatePixPayload = {
  giftId?: unknown;
  amount?: unknown;
  donorName?: unknown;
  donorEmail?: unknown;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Formato inválido." }, { status: 415 });
  }

  let payload: CreatePixPayload;
  try {
    payload = (await request.json()) as CreatePixPayload;
  } catch {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const giftId =
    typeof payload.giftId === "string" ? payload.giftId.trim() : "";
  const donorName =
    typeof payload.donorName === "string"
      ? payload.donorName.trim().replace(/\s+/g, " ")
      : "";
  const donorEmail =
    typeof payload.donorEmail === "string"
      ? payload.donorEmail.trim().toLowerCase()
      : "";
  const amount =
    typeof payload.amount === "number" && Number.isFinite(payload.amount)
      ? payload.amount
      : 0;
  const gift = findGiftItem(giftId);

  if (
    !gift ||
    donorName.length < 3 ||
    donorName.length > 120 ||
    donorEmail.length > 180 ||
    !EMAIL_PATTERN.test(donorEmail) ||
    !Number.isInteger(amount) ||
    amount < gift.minimum ||
    amount > gift.maximum
  ) {
    return Response.json(
      { error: "Revise seu nome, e-mail e o valor escolhido." },
      { status: 400 },
    );
  }

  const idempotencyKey = crypto.randomUUID();
  const externalReference = `gift_${crypto.randomUUID()}`;

  try {
    const payment = await createMercadoPagoPix({
      amount,
      description: `Presente de casamento - ${gift.title}`,
      donorName,
      donorEmail,
      externalReference,
      idempotencyKey,
    });
    const paymentId = String(payment.id ?? "");
    const transactionData = payment.point_of_interaction?.transaction_data;

    if (
      !/^\d{1,30}$/.test(paymentId) ||
      !transactionData?.qr_code ||
      !transactionData.qr_code_base64
    ) {
      throw new Error("MERCADO_PAGO_INVALID_PIX_RESPONSE");
    }

    const status = normalizePaymentStatus(payment.status);
    await createGiftPayment({
      mercadoPagoPaymentId: paymentId,
      externalReference,
      giftId: gift.id,
      giftTitle: gift.title,
      donorName,
      donorEmail,
      amountCents: amount * 100,
      status,
      statusDetail: payment.status_detail ?? null,
      ticketUrl: transactionData.ticket_url ?? null,
      createdAt: payment.date_created,
    });

    return Response.json({
      paymentId,
      status,
      qrCode: transactionData.qr_code,
      qrCodeBase64: transactionData.qr_code_base64,
      ticketUrl: transactionData.ticket_url ?? null,
      expiresAt: payment.date_of_expiration ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "MERCADO_PAGO_NOT_CONFIGURED") {
      return Response.json(
        {
          error:
            "O Pix está sendo configurado. Tente novamente em alguns instantes.",
          code: "PIX_NOT_CONFIGURED",
        },
        { status: 503 },
      );
    }

    console.error("Falha ao criar Pix no Mercado Pago", error);
    return Response.json(
      { error: "Não foi possível gerar o Pix agora. Tente novamente." },
      { status: 502 },
    );
  }
}

export async function GET(request: Request) {
  const paymentId =
    new URL(request.url).searchParams.get("paymentId")?.trim() ?? "";
  if (!/^\d{1,30}$/.test(paymentId)) {
    return Response.json({ error: "Pagamento inválido." }, { status: 400 });
  }

  try {
    const record = await findGiftPaymentByMercadoPagoId(paymentId);
    if (!record) {
      return Response.json(
        { error: "Pagamento não encontrado." },
        { status: 404 },
      );
    }

    const payment = await getMercadoPagoPayment(paymentId);
    if (payment.external_reference !== record.externalReference) {
      return Response.json(
        { error: "Não foi possível validar o pagamento." },
        { status: 409 },
      );
    }

    const status = normalizePaymentStatus(payment.status);
    await updateGiftPaymentStatus({
      mercadoPagoPaymentId: paymentId,
      externalReference: record.externalReference,
      status,
      statusDetail: payment.status_detail ?? null,
      paidAt: payment.date_approved ?? null,
    });

    return Response.json({ paymentId, status });
  } catch (error) {
    console.error("Falha ao consultar Pix no Mercado Pago", error);
    return Response.json(
      { error: "Não foi possível consultar o pagamento agora." },
      { status: 502 },
    );
  }
}
