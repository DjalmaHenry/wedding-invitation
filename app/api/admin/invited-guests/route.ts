import {
  createInvitedGuests,
  deleteInvitedGuest,
  listInvitedGuests,
} from "../../../../db/guests";
import { hasValidAdminSession } from "../../../../lib/admin-auth";

function normalizeReferenceName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function formatReferenceName(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((namePart) =>
      namePart
        ? namePart.charAt(0).toLocaleUpperCase("pt-BR") +
          namePart.slice(1).toLocaleLowerCase("pt-BR")
        : "",
    )
    .filter(Boolean)
    .join(" ");
}

export async function GET(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  return Response.json({ invitedGuests: await listInvitedGuests() });
}

export async function POST(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const rawNames = Array.isArray(body.names) ? body.names : [];
  const names = rawNames
    .slice(0, 100)
    .map((value) => formatReferenceName(String(value)))
    .filter((name) => name.length >= 2 && name.length <= 50)
    .map((firstName) => ({
      firstName,
      normalizedFirstName: normalizeReferenceName(firstName),
    }));
  if (names.length === 0) {
    return Response.json(
      { error: "Informe ao menos um nome de referência válido." },
      { status: 400 },
    );
  }
  return Response.json(
    { invitedGuests: await createInvitedGuests(names) },
    { status: 201 },
  );
}

export async function DELETE(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return Response.json({ error: "Registro inválido." }, { status: 400 });
  }
  return Response.json({ ok: await deleteInvitedGuest(id) });
}
