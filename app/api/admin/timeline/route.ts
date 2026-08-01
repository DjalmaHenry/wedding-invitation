import {
  createTimelineItem,
  deleteTimelineItem,
  listTimelineItems,
} from "../../../../db/admin-dashboard";
import { hasValidAdminSession } from "../../../../lib/admin-auth";

export async function GET(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  return Response.json({ items: await listTimelineItems() });
}

export async function POST(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const time = String(body.time ?? "").trim();
  const title = String(body.title ?? "").trim();
  const details = String(body.details ?? "").trim();
  if (
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time) ||
    title.length < 2 ||
    title.length > 120 ||
    details.length > 500
  ) {
    return Response.json({ error: "Etapa inválida." }, { status: 400 });
  }
  return Response.json(
    { item: await createTimelineItem({ time, title, details }) },
    { status: 201 },
  );
}

export async function DELETE(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) return Response.json({ error: "Registro inválido." }, { status: 400 });
  return Response.json({ ok: await deleteTimelineItem(id) });
}
