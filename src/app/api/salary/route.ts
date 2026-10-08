import { getOrCreateProfile } from "@/db/queries";
import { buildSalaryReport } from "@/lib/agents/salaryCoach";
import type { Profile } from "@/lib/agents/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8);
  try {
    const body = await request.json().catch(() => ({}));
    const roleTitle: string = typeof body?.roleTitle === "string" ? body.roleTitle.trim() : "";
    if (!roleTitle) return Response.json({ error: "roleTitle is required", requestId }, { status: 400 });

    const profile: Profile = body?.profile ?? (await getOrCreateProfile());
    const report = await buildSalaryReport({
      profile,
      roleTitle,
      jobDescription: typeof body?.jobDescription === "string" ? body.jobDescription : undefined,
      locationHint: typeof body?.locationHint === "string" ? body.locationHint : undefined,
      experienceYears: typeof body?.experienceYears === "number" ? body.experienceYears : undefined,
    });
    return Response.json({ report, requestId });
  } catch (error) {
    console.error(`[salary:${requestId}]`, error);
    return Response.json({ error: "Salary research failed. Please retry.", requestId }, { status: 500 });
  }
}
