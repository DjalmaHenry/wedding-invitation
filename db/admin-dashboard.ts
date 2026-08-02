import { env } from "cloudflare:workers";

export type ExpensePaymentType =
  | "pix_paid"
  | "installments"
  | "pix_pending";

export type ExpenseRecord = {
  id: string;
  description: string;
  category: string;
  paymentType: ExpensePaymentType;
  amountCents: number;
  downPaymentCents: number;
  installmentsTotal: number;
  installmentsPaid: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseCategoryRecord = {
  id: string;
  name: string;
  createdAt: string;
};

export type FinanceBudgetRecord = {
  totalPlannedCents: number;
  updatedAt: string;
};

export type ChecklistRecord = {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TimelineRecord = {
  id: string;
  time: string;
  title: string;
  details: string;
  createdAt: string;
  updatedAt: string;
};

export type ServiceProviderRecord = {
  id: string;
  name: string;
  role: string;
  createdAt: string;
};

export type VendorOptionRecord = {
  id: string;
  category: string;
  name: string;
  hours: number;
  amountCents: number;
  benefits: string;
  createdAt: string;
};

type RuntimeEnv = { DB?: D1Database };

function getD1(): D1Database {
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) throw new Error("O banco do painel não está disponível.");
  return database;
}

export async function listExpenses(): Promise<ExpenseRecord[]> {
  const result = await getD1()
    .prepare(
      `SELECT id, description, category,
        payment_type AS paymentType,
        amount_cents AS amountCents,
        down_payment_cents AS downPaymentCents,
        installments_total AS installmentsTotal,
        installments_paid AS installmentsPaid,
        due_date AS dueDate,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM wedding_expenses
      ORDER BY created_at DESC`,
    )
    .all<ExpenseRecord>();
  return result.results ?? [];
}

export async function createExpense(input: {
  description: string;
  category: string;
  paymentType: ExpensePaymentType;
  amountCents: number;
  downPaymentCents: number;
  installmentsTotal: number;
  installmentsPaid: number;
  dueDate: string | null;
}): Promise<ExpenseRecord> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await getD1()
    .prepare(
      `INSERT INTO wedding_expenses (
        id, description, category, payment_type, amount_cents,
        down_payment_cents, installments_total, installments_paid, due_date,
        created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
    )
    .bind(
      id,
      input.description,
      input.category,
      input.paymentType,
      input.amountCents,
      input.downPaymentCents,
      input.installmentsTotal,
      input.installmentsPaid,
      input.dueDate,
      now,
      now,
    )
    .run();
  return { id, ...input, createdAt: now, updatedAt: now };
}

export async function updateExpenseInstallments(
  id: string,
  installmentsPaid: number,
): Promise<boolean> {
  const result = await getD1()
    .prepare(
      `UPDATE wedding_expenses
       SET installments_paid = ?2, updated_at = ?3
       WHERE id = ?1 AND payment_type = 'installments'
         AND ?2 >= 0 AND ?2 <= installments_total`,
    )
    .bind(id, installmentsPaid, new Date().toISOString())
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function deleteExpense(id: string): Promise<boolean> {
  const result = await getD1()
    .prepare("DELETE FROM wedding_expenses WHERE id = ?1")
    .bind(id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function listExpenseCategories(): Promise<ExpenseCategoryRecord[]> {
  const result = await getD1()
    .prepare(
      `SELECT id, name, created_at AS createdAt
       FROM expense_categories
       ORDER BY name COLLATE NOCASE ASC`,
    )
    .all<ExpenseCategoryRecord>();
  return result.results ?? [];
}

export async function createExpenseCategory(
  name: string,
): Promise<ExpenseCategoryRecord | null> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const result = await getD1()
    .prepare(
      `INSERT INTO expense_categories (id, name, created_at)
       SELECT ?1, ?2, ?3
       WHERE NOT EXISTS (
         SELECT 1 FROM expense_categories WHERE LOWER(name) = LOWER(?2)
       )`,
    )
    .bind(id, name, createdAt)
    .run();
  if ((result.meta.changes ?? 0) === 0) return null;
  return { id, name, createdAt };
}

export async function getFinanceBudget(): Promise<FinanceBudgetRecord> {
  const record = await getD1()
    .prepare(
      `SELECT total_planned_cents AS totalPlannedCents,
        updated_at AS updatedAt
       FROM wedding_finance_settings
       WHERE id = 'main'`,
    )
    .first<FinanceBudgetRecord>();
  return record ?? { totalPlannedCents: 0, updatedAt: "" };
}

export async function updateFinanceBudget(
  totalPlannedCents: number,
): Promise<FinanceBudgetRecord> {
  const updatedAt = new Date().toISOString();
  await getD1()
    .prepare(
      `INSERT INTO wedding_finance_settings
       (id, total_planned_cents, updated_at)
       VALUES ('main', ?1, ?2)
       ON CONFLICT(id) DO UPDATE SET
         total_planned_cents = excluded.total_planned_cents,
         updated_at = excluded.updated_at`,
    )
    .bind(totalPlannedCents, updatedAt)
    .run();
  return { totalPlannedCents, updatedAt };
}

export async function listChecklistItems(): Promise<ChecklistRecord[]> {
  const result = await getD1()
    .prepare(
      `SELECT id, title, completed, created_at AS createdAt,
        due_date AS dueDate, updated_at AS updatedAt
      FROM wedding_checklist
      ORDER BY completed ASC,
        CASE WHEN due_date IS NULL THEN 1 ELSE 0 END ASC,
        due_date ASC, created_at DESC`,
    )
    .all<Omit<ChecklistRecord, "completed"> & { completed: number }>();
  return (result.results ?? []).map((item) => ({
    ...item,
    completed: item.completed === 1,
  }));
}

export async function createChecklistItem(
  title: string,
  dueDate: string,
): Promise<ChecklistRecord> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await getD1()
    .prepare(
      `INSERT INTO wedding_checklist
      (id, title, completed, due_date, created_at, updated_at)
       VALUES (?1, ?2, 0, ?3, ?4, ?4)`,
    )
    .bind(id, title, dueDate, now)
    .run();
  return { id, title, completed: false, dueDate, createdAt: now, updatedAt: now };
}

export async function updateChecklistItem(
  id: string,
  completed: boolean,
): Promise<boolean> {
  const result = await getD1()
    .prepare(
      `UPDATE wedding_checklist
       SET completed = ?2, updated_at = ?3
       WHERE id = ?1`,
    )
    .bind(id, completed ? 1 : 0, new Date().toISOString())
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function updateChecklistDueDate(
  id: string,
  dueDate: string,
): Promise<boolean> {
  const result = await getD1()
    .prepare(
      `UPDATE wedding_checklist
       SET due_date = ?2, updated_at = ?3
       WHERE id = ?1`,
    )
    .bind(id, dueDate, new Date().toISOString())
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function deleteChecklistItem(id: string): Promise<boolean> {
  const result = await getD1()
    .prepare("DELETE FROM wedding_checklist WHERE id = ?1")
    .bind(id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function listTimelineItems(): Promise<TimelineRecord[]> {
  const result = await getD1()
    .prepare(
      `SELECT id, time, title, details, created_at AS createdAt,
        updated_at AS updatedAt
      FROM wedding_timeline
      ORDER BY time ASC, created_at ASC`,
    )
    .all<TimelineRecord>();
  return result.results ?? [];
}

export async function createTimelineItem(input: {
  time: string;
  title: string;
  details: string;
}): Promise<TimelineRecord> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await getD1()
    .prepare(
      `INSERT INTO wedding_timeline
       (id, time, title, details, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?5)`,
    )
    .bind(id, input.time, input.title, input.details, now)
    .run();
  return { id, ...input, createdAt: now, updatedAt: now };
}

export async function deleteTimelineItem(id: string): Promise<boolean> {
  const result = await getD1()
    .prepare("DELETE FROM wedding_timeline WHERE id = ?1")
    .bind(id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function listServiceProviders(): Promise<ServiceProviderRecord[]> {
  const result = await getD1()
    .prepare(
      `SELECT id, name, role, created_at AS createdAt
       FROM service_providers
       ORDER BY name COLLATE NOCASE ASC`,
    )
    .all<ServiceProviderRecord>();
  return result.results ?? [];
}

export async function createServiceProvider(input: {
  name: string;
  role: string;
}): Promise<ServiceProviderRecord | null> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const result = await getD1()
    .prepare(
      `INSERT INTO service_providers (id, name, role, created_at)
       SELECT ?1, ?2, ?3, ?4
       WHERE (
         (SELECT COUNT(*) FROM guests) +
         (SELECT COUNT(*) FROM service_providers)
       ) < 50`,
    )
    .bind(id, input.name, input.role, createdAt)
    .run();
  if ((result.meta.changes ?? 0) === 0) return null;
  return { id, ...input, createdAt };
}

export async function deleteServiceProvider(id: string): Promise<boolean> {
  const result = await getD1()
    .prepare("DELETE FROM service_providers WHERE id = ?1")
    .bind(id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function listVendorOptions(): Promise<VendorOptionRecord[]> {
  const result = await getD1()
    .prepare(
      `SELECT id, category, name, hours, amount_cents AS amountCents,
        benefits, created_at AS createdAt
       FROM vendor_options
       ORDER BY category COLLATE NOCASE ASC, amount_cents ASC, name COLLATE NOCASE ASC`,
    )
    .all<VendorOptionRecord>();
  return result.results ?? [];
}

export async function createVendorOption(input: {
  category: string;
  name: string;
  hours: number;
  amountCents: number;
  benefits: string;
}): Promise<VendorOptionRecord> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await getD1()
    .prepare(
      `INSERT INTO vendor_options
       (id, category, name, hours, amount_cents, benefits, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
    )
    .bind(
      id,
      input.category,
      input.name,
      input.hours,
      input.amountCents,
      input.benefits,
      createdAt,
    )
    .run();
  return { id, ...input, createdAt };
}

export async function deleteVendorOption(id: string): Promise<boolean> {
  const result = await getD1()
    .prepare("DELETE FROM vendor_options WHERE id = ?1")
    .bind(id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}
