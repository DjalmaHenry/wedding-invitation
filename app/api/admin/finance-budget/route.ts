import {
  getFinanceBudget,
  updateFinanceBudget,
} from "../../../../db/admin-dashboard";
import { hasValidAdminSession } from "../../../../lib/admin-auth";

export async function GET(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  return Response.json({ budget: await getFinanceBudget() });
}

export async function PATCH(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const totalPlannedCents = Number(body.totalPlannedCents);
  if (
    !Number.isSafeInteger(totalPlannedCents) ||
    totalPlannedCents <= 0 ||
    totalPlannedCents > 100_000_000_000
  ) {
    return Response.json(
      { error: "Informe um orçamento planejado válido." },
      { status: 400 },
    );
  }
  return Response.json({ budget: await updateFinanceBudget(totalPlannedCents) });
}
