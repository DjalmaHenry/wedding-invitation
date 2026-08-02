import { env } from "cloudflare:workers";

export type GiftPaymentStatus =
  | "pending"
  | "approved"
  | "authorized"
  | "in_process"
  | "in_mediation"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back";

export type GiftPaymentRecord = {
  id: string;
  mercadoPagoOrderId: string;
  mercadoPagoPaymentId: string | null;
  externalReference: string;
  giftId: string;
  giftTitle: string;
  donorName: string;
  donorEmail: string;
  amountCents: number;
  status: string;
  statusDetail: string | null;
  ticketUrl: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
};

type RuntimeEnv = {
  DB?: D1Database;
};

function getD1(): D1Database {
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) {
    throw new Error("O banco de presentes não está disponível.");
  }
  return database;
}

export async function createGiftPayment(input: {
  mercadoPagoOrderId: string;
  mercadoPagoPaymentId?: string | null;
  externalReference: string;
  giftId: string;
  giftTitle: string;
  donorName: string;
  donorEmail: string;
  amountCents: number;
  status: string;
  statusDetail?: string | null;
  ticketUrl?: string | null;
  createdAt?: string;
}): Promise<void> {
  const createdAt = input.createdAt ?? new Date().toISOString();
  await getD1()
    .prepare(
      `INSERT INTO gift_payments (
        id,
        mercado_pago_order_id,
        mercado_pago_payment_id,
        external_reference,
        gift_id,
        gift_title,
        donor_name,
        donor_email,
        amount_cents,
        status,
        status_detail,
        ticket_url,
        created_at,
        updated_at,
        paid_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)`,
    )
    .bind(
      crypto.randomUUID(),
      input.mercadoPagoOrderId,
      input.mercadoPagoPaymentId ?? null,
      input.externalReference,
      input.giftId,
      input.giftTitle,
      input.donorName,
      input.donorEmail,
      input.amountCents,
      input.status,
      input.statusDetail ?? null,
      input.ticketUrl ?? null,
      createdAt,
      createdAt,
      input.status === "approved" ? createdAt : null,
    )
    .run();
}

export async function findGiftPaymentByMercadoPagoOrderId(
  mercadoPagoOrderId: string,
): Promise<GiftPaymentRecord | null> {
  return (
    (await getD1()
      .prepare(
        `SELECT
          id,
          mercado_pago_order_id AS mercadoPagoOrderId,
          mercado_pago_payment_id AS mercadoPagoPaymentId,
          external_reference AS externalReference,
          gift_id AS giftId,
          gift_title AS giftTitle,
          donor_name AS donorName,
          donor_email AS donorEmail,
          amount_cents AS amountCents,
          status,
          status_detail AS statusDetail,
          ticket_url AS ticketUrl,
          created_at AS createdAt,
          updated_at AS updatedAt,
          paid_at AS paidAt
        FROM gift_payments
        WHERE mercado_pago_order_id = ?1
        LIMIT 1`,
      )
      .bind(mercadoPagoOrderId)
      .first<GiftPaymentRecord>()) ?? null
  );
}

export async function updateGiftPaymentStatus(input: {
  mercadoPagoOrderId: string;
  externalReference: string;
  status: string;
  statusDetail?: string | null;
  paidAt?: string | null;
}): Promise<boolean> {
  const updatedAt = new Date().toISOString();
  const result = await getD1()
    .prepare(
      `UPDATE gift_payments
      SET
        status = ?1,
        status_detail = ?2,
        updated_at = ?3,
        paid_at = CASE
          WHEN ?1 = 'approved' THEN COALESCE(?4, paid_at, ?3)
          ELSE paid_at
        END
      WHERE mercado_pago_order_id = ?5
        AND external_reference = ?6`,
    )
    .bind(
      input.status,
      input.statusDetail ?? null,
      updatedAt,
      input.paidAt ?? null,
      input.mercadoPagoOrderId,
      input.externalReference,
    )
    .run();

  return (result.meta.changes ?? 0) > 0;
}

export async function listGiftPayments(): Promise<GiftPaymentRecord[]> {
  const result = await getD1()
    .prepare(
      `SELECT
        id,
        mercado_pago_order_id AS mercadoPagoOrderId,
        mercado_pago_payment_id AS mercadoPagoPaymentId,
        external_reference AS externalReference,
        gift_id AS giftId,
        gift_title AS giftTitle,
        donor_name AS donorName,
        donor_email AS donorEmail,
        amount_cents AS amountCents,
        status,
        status_detail AS statusDetail,
        ticket_url AS ticketUrl,
        created_at AS createdAt,
        updated_at AS updatedAt,
        paid_at AS paidAt
      FROM gift_payments
      ORDER BY
        CASE status WHEN 'approved' THEN 0 ELSE 1 END,
        COALESCE(paid_at, created_at) DESC`,
    )
    .all<GiftPaymentRecord>();

  return result.results ?? [];
}

export async function deleteDeletableGiftPayment(id: string): Promise<boolean> {
  const result = await getD1()
    .prepare(
      `DELETE FROM gift_payments
      WHERE id = ?1
        AND status IN ('pending', 'in_process', 'authorized', 'cancelled')`,
    )
    .bind(id)
    .run();

  return (result.meta.changes ?? 0) > 0;
}
