import { deleteGuest, listGuests, updateGuestName } from "../../../../db/guests";
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

export async function PATCH(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const name =
    typeof body.name === "string"
      ? body.name.trim().replace(/\s+/g, " ")
      : "";
  if (!id) {
    return Response.json({ error: "Convidado inválido." }, { status: 400 });
  }
  if (name.length < 2 || name.length > 100) {
    return Response.json(
      { error: "Informe um nome válido com até 100 caracteres." },
      { status: 400 },
    );
  }

  const guest = await updateGuestName(id, name);
  if (!guest) {
    return Response.json(
      { error: "Convidado confirmado não encontrado." },
      { status: 404 },
    );
  }
  return Response.json({ guest });
}
