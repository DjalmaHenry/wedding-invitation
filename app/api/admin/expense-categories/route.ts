import {
  createExpenseCategory,
  listExpenseCategories,
} from "../../../../db/admin-dashboard";
import { hasValidAdminSession } from "../../../../lib/admin-auth";

async function authorized(request: Request) {
  return hasValidAdminSession(request);
}

export async function GET(request: Request) {
  if (!(await authorized(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  return Response.json({ categories: await listExpenseCategories() });
}

export async function POST(request: Request) {
  if (!(await authorized(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const name = String(body.name ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 60) {
    return Response.json(
      { error: "Informe uma categoria entre 2 e 60 caracteres." },
      { status: 400 },
    );
  }
  const category = await createExpenseCategory(name);
  if (!category) {
    return Response.json(
      { error: "Essa categoria já está cadastrada." },
      { status: 409 },
    );
  }
  return Response.json({ category }, { status: 201 });
}
