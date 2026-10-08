import type { JobContext, Profile, ResumeAgentResult, TraceStep } from "./types";
import { parseJobDescription } from "./jdParser";
import { matchEvidence } from "./evidenceMatcher";
import { buildResumeText } from "./resumeGenerator";
import { evaluateAts } from "./atsEvaluator";
import { checkFacts } from "./factChecker";
import { normalizeSkill } from "./skillsData";
import { buildCoverLetter, buildInterviewQuestions, matchConfidenceRange } from "./extras";
import { chatCompletion, isLlmAvailable } from "@/lib/llm";
import { analyzeJobIntelligence } from "./jobIntelligence";

const ATS_THRESHOLD = 0.85;
const FACTUAL_THRESHOLD = 0.95;

/**
 * Agent 2: Resume Agent — LangGraph-style state machine.
 *
 * parse_jd -> match_evidence -> generate_resume -> evaluate_ats -> check_facts
 *   -> [revise -> evaluate_ats]* -> llm_polish? -> verify_polish -> cover_letter
 *   -> interview_prep -> generate_report -> END
 */
export async function runResumeAgent(
  profile: Profile,
  jobDescription: string,
  companyName: string,
  roleTitle: string,
  maxRevisions = 2,
  jobContext: JobContext = {},
): Promise<ResumeAgentResult> {
  const auditTrail: string[] = [];
  const changeReport: string[] = [];
  const trace: TraceStep[] = [];
  const t0 = Date.now();
  const step = (node: string, detail: string, status: TraceStep["status"] = "ok") => {
    trace.push({ node, detail, status, atMs: Date.now() - t0 });
    auditTrail.push(`${node}: ${detail}`);
  };

  const jdRequirements = parseJobDescription(jobDescription);
  step("parse_jd", `extracted ${jdRequirements.length} requirement keywords from JD`);

  const matchedEvidence = matchEvidence(jdRequirements, profile);
  const groundedCount = matchedEvidence.filter((e) => e.score > 0).length;
  step("match_evidence", `${groundedCount}/${jdRequirements.length} requirements backed by profile evidence (RAG over profile)`);

  let emphasizeKeywords: string[] = [];
  let resumeText = buildResumeText(profile, jdRequirements, matchedEvidence, { emphasizeKeywords });
  step("generate_resume", "drafted tailored resume from grounded evidence only");

  let revisionCount = 0;
  let atsScore = 0;
  let missingKeywords: string[] = [];
  let factualIssues: string[] = [];
  let factualScore = 1;
  let initialAts = 0;
  let initialFactual = 1;

  for (;;) {
    const ats = evaluateAts(resumeText, jdRequirements);
    atsScore = ats.atsScore;
    missingKeywords = ats.missingKeywords;
    step("evaluate_ats", `ats_score=${atsScore} (missing: ${missingKeywords.length})`, atsScore >= ATS_THRESHOLD ? "ok" : "warn");

    const facts = checkFacts(resumeText, profile);
    factualIssues = facts.factualIssues;
    factualScore = facts.factualScore;
    step("check_facts", `factual_score=${factualScore} (${factualIssues.length} unsupported claim(s))`, factualScore >= FACTUAL_THRESHOLD ? "ok" : "warn");

    if (revisionCount === 0) {
      initialAts = atsScore;
      initialFactual = factualScore;
    }

    const passes = atsScore >= ATS_THRESHOLD && factualScore >= FACTUAL_THRESHOLD;
    if (passes) {
      step("conditional", "thresholds met → finalize");
      break;
    }
    if (revisionCount >= maxRevisions) {
      step("conditional", `max revisions (${maxRevisions}) reached → finalize anyway`, "warn");
      break;
    }

    revisionCount += 1;
    const groundedMissing = missingKeywords.filter((k) =>
      matchedEvidence.some((e) => normalizeSkill(e.requirement) === normalizeSkill(k) && e.score > 0),
    );
    emphasizeKeywords = Array.from(new Set([...emphasizeKeywords, ...groundedMissing]));
    changeReport.push(
      groundedMissing.length > 0
        ? `Revision ${revisionCount}: surfaced grounded keywords [${groundedMissing.join(", ")}] from projects/experience to raise ATS coverage.`
        : `Revision ${revisionCount}: no additional grounded keywords available for the remaining gaps — refusing to fabricate.`,
    );
    if (factualIssues.length > 0) {
      changeReport.push(`Revision ${revisionCount}: flagged ${factualIssues.length} unsupported claim(s) for review.`);
    }
    resumeText = buildResumeText(profile, jdRequirements, matchedEvidence, { emphasizeKeywords });
    step("revise", `regenerated emphasizing ${groundedMissing.length} keyword(s)`);
  }

  // Optional LLM polish of the SUMMARY only — re-verified by the fact checker.
  let llmEnhanced = false;
  if (isLlmAvailable()) {
    const summaryMatch = resumeText.match(/SUMMARY\n([\s\S]*?)\n\nCORE SKILLS/);
    if (summaryMatch) {
      const polished = await chatCompletion(
        "You rewrite resume summaries. Rewrite the given summary into 2-3 crisp, ATS-friendly sentences. STRICT RULES: only use facts present in the provided summary and profile JSON; never add new tools, skills, numbers or employers. Output only the rewritten summary text.",
        `Summary:\n${summaryMatch[1]}\n\nProfile JSON:\n${JSON.stringify({ skills: profile.skills, projects: profile.projects, experience: profile.experience })}\n\nTarget role: ${roleTitle} at ${companyName}`,
        { maxTokens: 220 },
      );
      if (polished) {
        const candidate = resumeText.replace(summaryMatch[1], polished.replace(/\n+/g, " "));
        const verify = checkFacts(candidate, profile);
        const verifyAts = evaluateAts(candidate, jdRequirements);
        if (verify.factualScore >= factualScore && verifyAts.atsScore >= atsScore) {
          resumeText = candidate;
          llmEnhanced = true;
          changeReport.push("LLM polish: summary rewritten by LLM and re-verified (no new claims, ATS not reduced).");
          step("llm_polish", "summary polished by LLM; verify_polish passed");
        } else {
          changeReport.push("LLM polish: rejected — model output introduced unsupported claims or lowered ATS coverage. Kept deterministic draft.");
          step("verify_polish", "rejected LLM output (factual/ATS regression)", "warn");
        }
      } else {
        step("llm_polish", "LLM unavailable/timeout — skipped", "skip");
      }
    }
  } else {
    step("llm_polish", "no LLM key configured — deterministic path only", "skip");
  }

  const coverLetter = buildCoverLetter(profile, companyName, roleTitle, matchedEvidence);
  step("cover_letter", `generated ${coverLetter.split(/\s+/).length}-word cover letter from grounded evidence`);

  const interviewQuestions = buildInterviewQuestions(roleTitle, matchedEvidence, profile);
  step("interview_prep", `prepared ${interviewQuestions.length} likely interview questions with grounded hints`);

  const jobIntelligence = analyzeJobIntelligence({
    jobDescription,
    companyName,
    roleTitle,
    jobContext,
    atsScore,
    evidence: matchedEvidence,
    profile,
  });
  step(
    "job_quality_gate",
    `priority=${jobIntelligence.applicationPriority}, trust=${jobIntelligence.trustScore}, ghost_risk=${jobIntelligence.ghostRisk}, scam_risk=${jobIntelligence.scamRisk}`,
    jobIntelligence.recommendation === "apply_now" ? "ok" : "warn",
  );

  const matchRange = matchConfidenceRange(atsScore, matchedEvidence);
  step("render_pdf", "finalized print-ready resume document");

  changeReport.unshift(
    `Initial draft: ats_score=${initialAts}, factual_score=${initialFactual}. Final: ats_score=${atsScore}, factual_score=${factualScore} after ${revisionCount} revision(s).`,
  );
  if (missingKeywords.length > 0) {
    changeReport.push(
      `Remaining gaps not present anywhere in the profile: ${missingKeywords.join(", ")}. Use "Challenge gap" if you actually have this skill, or follow the learning path.`,
    );
  }
  step("generate_report", `change report has ${changeReport.length} entries; match confidence ${matchRange[0]}–${matchRange[1]}%`);

  const finalStatus: ResumeAgentResult["finalStatus"] =
    atsScore >= ATS_THRESHOLD && factualScore >= FACTUAL_THRESHOLD ? "approved" : "max_revisions";

  return {
    jobDescription,
    companyName,
    roleTitle,
    jobContext,
    jobIntelligence,
    jdRequirements,
    matchedEvidence,
    resumeText,
    atsScore,
    atsMissingKeywords: missingKeywords,
    factualIssues,
    factualScore,
    revisionCount,
    changeReport,
    auditTrail,
    trace,
    finalStatus,
    coverLetter,
    interviewQuestions,
    matchRange,
    llmEnhanced,
  };
}
