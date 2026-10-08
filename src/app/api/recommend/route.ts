import { getOrCreateProfile, getRoleTemplates } from "@/db/queries";
import { runRecommender } from "@/lib/agents/recommender";
import { categoriesForFields } from "@/lib/agents/careerFields";
import type { Profile } from "@/lib/agents/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let profile: Profile;
  let category: string | undefined;
  try {
    const body = await request.json();
    profile = body?.profile ?? (await getOrCreateProfile());
    category = typeof body?.category === "string" ? body.category : undefined;
  } catch {
    profile = await getOrCreateProfile();
  }

  const all = await getRoleTemplates();

  // Career fields come first: an M.Pharma candidate is never matched against
  // engineering roles. An explicit sector filter narrows further within that.
  const fieldCategories = new Set(categoriesForFields(profile.careerFields ?? []));
  let scoped = fieldCategories.size > 0 ? all.filter((r) => fieldCategories.has(r.category)) : all;
  if (category) {
    const narrowed = scoped.filter((r) => r.category === category);
    if (narrowed.length > 0) scoped = narrowed;
  }

  const result = runRecommender(profile, scoped.length > 0 ? scoped : all);
  return Response.json({ ...result, scopedRoles: scoped.length, totalRoles: all.length });
}

export async function GET() {
  const profile = await getOrCreateProfile();
  const all = await getRoleTemplates();
  const fieldCategories = new Set(categoriesForFields(profile.careerFields ?? []));
  const scoped = fieldCategories.size > 0 ? all.filter((r) => fieldCategories.has(r.category)) : all;
  const result = runRecommender(profile, scoped.length > 0 ? scoped : all);
  return Response.json({ ...result, scopedRoles: scoped.length, totalRoles: all.length });
}
