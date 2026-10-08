import { changePassword, requireAdmin, sessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return Response.json({ error: "Administrator access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  try {
    await changePassword(admin.id, currentPassword, newPassword);
    const headers = new Headers();
    headers.append("Set-Cookie", sessionCookie("", request, 0));
    return Response.json({ ok: true, requiresLogin: true }, { headers });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Password change failed." },
      { status: 400 },
    );
  }
}
