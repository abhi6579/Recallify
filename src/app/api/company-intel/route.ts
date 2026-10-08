import { getCompanyBrief, getOrCreateProfile, saveCompanyBrief } from "@/db/queries";
import { generateCompanyIntel } from "@/lib/agents/companyIntel";
import type { Profile } from "@/lib/agents/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const companyName: string = body?.companyName?.trim() || "";
  const jobDescription: string = body?.jobDescription || "";
  const profile: Profile = body?.profile ?? (await getOrCreateProfile());

  if (!companyName) {
    return Response.json({ error: "companyName is required" }, { status: 400 });
  }

  // Check cache in DB first
  const cached = await getCompanyBrief(companyName);
  if (cached) {
    return Response.json({ brief: cached, isCached: true });
  }

  // Generate fresh intel brief
  const brief = await generateCompanyIntel(companyName, profile, jobDescription);
  const saved = await saveCompanyBrief(brief);

  return Response.json({ brief: saved, isCached: false });
}
