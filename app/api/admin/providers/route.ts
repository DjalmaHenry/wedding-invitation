import {
  createServiceProvider,
  deleteServiceProvider,
  listServiceProviders,
} from "../../../../db/admin-dashboard";
import { hasValidAdminSession } from "../../../../lib/admin-auth";

export async function GET(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  return Response.json({ providers: await listServiceProviders() });
}

export async function POST(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  const role = String(body.role ?? "").trim();
  if (name.length < 2 || name.length > 120 || role.length < 2 || role.length > 100) {
    return Response.json({ error: "Prestador inválido." }, { status: 400 });
  }
  const provider = await createServiceProvider({ name, role });
  if (!provider) {
    return Response.json(
      { error: "As 50 vagas já estão ocupadas." },
      { status: 409 },
    );
  }
  return Response.json({ provider }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) return Response.json({ error: "Registro inválido." }, { status: 400 });
  return Response.json({ ok: await deleteServiceProvider(id) });
}
