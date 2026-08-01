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
  installmentsTotal: number;
  installmentsPaid: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChecklistRecord = {
  id: string;
  title: string;
  completed: boolean;
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
        installments_total, installments_paid, due_date, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
    )
    .bind(
      id,
      input.description,
      input.category,
      input.paymentType,
      input.amountCents,
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

export async function listChecklistItems(): Promise<ChecklistRecord[]> {
  const result = await getD1()
    .prepare(
      `SELECT id, title, completed, created_at AS createdAt,
        updated_at AS updatedAt
      FROM wedding_checklist
      ORDER BY completed ASC, created_at DESC`,
    )
    .all<Omit<ChecklistRecord, "completed"> & { completed: number }>();
  return (result.results ?? []).map((item) => ({
    ...item,
    completed: item.completed === 1,
  }));
}

export async function createChecklistItem(
  title: string,
): Promise<ChecklistRecord> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await getD1()
    .prepare(
      `INSERT INTO wedding_checklist
       (id, title, completed, created_at, updated_at)
       VALUES (?1, ?2, 0, ?3, ?3)`,
    )
    .bind(id, title, now)
    .run();
  return { id, title, completed: false, createdAt: now, updatedAt: now };
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
