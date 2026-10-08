import { getAdminOverview, setUserActive } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return Response.json({ error: "Administrator access required." }, { status: 403 });
  }

  const overview = await getAdminOverview();
  return Response.json({ admin, overview }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return Response.json({ error: "Administrator access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const userId = Number(body?.userId);
    if (!userId || typeof body?.active !== "boolean") {
      return Response.json({ error: "userId and active are required." }, { status: 400 });
    }

    const user = await setUserActive(userId, body.active);
    if (!user) return Response.json({ error: "User not found." }, { status: 404 });
    return Response.json({ user });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Account update failed." },
      { status: 400 },
    );
  }
}
