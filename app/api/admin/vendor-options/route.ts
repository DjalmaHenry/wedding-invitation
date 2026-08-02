import {
  createVendorOption,
  deleteVendorOption,
  listVendorOptions,
} from "../../../../db/admin-dashboard";
import { hasValidAdminSession } from "../../../../lib/admin-auth";

export async function GET(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  return Response.json({ options: await listVendorOptions() });
}

export async function POST(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const category = String(body.category ?? "").trim().replace(/\s+/g, " ");
  const name = String(body.name ?? "").trim().replace(/\s+/g, " ");
  const benefits = String(body.benefits ?? "").trim();
  const hours = Number(body.hours);
  const amountCents = Number(body.amountCents);

  if (
    category.length < 2 ||
    category.length > 80 ||
    name.length < 2 ||
    name.length > 120 ||
    benefits.length < 2 ||
    benefits.length > 1000 ||
    !Number.isInteger(hours) ||
    hours < 1 ||
    hours > 240 ||
    !Number.isInteger(amountCents) ||
    amountCents < 1
  ) {
    return Response.json({ error: "Preencha os dados da opção corretamente." }, { status: 400 });
  }

  const option = await createVendorOption({
    category,
    name,
    hours,
    amountCents,
    benefits,
  });
  return Response.json({ option }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) return Response.json({ error: "Registro inválido." }, { status: 400 });
  return Response.json({ ok: await deleteVendorOption(id) });
}
