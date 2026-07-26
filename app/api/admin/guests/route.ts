import { deleteGuest, listGuests } from "../../../../db/guests";
import { hasValidAdminSession } from "../../../../lib/admin-auth";

export async function GET(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  return Response.json({ guests: await listGuests() });
}

export async function DELETE(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return Response.json({ error: "Registro inválido." }, { status: 400 });
  }

  const deleted = await deleteGuest(id);
  return Response.json({ ok: true, deleted });
}
