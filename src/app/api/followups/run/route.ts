import { getOrCreateProfile, runFollowUpCheck } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function POST() {
  const profile = await getOrCreateProfile();
  const summary = await runFollowUpCheck(profile);
  return Response.json(summary);
}
