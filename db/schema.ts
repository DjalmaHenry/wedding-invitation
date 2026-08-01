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

export const weddingExpenses = sqliteTable(
  "wedding_expenses",
  {
    id: text("id").primaryKey(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    paymentType: text("payment_type", {
      enum: ["pix_paid", "installments", "pix_pending"],
    }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    installmentsTotal: integer("installments_total").notNull().default(0),
    installmentsPaid: integer("installments_paid").notNull().default(0),
    dueDate: text("due_date"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("wedding_expenses_category_idx").on(table.category),
    index("wedding_expenses_payment_type_idx").on(table.paymentType),
    index("wedding_expenses_created_at_idx").on(table.createdAt),
    check("wedding_expenses_amount_check", sql`${table.amountCents} > 0`),
    check(
      "wedding_expenses_payment_type_check",
      sql`${table.paymentType} IN ('pix_paid', 'installments', 'pix_pending')`,
    ),
    check(
      "wedding_expenses_installments_check",
      sql`${table.installmentsTotal} >= 0 AND ${table.installmentsPaid} >= 0 AND ${table.installmentsPaid} <= ${table.installmentsTotal}`,
    ),
  ],
);

export const expenseCategories = sqliteTable(
  "expense_categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("expense_categories_name_idx").on(table.name)],
);

export const weddingChecklist = sqliteTable(
  "wedding_checklist",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    completed: integer("completed", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("wedding_checklist_completed_idx").on(table.completed),
    index("wedding_checklist_created_at_idx").on(table.createdAt),
  ],
);

export const weddingTimeline = sqliteTable(
  "wedding_timeline",
  {
    id: text("id").primaryKey(),
    time: text("time").notNull(),
    title: text("title").notNull(),
    details: text("details").notNull().default(""),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("wedding_timeline_time_idx").on(table.time),
  ],
);

export const serviceProviders = sqliteTable(
  "service_providers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("service_providers_created_at_idx").on(table.createdAt),
    index("service_providers_name_idx").on(table.name),
  ],
);
