import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpenseInstallments,
  type ExpensePaymentType,
} from "../../../../db/admin-dashboard";
import { hasValidAdminSession } from "../../../../lib/admin-auth";

const paymentTypes: ExpensePaymentType[] = [
  "pix_paid",
  "installments",
  "pix_pending",
];

async function authorized(request: Request) {
  return hasValidAdminSession(request);
}

export async function GET(request: Request) {
  if (!(await authorized(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  return Response.json({ expenses: await listExpenses() });
}

export async function POST(request: Request) {
  if (!(await authorized(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const description = String(body.description ?? "").trim();
  const category = String(body.category ?? "").trim();
  const paymentType = String(body.paymentType ?? "") as ExpensePaymentType;
  const amountCents = Number(body.amountCents);
  const installmentsTotal =
    paymentType === "installments" ? Number(body.installmentsTotal) : 0;
  const installmentsPaid =
    paymentType === "installments" ? Number(body.installmentsPaid ?? 0) : 0;
  const dueDateValue = String(body.dueDate ?? "").trim();
  const dueDate = dueDateValue || null;

  if (
    description.length < 2 ||
    description.length > 120 ||
    category.length < 2 ||
    category.length > 60 ||
    !paymentTypes.includes(paymentType) ||
    !Number.isInteger(amountCents) ||
    amountCents <= 0 ||
    (dueDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) ||
    (paymentType === "installments" &&
      (!Number.isInteger(installmentsTotal) ||
        installmentsTotal < 1 ||
        installmentsTotal > 120 ||
        !Number.isInteger(installmentsPaid) ||
        installmentsPaid < 0 ||
        installmentsPaid > installmentsTotal))
  ) {
    return Response.json({ error: "Dados da despesa inválidos." }, { status: 400 });
  }

  return Response.json(
    {
      expense: await createExpense({
        description,
        category,
        paymentType,
        amountCents,
        installmentsTotal,
        installmentsPaid,
        dueDate,
      }),
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  if (!(await authorized(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const id = String(body.id ?? "").trim();
  const installmentsPaid = Number(body.installmentsPaid);
  if (!id || !Number.isInteger(installmentsPaid) || installmentsPaid < 0) {
    return Response.json({ error: "Atualização inválida." }, { status: 400 });
  }
  const updated = await updateExpenseInstallments(id, installmentsPaid);
  return Response.json({ ok: updated }, { status: updated ? 200 : 400 });
}

export async function DELETE(request: Request) {
  if (!(await authorized(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) return Response.json({ error: "Registro inválido." }, { status: 400 });
  return Response.json({ ok: await deleteExpense(id) });
}
