import { env } from "cloudflare:workers";

const MERCADO_PAGO_API_URL = "https://api.mercadopago.com";

type RuntimeEnv = {
  MP_ACCESS_TOKEN?: string;
};

export type MercadoPagoOrder = {
  id?: string;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  created_date?: string;
  last_updated_date?: string;
  transactions?: {
    payments?: Array<{
      id?: string;
      status?: string;
      status_detail?: string;
      payment_method?: {
        id?: string;
        type?: string;
        qr_code?: string;
        qr_code_base64?: string;
        ticket_url?: string;
      };
    }>;
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

export async function createMercadoPagoPixOrder(input: {
  amount: number;
  donorEmail: string;
  externalReference: string;
  idempotencyKey: string;
}): Promise<MercadoPagoOrder> {
  const amount = input.amount.toFixed(2);

  return mercadoPagoRequest<MercadoPagoOrder>("/v1/orders", {
    method: "POST",
    headers: {
      "X-Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      type: "online",
      total_amount: amount,
      external_reference: input.externalReference,
      processing_mode: "automatic",
      transactions: {
        payments: [
          {
            amount,
            payment_method: {
              id: "pix",
              type: "bank_transfer",
            },
            expiration_time: "PT24H",
          },
        ],
      },
      payer: {
        email: input.donorEmail,
      },
    }),
  });
}

export async function getMercadoPagoOrder(
  orderId: string,
): Promise<MercadoPagoOrder> {
  if (!/^ORD[A-Z0-9]{20,50}$/i.test(orderId)) {
    throw new Error("INVALID_MERCADO_PAGO_ORDER_ID");
  }
  return mercadoPagoRequest<MercadoPagoOrder>(`/v1/orders/${orderId}`);
}

export function normalizeOrderStatus(status?: string): string {
  if (status === "processed") return "approved";
  if (status === "refunded") return "refunded";
  if (status === "charged_back") return "charged_back";
  if (status === "canceled" || status === "expired") return "cancelled";
  if (status === "failed") return "rejected";
  return "pending";
}
