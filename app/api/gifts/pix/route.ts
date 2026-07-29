import {
  createGiftPayment,
  findGiftPaymentByMercadoPagoOrderId,
  updateGiftPaymentStatus,
} from "../../../../db/gift-payments";
import { findGiftItem } from "../../../../lib/gifts";
import {
  createMercadoPagoPixOrder,
  getMercadoPagoOrder,
  normalizeOrderStatus,
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
    const order = await createMercadoPagoPixOrder({
      amount,
      donorEmail,
      externalReference,
      idempotencyKey,
    });
    const orderId = String(order.id ?? "");
    const transaction = order.transactions?.payments?.[0];
    const paymentMethod = transaction?.payment_method;

    if (
      !/^ORD[A-Z0-9]{20,50}$/i.test(orderId) ||
      !paymentMethod?.qr_code ||
      !paymentMethod.qr_code_base64
    ) {
      throw new Error("MERCADO_PAGO_INVALID_PIX_RESPONSE");
    }

    const status = normalizeOrderStatus(order.status);
    await createGiftPayment({
      mercadoPagoOrderId: orderId,
      mercadoPagoPaymentId: transaction?.id ?? null,
      externalReference,
      giftId: gift.id,
      giftTitle: gift.title,
      donorName,
      donorEmail,
      amountCents: amount * 100,
      status,
      statusDetail: order.status_detail ?? null,
      ticketUrl: paymentMethod.ticket_url ?? null,
      createdAt: order.created_date,
    });

    return Response.json({
      orderId,
      status,
      qrCode: paymentMethod.qr_code,
      qrCodeBase64: paymentMethod.qr_code_base64,
      ticketUrl: paymentMethod.ticket_url ?? null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
  const orderId =
    new URL(request.url).searchParams.get("orderId")?.trim() ?? "";
  if (!/^ORD[A-Z0-9]{20,50}$/i.test(orderId)) {
    return Response.json({ error: "Pagamento inválido." }, { status: 400 });
  }

  try {
    const record = await findGiftPaymentByMercadoPagoOrderId(orderId);
    if (!record) {
      return Response.json(
        { error: "Pagamento não encontrado." },
        { status: 404 },
      );
    }

    const order = await getMercadoPagoOrder(orderId);
    if (order.external_reference !== record.externalReference) {
      return Response.json(
        { error: "Não foi possível validar o pagamento." },
        { status: 409 },
      );
    }

    const status = normalizeOrderStatus(order.status);
    await updateGiftPaymentStatus({
      mercadoPagoOrderId: orderId,
      externalReference: record.externalReference,
      status,
      statusDetail: order.status_detail ?? null,
      paidAt: status === "approved" ? order.last_updated_date ?? null : null,
    });

    return Response.json({ orderId, status });
  } catch (error) {
    console.error("Falha ao consultar Pix no Mercado Pago", error);
    return Response.json(
      { error: "Não foi possível consultar o pagamento agora." },
      { status: 502 },
    );
  }
}
