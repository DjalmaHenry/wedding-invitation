import { env } from "cloudflare:workers";

const MERCADO_PAGO_API_URL = "https://api.mercadopago.com";
export const CANONICAL_SITE_URL = "https://victoriasandy.djalmahenry.com";

type RuntimeEnv = {
  MP_ACCESS_TOKEN?: string;
};

export type MercadoPagoPayment = {
  id?: number | string;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  date_created?: string;
  date_approved?: string | null;
  date_of_expiration?: string | null;
  transaction_amount?: number;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
};

function getAccessToken(): string {
  const token = (env as unknown as RuntimeEnv).MP_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("MERCADO_PAGO_NOT_CONFIGURED");
  }
  return token;
}

async function mercadoPagoRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${MERCADO_PAGO_API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const data = (await response.json().catch(() => null)) as
    | (T & { message?: string; error?: string })
    | null;

  if (!response.ok || !data) {
    const reason =
      data?.message || data?.error || `Mercado Pago respondeu ${response.status}`;
    throw new Error(`MERCADO_PAGO_REQUEST_FAILED:${reason}`);
  }

  return data;
}

export async function createMercadoPagoPix(input: {
  amount: number;
  description: string;
  donorName: string;
  donorEmail: string;
  externalReference: string;
  idempotencyKey: string;
}): Promise<MercadoPagoPayment> {
  const [firstName, ...lastNameParts] = input.donorName.trim().split(/\s+/);
  const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return mercadoPagoRequest<MercadoPagoPayment>("/v1/payments", {
    method: "POST",
    headers: {
      "X-Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      transaction_amount: input.amount,
      description: input.description,
      payment_method_id: "pix",
      external_reference: input.externalReference,
      notification_url: `${CANONICAL_SITE_URL}/api/mercado-pago/webhook`,
      date_of_expiration: expiration,
      payer: {
        email: input.donorEmail,
        first_name: firstName,
        last_name: lastNameParts.join(" ") || firstName,
      },
      metadata: {
        gift_reference: input.externalReference,
      },
    }),
  });
}

export async function getMercadoPagoPayment(
  paymentId: string,
): Promise<MercadoPagoPayment> {
  if (!/^\d{1,30}$/.test(paymentId)) {
    throw new Error("INVALID_MERCADO_PAGO_PAYMENT_ID");
  }
  return mercadoPagoRequest<MercadoPagoPayment>(`/v1/payments/${paymentId}`);
}

export function normalizePaymentStatus(status?: string): string {
  const knownStatuses = new Set([
    "pending",
    "approved",
    "authorized",
    "in_process",
    "in_mediation",
    "rejected",
    "cancelled",
    "refunded",
    "charged_back",
  ]);
  return status && knownStatuses.has(status) ? status : "pending";
}
