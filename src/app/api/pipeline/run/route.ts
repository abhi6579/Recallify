import { createApplication, getOrCreateProfile, getRoleTemplates, saveResumeRun } from "@/db/queries";
import { categoriesForFields } from "@/lib/agents/careerFields";
import { DEFAULT_FOLLOWUP_TEMPLATE } from "@/lib/agents/followupTemplate";
import { runRecommender } from "@/lib/agents/recommender";
import { runResumeAgent } from "@/lib/agents/resumeAgent";
import { findJdForRole } from "@/lib/agents/sampleJds";

export const dynamic = "force-dynamic";

/**
 * Autopilot joins the agents while retaining a human checkpoint:
 * recommend -> role-specific JD -> tailor/verify -> save draft ->
 * [user edits/confirms actual submission] -> log application -> follow-up.
 *
 * It never marks a job as applied merely because a planning brief was built.
 */
export async function POST(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8);
  try {
    const body = await request.json().catch(() => ({}));
    const followUpDelayDays = Number(body?.followUpDelayDays ?? 7);
    const confirmApplied = body?.confirmApplied === true;
    const profile = await getOrCreateProfile();
    const allRoles = await getRoleTemplates();
    const fieldCategories = new Set(categoriesForFields(profile.careerFields ?? []));
    const roleTemplates = fieldCategories.size > 0 ? allRoles.filter((r) => fieldCategories.has(r.category)) : allRoles;

    const recommender = runRecommender(profile, roleTemplates.length > 0 ? roleTemplates : allRoles);
    const top = recommender.recommendations[0];
    if (!top) {
      return Response.json({ error: "No role could be recommended from the current profile.", requestId }, { status: 400 });
    }

    const jd = findJdForRole(top.title);
    const resume = await runResumeAgent(profile, jd.text, jd.company, jd.role);
    const savedRun = await saveResumeRun(resume);

    let applicationId: number | null = null;
    if (confirmApplied) {
      const company = typeof body?.companyName === "string" && body.companyName.trim()
        ? body.companyName.trim()
        : jd.company;
      const contactEmail = typeof body?.contactEmail === "string" ? body.contactEmail.trim() : "";
      const application = await createApplication({
        company,
        role: jd.role,
        contactEmail,
        appliedDate: new Date().toISOString().slice(0, 10),
        followUpDelayDays,
        followUpMessage: DEFAULT_FOLLOWUP_TEMPLATE,
        maxFollowUps: 3,
        notes: `Connected by Autopilot after user confirmation. Match ${top.matchScore}%. ATS ${Math.round(resume.atsScore * 100)}%.`,
        resumeRunId: savedRun.id,
      });
      applicationId = application.id;
    }

    return Response.json({
      steps: [
        { agent: "Role Recommender", detail: `Top role: ${top.title} (${top.matchScore}% match)` },
        {
          agent: "JD Planner",
          detail: jd.generated
            ? `Built a ${jd.role} planning brief from the role requirements—no unrelated fallback used`
            : `Selected curated JD: ${jd.role} @ ${jd.company}`,
        },
        {
          agent: "Resume Agent",
          detail: `Draft saved · ATS ${Math.round(resume.atsScore * 100)}% · factual ${Math.round(resume.factualScore * 100)}% · ${resume.revisionCount} revision(s)`,
        },
        {
          agent: confirmApplied ? "Follow-up Agent" : "Human checkpoint",
          detail: confirmApplied
            ? `Application #${applicationId} logged; reminder scheduled in ${followUpDelayDays} days`
            : "Review the draft, correct profile data, paste the real employer JD, then log the application to start follow-ups",
        },
      ],
      topRole: top,
      resumeRunId: savedRun.id,
      resume,
      applicationId,
      requiresConfirmation: !confirmApplied,
      generatedBrief: jd.generated === true,
      requestId,
    });
  } catch (error) {
    console.error(`[autopilot:${requestId}]`, error);
    return Response.json(
      { error: "Autopilot could not complete this run. Please try again.", requestId },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
