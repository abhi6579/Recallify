import { getOrCreateProfile, saveResumeRun } from "@/db/queries";
import { inferJobMetadata } from "@/lib/agents/jobMetadata";
import { runResumeAgent } from "@/lib/agents/resumeAgent";
import { SAMPLE_JDS } from "@/lib/agents/sampleJds";
import type { JobContext, Profile } from "@/lib/agents/types";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number, requestId: string, detail?: string) {
  return Response.json(
    { error: message, requestId, ...(detail ? { detail } : {}) },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function normalizeProfile(profile: Profile): Profile {
  return {
    ...profile,
    careerFields: Array.isArray(profile.careerFields) ? profile.careerFields : [],
    education: Array.isArray(profile.education) ? profile.education : [],
    experience: Array.isArray(profile.experience) ? profile.experience : [],
    projects: Array.isArray(profile.projects) ? profile.projects : [],
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    publications: Array.isArray(profile.publications) ? profile.publications : [],
    certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
  };
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return jsonError("The request could not be read. Please refresh the page and try again.", 400, requestId);
    }

    const jobDescription = typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";
    if (jobDescription.length < 20) {
      return jsonError("Please provide a job description with at least 20 characters.", 400, requestId);
    }
    if (jobDescription.length > 60_000) {
      return jsonError("This job description is too long. Please keep it under 60,000 characters.", 413, requestId);
    }

    const metadata = inferJobMetadata(jobDescription);
    const submittedRole = typeof body.roleTitle === "string" ? body.roleTitle.trim() : "";
    const submittedCompany = typeof body.companyName === "string" ? body.companyName.trim() : "";
    const staleSamplePair = SAMPLE_JDS.some(
      (sample) => sample.role === submittedRole && sample.company === submittedCompany,
    );

    // An explicit `Position:` / `Job title:` inside the JD is more reliable
    // than fields left over from a previously loaded sample. If both old
    // fields came from that sample, clear its company as well.
    // Precedence: an explicit "Position:" label in the JD is authoritative;
    // then a real title supplied by the caller (job listing or user input);
    // only then the opening heading, which can be boilerplate like "Life at BMS".
    const resolvedTitle = metadata.roleTitle ?? (submittedRole || metadata.headingTitle || "");
    const headingOverrodeSample = Boolean(
      staleSamplePair && metadata.headingTitle && metadata.headingTitle !== submittedRole,
    );
    const roleTitle = staleSamplePair && metadata.headingTitle && !metadata.roleTitle
      ? metadata.headingTitle
      : resolvedTitle;
    const detectedTitle = metadata.roleTitle ?? (headingOverrodeSample ? metadata.headingTitle : null);
    const companyName = metadata.companyName ?? (
      staleSamplePair && detectedTitle && detectedTitle !== submittedRole ? "" : submittedCompany
    );
    const jobContext = (body.jobContext && typeof body.jobContext === "object" ? body.jobContext : {}) as JobContext;
    const suppliedProfile = body.profile && typeof body.profile === "object" ? (body.profile as Profile) : null;
    const profile = normalizeProfile(suppliedProfile ?? (await getOrCreateProfile()));

    if (!profile.name?.trim()) {
      return jsonError("Your profile needs a name before a resume can be generated.", 400, requestId);
    }

    const result = await runResumeAgent(profile, jobDescription, companyName, roleTitle, 2, jobContext);
    const saved = await saveResumeRun(result);

    return Response.json(
      {
        result,
        id: saved.id,
        requestId,
        detected: {
          roleTitle: detectedTitle,
          companyName: metadata.companyName,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    // Log the full stack server-side, but return JSON—not Next.js's HTML error
    // document—so the client can show a useful message instead of a JSON parser
    // exception beginning with "Unexpected token '<'".
    console.error(`[resume-agent:${requestId}]`, error);
    return jsonError(
      "The Resume Agent could not complete this run. Your profile and job description are still safe—please try again.",
      500,
      requestId,
      process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
    );
  }
}
