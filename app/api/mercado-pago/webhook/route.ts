import {
  findGiftPaymentByMercadoPagoId,
  updateGiftPaymentStatus,
} from "../../../../db/gift-payments";
import {
  getMercadoPagoPayment,
  normalizePaymentStatus,
} from "../../../../lib/mercado-pago";

type WebhookPayload = {
  data?: {
    id?: unknown;
  };
};

export async function POST(request: Request) {
  const url = new URL(request.url);
  let paymentId =
    url.searchParams.get("data.id")?.trim() ??
    url.searchParams.get("id")?.trim() ??
    "";

  if (!paymentId) {
    try {
      const payload = (await request.json()) as WebhookPayload;
      paymentId =
        typeof payload.data?.id === "string" ||
        typeof payload.data?.id === "number"
          ? String(payload.data.id)
          : "";
    } catch {
      return Response.json({ ok: true });
    }
  }

  if (!/^\d{1,30}$/.test(paymentId)) {
    return Response.json({ ok: true });
  }

  try {
    const record = await findGiftPaymentByMercadoPagoId(paymentId);
    if (!record) return Response.json({ ok: true });

    // The notification is never trusted by itself: the payment is read back
    // from Mercado Pago and must match a reference already stored by this site.
    const payment = await getMercadoPagoPayment(paymentId);
    if (payment.external_reference !== record.externalReference) {
      return Response.json({ ok: true });
    }

    await updateGiftPaymentStatus({
      mercadoPagoPaymentId: paymentId,
      externalReference: record.externalReference,
      status: normalizePaymentStatus(payment.status),
      statusDetail: payment.status_detail ?? null,
      paidAt: payment.date_approved ?? null,
    });
  } catch (error) {
    console.error("Falha ao processar webhook do Mercado Pago", error);
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({ ok: true });
}
