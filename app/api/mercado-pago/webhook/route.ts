import {
  findGiftPaymentByMercadoPagoOrderId,
  updateGiftPaymentStatus,
} from "../../../../db/gift-payments";
import {
  getMercadoPagoOrder,
  normalizeOrderStatus,
} from "../../../../lib/mercado-pago";

type WebhookPayload = {
  data?: {
    id?: unknown;
  };
};

export async function POST(request: Request) {
  const url = new URL(request.url);
  let orderId =
    url.searchParams.get("data.id")?.trim() ??
    url.searchParams.get("id")?.trim() ??
    "";

  if (!orderId) {
    try {
      const payload = (await request.json()) as WebhookPayload;
      orderId =
        typeof payload.data?.id === "string" ||
        typeof payload.data?.id === "number"
          ? String(payload.data.id)
          : "";
    } catch {
      return Response.json({ ok: true });
    }
  }

  if (!/^ORD[A-Z0-9]{20,50}$/i.test(orderId)) {
    return Response.json({ ok: true });
  }

  try {
    const record = await findGiftPaymentByMercadoPagoOrderId(orderId);
    if (!record) return Response.json({ ok: true });

    // The notification is never trusted by itself: the payment is read back
    // from Mercado Pago and must match a reference already stored by this site.
    const order = await getMercadoPagoOrder(orderId);
    if (order.external_reference !== record.externalReference) {
      return Response.json({ ok: true });
    }

    await updateGiftPaymentStatus({
      mercadoPagoOrderId: orderId,
      externalReference: record.externalReference,
      status: normalizeOrderStatus(order.status),
      statusDetail: order.status_detail ?? null,
      paidAt:
        order.status === "processed" ? order.last_updated_date ?? null : null,
    });
  } catch (error) {
    console.error("Falha ao processar webhook do Mercado Pago", error);
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({ ok: true });
}
