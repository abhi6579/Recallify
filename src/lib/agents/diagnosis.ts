import type { Application } from "./types";

/**
 * Agent 6: Pipeline Diagnosis (the "why am I not hearing back?" engine).
 *
 * Deterministic, evidence-based — reads the real funnel and tells the user the
 * single most likely cause and the single highest-leverage fix. This is the
 * feature competitors position as their "AI career coach"; here it is built
 * on the user's actual data rather than generic advice.
 */
export type PipelineDiagnosis = {
  applied: number;
  responded: number;
  responseRate: number;
  avgAts: number | null;
  stage: "no_data" | "low_volume" | "low_ats" | "targeting" | "no_followup" | "interviews" | "healthy";
  headline: string;
  cause: string;
  fix: string;
  supportingFact: string;
};

export function diagnosePipeline(input: {
  applications: { status: string; followUpCount: number; stage: string }[];
  avgAtsScore: number | null; // 0..1
  totalResumeRuns: number;
}): PipelineDiagnosis {
  const apps = input.applications;
  const applied = apps.length;
  const responded = apps.filter((a) => a.status === "responded" || a.stage !== "applied").length;
  const responseRate = applied ? Math.round((responded / applied) * 100) : 0;
  const avgAts = input.totalResumeRuns > 0 && input.avgAtsScore !== null ? input.avgAtsScore : null;
  const followUpsSent = apps.reduce((s, a) => s + a.followUpCount, 0);

  const base = { applied, responded, responseRate, avgAts };

  if (applied === 0) {
    return {
      ...base,
      stage: "no_data",
      headline: "Let's get your first application out",
      cause: "You have not logged any applications yet, so there is no funnel to analyse.",
      fix: "Run Autopilot or tailor a resume for one live job, then log it. The diagnosis becomes useful the moment you have a real data point.",
      supportingFact: "Every strategy the agents give you is computed from your actual evidence and application history.",
    };
  }

  if (applied < 5) {
    return {
      ...base,
      stage: "low_volume",
      headline: "Too early to judge — volume is low",
      cause: `With only ${applied} application(s), the response signal is noise, not a verdict.`,
      fix: "Apply to a focused batch of 8–12 well-matched roles rather than 1–2, so the pattern becomes real.",
      supportingFact: "Public hiring data shows most searches need a deliberate, targeted batch before interview rates stabilise.",
    };
  }

  if (avgAts !== null && avgAts < 0.7) {
    return {
      ...base,
      stage: "low_ats",
      headline: "Your resumes are not passing screening",
      cause: `Average ATS score is ${Math.round(avgAts * 100)}%, below the ~85% bar where most screening software lets you through.`,
      fix: "Open Resume Agent, address the flagged keyword gaps with real evidence, and regenerate before applying further.",
      supportingFact: "A resume that scores low on requirements is filtered before a human ever reads it.",
    };
  }

  if (responseRate < 15) {
    return {
      ...base,
      stage: "targeting",
      headline: resumeNote(avgAts) === "ok" ? "The problem is targeting, not your resume" : "Your targeting may be off",
      cause: `Response rate is ${responseRate}% across ${applied} applications — low even with acceptable resumes.`,
      fix: "Shift to higher-fit roles. In Find Jobs, raise the minimum fit and favour fresh listings in your career field.",
      supportingFact: "Strong resumes to the wrong roles still get ignored; fit targeting beats volume.",
    };
  }

  if (followUpsSent === 0 && applied >= 5) {
    return {
      ...base,
      stage: "no_followup",
      headline: "You are not following up",
      cause: "You have applications sitting with no follow-up emails sent.",
      fix: "Run the Follow-up Agent on overdue applications. A single polite reminder measurably lifts response rates.",
      supportingFact: "A large share of employer silence is just volume, not rejection — a timely nudge re-surfaces you.",
    };
  }

  if (responseRate >= 15) {
    return {
      ...base,
      stage: "interviews",
      headline: "You are getting responses — focus on conversion",
      cause: `Response rate of ${responseRate}% is healthy. The bottleneck is now interviews, not applications.`,
      fix: "Use the Interview Prep brief on your strongest shortlist and rehearse the grounded questions out loud.",
      supportingFact: "At this stage, conversion depends on interview performance more than on resume tweaks.",
    };
  }

  return {
    ...base,
    stage: "healthy",
    headline: "Your pipeline is working",
    cause: "No single dominant problem detected.",
    fix: "Keep a steady, targeted cadence and let Follow-up Agent handle the reminders.",
    supportingFact: "Consistency beats bursts in job search outcomes.",
  };

  function resumeNote(a: number | null): string {
    return a !== null && a >= 0.85 ? "ok" : "weak";
  }
}
