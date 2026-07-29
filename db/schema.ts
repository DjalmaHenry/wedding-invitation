import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const guests = sqliteTable(
  "guests",
  {
    id: text("id").primaryKey(),
    submissionId: text("submission_id").notNull(),
    name: text("name").notNull(),
    category: text("category", { enum: ["noivo", "noiva"] }).notNull(),
    isPrimary: integer("is_primary", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("guests_submission_id_idx").on(table.submissionId),
    index("guests_category_idx").on(table.category),
    index("guests_created_at_idx").on(table.createdAt),
    check(
      "guests_category_check",
      sql`${table.category} IN ('noivo', 'noiva')`,
    ),
  ],
);

export const giftPayments = sqliteTable(
  "gift_payments",
  {
    id: text("id").primaryKey(),
    mercadoPagoOrderId: text("mercado_pago_order_id").notNull().unique(),
    mercadoPagoPaymentId: text("mercado_pago_payment_id"),
    externalReference: text("external_reference").notNull().unique(),
    giftId: text("gift_id").notNull(),
    giftTitle: text("gift_title").notNull(),
    donorName: text("donor_name").notNull(),
    donorEmail: text("donor_email").notNull(),
    amountCents: integer("amount_cents").notNull(),
    status: text("status").notNull(),
    statusDetail: text("status_detail"),
    ticketUrl: text("ticket_url"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    paidAt: text("paid_at"),
  },
  (table) => [
    index("gift_payments_status_idx").on(table.status),
    index("gift_payments_created_at_idx").on(table.createdAt),
    index("gift_payments_donor_name_idx").on(table.donorName),
    check("gift_payments_amount_check", sql`${table.amountCents} > 0`),
  ],
);
