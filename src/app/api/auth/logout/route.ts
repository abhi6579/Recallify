import { parseSessionTokenFromRequest, sessionCookie, signOutSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = parseSessionTokenFromRequest(request);
  if (token) {
    await signOutSession(token);
  }

  const headers = new Headers();
  headers.append("Set-Cookie", sessionCookie("", request, 0));

  return Response.json({ ok: true }, { headers });
}
