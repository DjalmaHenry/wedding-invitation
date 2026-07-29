import { listGiftPayments } from "../../../../db/gift-payments";
import { hasValidAdminSession } from "../../../../lib/admin-auth";

export async function GET(request: Request) {
  if (!(await hasValidAdminSession(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  return Response.json({ payments: await listGiftPayments() });
}
