import { getOrCreateProfile, saveProfile } from "@/db/queries";
import { getUserFromToken, parseSessionTokenFromRequest } from "@/lib/auth";
import type { Profile } from "@/lib/agents/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = parseSessionTokenFromRequest(request);
  const user = token ? await getUserFromToken(token) : null;
  const profile = await getOrCreateProfile(user?.id);
  return Response.json({ profile, user });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Profile;
  if (!body || typeof body.name !== "string") {
    return Response.json({ error: "Invalid profile payload" }, { status: 400 });
  }

  const token = parseSessionTokenFromRequest(request);
  const user = token ? await getUserFromToken(token) : null;
  const saved = await saveProfile(body, user?.id);
  return Response.json({ profile: saved, user });
}
