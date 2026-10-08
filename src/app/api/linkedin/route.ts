import { getLinkedInOptimization, getOrCreateProfile, saveLinkedInOptimization } from "@/db/queries";
import { optimizeLinkedInProfile } from "@/lib/agents/linkedinOptimizer";
import type { Profile } from "@/lib/agents/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const profile: Profile = body?.profile ?? (await getOrCreateProfile());
  const roleTarget: string = body?.roleTarget?.trim() || profile.skills[0] || "Specialist";

  // Check cached optimization
  const cached = await getLinkedInOptimization(roleTarget);
  if (cached && !body?.force) {
    return Response.json({ package: cached, isCached: true });
  }

  const generated = optimizeLinkedInProfile(roleTarget, profile);
  const saved = await saveLinkedInOptimization(generated);

  return Response.json({ package: saved, isCached: false });
}
