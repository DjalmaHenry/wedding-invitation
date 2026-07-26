import {
  createAdminSessionCookie,
  verifyAdminPassword,
} from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Formato inválido." }, { status: 415 });
  }

  let password = "";
  try {
    const payload = (await request.json()) as { password?: unknown };
    password = typeof payload.password === "string" ? payload.password : "";
  } catch {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (!(await verifyAdminPassword(password))) {
    return Response.json({ error: "Senha incorreta." }, { status: 401 });
  }

  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": await createAdminSessionCookie(),
      },
    },
  );
}
