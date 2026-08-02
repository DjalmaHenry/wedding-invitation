import {
  deleteDeletableGiftPayment,
  listGiftPayments,
} from "../../../../db/gift-payments";
import { hasValidAdminSession } from "../../../../lib/admin-auth";

export async function GET(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  return Response.json({ payments: await listGiftPayments() });
}

export async function DELETE(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ error: "Pagamento inválido." }, { status: 400 });
  }

  const deleted = await deleteDeletableGiftPayment(id);
  if (!deleted) {
    return Response.json(
      { error: "Somente pagamentos pendentes ou expirados podem ser apagados." },
      { status: 409 },
    );
  }

  return Response.json({ ok: true });
}
