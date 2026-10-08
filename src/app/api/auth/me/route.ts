import { getUserFromToken, parseSessionTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = parseSessionTokenFromRequest(request);
  if (!token) {
    return Response.json({ user: null });
  }

  const user = await getUserFromToken(token);
  return Response.json({ user });
}
