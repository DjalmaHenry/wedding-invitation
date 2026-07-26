import { replaceGuestSubmission, type GuestCategory } from "../../../db/guests";

type RsvpPayload = {
  submissionId?: unknown;
  names?: unknown;
  category?: unknown;
};

const NAME_MAXIMUM_LENGTH = 120;
const MAXIMUM_NAMES_PER_SUBMISSION = 50;

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Formato inválido." }, { status: 415 });
  }

  let payload: RsvpPayload;
  try {
    payload = (await request.json()) as RsvpPayload;
  } catch {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const submissionId =
    typeof payload.submissionId === "string"
      ? payload.submissionId.trim()
      : "";
  const category =
    payload.category === "noivo" || payload.category === "noiva"
      ? (payload.category as GuestCategory)
      : null;
  const names = Array.isArray(payload.names)
    ? payload.names
        .filter((name): name is string => typeof name === "string")
        .map((name) => name.trim().replace(/\s+/g, " "))
        .filter(Boolean)
    : [];

  if (
    !/^[a-f0-9-]{36}$/i.test(submissionId) ||
    !category ||
    names.length === 0 ||
    names.length > MAXIMUM_NAMES_PER_SUBMISSION ||
    names.some((name) => name.length > NAME_MAXIMUM_LENGTH)
  ) {
    return Response.json(
      { error: "Revise os nomes e a categoria selecionada." },
      { status: 400 },
    );
  }

  await replaceGuestSubmission({ submissionId, names, category });
  return Response.json({ ok: true, saved: names.length });
}
