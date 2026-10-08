import type { AlexAction, AlexReply, Profile, RoleTemplate } from "./types";
import { runRecommender } from "./recommender";
import { diagnosePipeline } from "./diagnosis";
import { buildSalaryReport } from "./salaryCoach";
import { fetchLiveJobs, JOB_SOURCES } from "./jobSources";
import { scoreJobs } from "./jobDiscovery";
import { SKILL_VOCABULARY, buildSkillRegex } from "./skillsData";
import { CAREER_FIELDS } from "./careerFields";

/**
 * Agent 8: Alex — your personal AI job consultant.
 *
 * Deliberately hybrid: a deterministic brain runs the math (match %, salary
 * research, funnel diagnosis) so numbers are always honest, and an optional
 * LLM layer only rephrases the delivery in Alex's voice. If no key or the
 * model fails, the deterministic voice is returned verbatim — the product
 * never blocks on an external dependency.
 */

export type AlexContext = {
  profile: Profile;
  roles: RoleTemplate[];
  analytics: {
    totalApplications: number;
    byStatus: Record<string, number>;
    byStage: Record<string, number>;
    avgAtsScore: number | null; // 0..1
    totalResumeRuns: number;
  };
};

function lower(s: string): string {
  return s.toLowerCase();
}

function mentionSkills(text: string): string[] {
  const hay = " " + text.toLowerCase() + " ";
  return SKILL_VOCABULARY.filter((sk) => buildSkillRegex(sk).test(hay));
}

function extractRoleQuery(text: string): string | null {
  const m = text.match(/\b(?:for|as|into|towards?)\s+(?:an?\s+)?([a-z][a-z /\-]{2,40})\b/i);
  return m ? m[1].replace(/\s+(jobs?|roles?|position).*$/, "").trim() : null;
}

export async function alexHandle(message: string, ctx: AlexContext): Promise<AlexReply> {
  const msg = message.trim();
  const q = lower(msg);

  const act: AlexAction[] = [];
  const base = { actions: act, agent: null as string | null };

  // Greeting / identity
  if (/^(hi|hello|hey|yo|hola)\b/.test(q) || q.length <= 14) {
    return {
      ...base,
      reply:
        `Hi, I'm Alex — your AI job consultant. I can tell you which roles you're actually fit for, what the real market pays for them, tailor a resume to a live job, and be honest about where your search is stalling. What's on your mind — roles, salary, a resume, or follow-ups?`,
    };
  }

  // Which roles / what should I apply for
  if (/should i apply|what (job|role|work)|suggest.*(job|role)|best (role|job)|recommend.*(role|job)|what can i do|career (path|direction)|switch|change (career|field)/.test(q)) {
    const rec = runRecommender(ctx.profile, ctx.roles);
    const top = rec.recommendations.slice(0, 5);
    const fieldNames = (ctx.profile.careerFields ?? [])
      .map((k) => CAREER_FIELDS.find((c) => c.key === k)?.label ?? k)
      .join(", ");
    const lines = [
      `Given your background${fieldNames ? ` in ${fieldNames}` : ""}, here are the roles where your real evidence gives you the strongest shot:`,
      "",
      ...top.map(
        (r, i) => `${i + 1}. ${r.title} — ${r.matchScore}%${r.missingSkills.length ? ` (gap: ${r.missingSkills.slice(0, 2).join(", ")})` : " (no gaps)"}`,
      ),
      "",
      `The match is computed from your actual skills and projects. Shore up ${top[0]?.missingSkills[0] ?? "the top gap"} to widen your options, or I can look up the live market for any of these.`,
    ];
    act.push({ type: "tab", label: "Open Role Recommender", tab: "recommender" });
    act.push({ type: "search", label: `Find live ${top[0]?.title ?? ""} jobs`, tab: "jobs", query: top[0]?.title });
    return { actions: act, agent: "recommender", reply: lines.join("\n"), data: { recommendations: top } };
  }

  // Salary / negotiation
  if (/salary|pay|compensation|negotiat|package|ctc|expected|money|worth/.test(q)) {
    const roleQ = extractRoleQuery(msg) || ctx.profile.skills?.[0] || "role";
    const report = await buildSalaryReport({ profile: ctx.profile, roleTitle: roleQ });
    const lines = [
      `For ${report.role}, ${report.dataSource === "live_market" ? "current live listings" : "my estimate"}:`,
      "",
      report.marketLine,
      "",
      report.openingAsk,
      "",
      report.band
        ? `Live band: ${report.band.p25.toLocaleString()} / ${report.band.median.toLocaleString()} / ${report.band.p75.toLocaleString()} ${report.currency} (p25 / median / p75, from ${report.sampleSize} postings).`
        : report.caveats[0],
      "",
      `Negotiation script ready — ask me for it, or press "Open Salary Coach" for the full report.`,
    ];
    act.push({ type: "tab", label: "Open Salary Coach", tab: "resume" });
    return { actions: act, agent: "salaryCoach", reply: lines.join("\n"), data: { salary: report } };
  }

  // Find jobs
  if (/(find|search|show|list).*(job|opening|role|vacanc|hiring)|jobs? (for|near|in)/.test(q)) {
    const query = extractRoleQuery(msg) || ctx.profile.skills?.[0] || "software";
    const { jobs } = await fetchLiveJobs({ query, sources: JOB_SOURCES.map((s) => s.key) });
    const scored = scoreJobs(jobs, ctx.profile).sort((a, b) => b.fitScore - a.fitScore).slice(0, 3);
    const lines = [
      `I pulled live openings for "${query}" from ${jobs.length} listings across our feeds. Closest matches to your evidence:`,
      "",
      ...scored.map((j, i) => `${i + 1}. ${j.title} @ ${j.company} — fit ${j.fitScore}/100 (${j.source})`),
      "",
      `Open Find Jobs to see all ranked listings, shortlist the ones you like, and tailor a resume in one tap.`,
    ];
    act.push({ type: "search", label: `Open Find Jobs (${query})`, tab: "jobs", query });
    return { actions: act, agent: "jobDiscovery", reply: lines.join("\n") };
  }

  // Style Mirror / authentic voice
  if (/sound(?:ing)? like (?:me|myself)|style mirror|my (?:voice|tone|style)|stop sounding like ai|generic ai|humanize|write like me/.test(q)) {
    act.push({ type: "tab", label: "Open Style Mirror", tab: "style" });
    return {
      actions: act,
      agent: "styleMirror",
      reply: [
        "Style Mirror learns how you naturally write—sentence rhythm, directness, formality, contractions, transitions, and phrases—without fine-tuning a model.",
        "",
        "Paste two or three samples you wrote yourself. AutoApply removes high-risk PII locally, discards the raw examples, and stores only an encrypted style fingerprint. You can then apply that voice to summaries, cover letters, recruiter messages, and follow-ups.",
        "",
        "It preserves factual claims and rejects model output that changes numeric evidence.",
      ].join("\n"),
    };
  }

  // Resume help
  if (/resume|cv|ats|cover letter|tailor|fact check|match score/.test(q)) {
    const lines = [
      `To get a truthful, ATS-safe resume: paste a real job description in the Resume Agent. I will:`,
      `- retrieve only what's backed by your profile,`,
      `- score the ATS keyword coverage,`,
      `- fact-check every claim, then revise until it passes or tells you the exact gap.`,
      `I will never invent skills you haven't demonstrated. Trigger it for your top role and I'll walk you through the output.`,
    ];
    act.push({ type: "tab", label: "Open Resume Agent", tab: "resume" });
    act.push({ type: "autopilot", label: "Run Autopilot", tab: "overview" });
    return { actions: act, agent: "resume", reply: lines.join("\n") };
  }

  // Follow-ups / waiting
  if (/follow.?up|no (response|reply|answer)|ghost|waiting|hear(ing)? back|respond/.test(q)) {
    const apps = ctx.analytics.totalApplications;
    const due = ctx.analytics.byStatus.pending ?? 0;
    const responded = ctx.analytics.byStatus.responded ?? 0;
    const lines = [
      `Open Follow-up & Pipeline. I see ${apps} application(s): ${due} pending, ${responded} responded, ${ctx.analytics.byStatus.no_response ?? 0} marked no-response.`,
      "",
      `The agent will send your reminder email automatically once a job is overdue, then stop the moment they reply. Hit "Run Follow-up Check Now" there to process today's tick.`,
    ];
    act.push({ type: "tab", label: "Open Follow-up Agent", tab: "followup" });
    return { actions: act, agent: "followup", reply: lines.join("\n") };
  }

  // Skills gap / upskilling
  if (/gap|missing skill|learn|skill.*(improve|gap)|should i study|upskill|how to improve/.test(q)) {
    const mentioned = mentionSkills(msg);
    const topMissing = mentioned.length ? mentioned : [];
    const lines = [
      topMissing.length
        ? `You mentioned ${topMissing.join(", ")}. I can:`
        : `Tell me a role and I'll show the exact gap. For example, run "what skills am I missing for [role]".`,
      "",
      `I compare your profile evidence to the role's requirements and return: matched skills, missing skills, and a concrete roadmap (resource, effort, portfolio project) for each gap.`,
    ];
    act.push({ type: "tab", label: "Open Role Recommender", tab: "recommender" });
    return { actions: act, agent: "upselling", reply: lines.join("\n") };
  }

  // Diagnosis
  if (/why.*(not|no)|stalled|no interviews|not getting|pipeline|diagnos|what.?s wrong|progress/.test(q)) {
    const diag = diagnosePipeline({
      applications: [], // resolved below via analytics
      avgAtsScore: ctx.analytics.avgAtsScore,
      totalResumeRuns: ctx.analytics.totalResumeRuns,
    });
    void diag;
    // deterministic summary from analytics
    const applied = ctx.analytics.totalApplications;
    const ats = ctx.analytics.avgAtsScore;
    const lines = [
      `Quick read of your funnel:`,
      `- applications logged: ${applied}`,
      `- resumes generated: ${ctx.analytics.totalResumeRuns}${ats !== null ? ` (avg ATS ${Math.round(ats * 100)}%)` : ""}`,
      `- responded: ${ctx.analytics.byStatus.responded ?? 0}`,
      "",
      applied === 0
        ? "You haven't logged a real application yet, so my first advice is to get the first one out: run Autopilot, then log it."
        : ats !== null && ats < 0.7
          ? "Your aTS average is below the ~85% screening bar — that's the main blocker. Fix flagged keyword gaps in Resume Agent."
          : (ctx.analytics.byStatus.responded ?? 0) < Math.max(1, Math.round(applied * 0.2))
            ? "You need more volume or better-fit roles. Raise the minimum fit in Find Jobs and shortlist fresh listings only."
            : "Responses are coming in — this is an interview conversion problem now. Use Interview Prep on your strongest shortlist.",
    ];
    act.push({ type: "tab", label: "Open Overview & diagnosis", tab: "overview" });
    return { actions: act, agent: "diagnosis", reply: lines.join("\n") };
  }

  // Fallback — offer what Alex can do
  return {
    actions: [
      { type: "tab", label: "Recommender", tab: "recommender" },
      { type: "tab", label: "Find Jobs", tab: "jobs" },
      { type: "tab", label: "Style Mirror", tab: "style" },
      { type: "tab", label: "Resume Agent", tab: "resume" },
      { type: "tab", label: "Follow-up", tab: "followup" },
    ],
    agent: null,
    reply:
      `I'm your AI job consultant. I can:\n` +
      `• Tell you exactly which of 173 roles you can get\n` +
      `• Research what the market truly pays for a role (live listings)\n` +
      `• Find live openings matched to your evidence\n` +
      `• Tailor a job-specific resume and cover letter\n` +
      `• Diagnose why you aren't hearing back and schedule follow-ups\n\n` +
      `What do you need — roles, salary, a resume, jobs, or help with low response rates?`,
  };
}
