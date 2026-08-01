import {
  createChecklistItem,
  deleteChecklistItem,
  listChecklistItems,
  updateChecklistItem,
} from "../../../../db/admin-dashboard";
import { hasValidAdminSession } from "../../../../lib/admin-auth";

export async function GET(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  return Response.json({ items: await listChecklistItems() });
}

export async function POST(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  if (title.length < 2 || title.length > 160) {
    return Response.json({ error: "Item inválido." }, { status: 400 });
  }
  return Response.json(
    { item: await createChecklistItem(title) },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const id = String(body.id ?? "").trim();
  if (!id || typeof body.completed !== "boolean") {
    return Response.json({ error: "Atualização inválida." }, { status: 400 });
  }
  return Response.json({ ok: await updateChecklistItem(id, body.completed) });
}

export async function DELETE(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) return Response.json({ error: "Registro inválido." }, { status: 400 });
  return Response.json({ ok: await deleteChecklistItem(id) });
}
