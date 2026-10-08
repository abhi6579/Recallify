import type { EvidenceMatch, JobContext, JobIntelligence, Profile } from "./types";

const SCAM_SIGNALS: { pattern: RegExp; label: string; severe?: boolean }[] = [
  { pattern: /pay (?:a |the )?(?:fee|deposit)|application fee|training fee|registration fee/i, label: "Asks the candidate to pay a fee", severe: true },
  { pattern: /gift card|cryptocurrency|bitcoin|wire transfer|send money/i, label: "Mentions gift cards, crypto, wire transfers, or sending money", severe: true },
  { pattern: /deposit (?:the |a )?check|cash (?:the |a )?check|buy (?:your )?equipment/i, label: "Uses a fake-check or equipment-purchase pattern", severe: true },
  { pattern: /telegram|whatsapp|signal app/i, label: "Moves recruiting to an informal messaging platform" },
  { pattern: /no interview|required immediately|guaranteed job|guaranteed income/i, label: "Promises hiring without a normal interview process" },
  { pattern: /social security number|bank account|credit card|passport copy/i, label: "Requests sensitive identity or financial data in the posting", severe: true },
  { pattern: /(?:earn|make)\s*[$₹€£]?\s*\d+[k,]?\s*(?:per|a)\s*(?:day|week)/i, label: "Promises unusually high short-period earnings" },
];

const GHOST_SIGNALS: { pattern: RegExp; label: string }[] = [
  { pattern: /talent (?:pool|community|network)|future opportunit/i, label: "Listing may be collecting candidates for future roles" },
  { pattern: /always hiring|evergreen (?:role|position|opening)/i, label: "Evergreen / always-hiring wording" },
  { pattern: /multiple openings|ongoing recruitment/i, label: "Open-ended hiring language without a defined vacancy" },
  { pattern: /confidential company|undisclosed client/i, label: "Employer identity is not transparent" },
];

const SALARY_PATTERN = /(?:[$₹€£]\s?\d|\d[\d,.]*\s*(?:lpa|lakhs?|k\s*(?:per year|\/yr|annually)|usd|inr)|salary\s*(?:range|:)|compensation\s*(?:range|:))/i;
const RESPONSIBILITY_PATTERN = /responsibilit|you will|what you(?:'|’)ll do|day.to.day|duties/i;
const REQUIREMENT_PATTERN = /requirement|qualification|must have|what you bring|experience with/i;
const BENEFIT_PATTERN = /benefit|insurance|paid time off|leave|bonus|equity|provident fund/i;
const LOCATION_PATTERN = /remote|hybrid|on.?site|location|based in|office/i;

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function daysOld(date?: string): number | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 86400000));
}

function hasSpecificity(text: string): boolean {
  const bullets = text.split(/\r?\n/).filter((l) => /^\s*[-•*]/.test(l)).length;
  const numbers = (text.match(/\b\d+(?:\.\d+)?%?\b/g) ?? []).length;
  return bullets >= 3 || numbers >= 2;
}

function safeHost(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function analyzeJobIntelligence(input: {
  jobDescription: string;
  companyName: string;
  roleTitle: string;
  jobContext?: JobContext;
  atsScore: number;
  evidence: EvidenceMatch[];
  profile: Profile;
}): JobIntelligence {
  const { jobDescription: jd, companyName, roleTitle, jobContext = {}, atsScore, evidence, profile } = input;
  const positiveSignals: string[] = [];
  const riskFlags: string[] = [];
  const scamMatches = SCAM_SIGNALS.filter((s) => s.pattern.test(jd));
  const ghostMatches = GHOST_SIGNALS.filter((s) => s.pattern.test(jd));
  const age = daysOld(jobContext.postedDate);
  const sourceHost = safeHost(jobContext.sourceUrl);
  const salaryTransparent = SALARY_PATTERN.test(jd) || SALARY_PATTERN.test(jobContext.salaryText ?? "");

  // Clarity: a transparent employer should explain the work, requirements,
  // location, and compensation rather than publishing a generic wall of text.
  let clarity = 20;
  if (jd.length >= 350) clarity += 15;
  if (jd.length >= 800) clarity += 10;
  if (RESPONSIBILITY_PATTERN.test(jd)) clarity += 15;
  if (REQUIREMENT_PATTERN.test(jd)) clarity += 15;
  if (LOCATION_PATTERN.test(jd) || jobContext.workMode && jobContext.workMode !== "not-specified") clarity += 10;
  if (salaryTransparent) clarity += 15;
  if (BENEFIT_PATTERN.test(jd)) clarity += 5;
  if (hasSpecificity(jd)) clarity += 10;
  const clarityScore = clamp(clarity);

  if (salaryTransparent) positiveSignals.push("Compensation or salary range is disclosed");
  else riskFlags.push("No salary range found — ask for the budget before investing in a long process");
  if (RESPONSIBILITY_PATTERN.test(jd) && REQUIREMENT_PATTERN.test(jd)) positiveSignals.push("Responsibilities and requirements are both defined");
  if (hasSpecificity(jd)) positiveSignals.push("Posting contains concrete bullets, scope, or measurable requirements");
  if (sourceHost) positiveSignals.push(`Source URL provided (${sourceHost})`);

  // Freshness / ghost-risk indicators.
  if (age !== null && age <= 14) positiveSignals.push(`Fresh posting (${age} day${age === 1 ? "" : "s"} old)`);
  if (age !== null && age > 30) riskFlags.push(`Posting is ${age} days old; verify it is still open on the company careers page`);
  if (age !== null && age > 60) riskFlags.push("Very old listing — high chance the role is paused, filled, or evergreen");
  for (const g of ghostMatches) riskFlags.push(g.label);

  // Unrealistic entry-level experience requirements / role stacking.
  const years = Array.from(jd.matchAll(/(\d+)\+?\s*years?/gi)).map((m) => Number(m[1]));
  const maxYears = years.length ? Math.max(...years) : 0;
  if (/junior|entry.?level|graduate|fresher|intern/i.test(`${roleTitle} ${jd}`) && maxYears >= 4) {
    riskFlags.push(`Entry-level wording conflicts with a ${maxYears}+ year requirement`);
  }
  const domainBuckets = [
    /machine learning|\bai\b|llm|rag/i,
    /frontend|react|angular|vue/i,
    /backend|api|microservice/i,
    /devops|kubernetes|terraform|cloud/i,
    /product management|roadmap|go.to.market/i,
    /sales|quota|lead generation/i,
  ].filter((p) => p.test(jd)).length;
  if (domainBuckets >= 4) riskFlags.push("Role appears to combine several jobs into one; clarify ownership and team support");

  for (const s of scamMatches) riskFlags.unshift(s.label);
  if (!companyName.trim()) riskFlags.push("Company name is missing");

  let trust = 92;
  trust -= scamMatches.reduce((sum, s) => sum + (s.severe ? 35 : 18), 0);
  trust -= ghostMatches.length * 12;
  if (age !== null && age > 30) trust -= 10;
  if (age !== null && age > 60) trust -= 15;
  if (!companyName.trim()) trust -= 20;
  if (clarityScore < 50) trust -= 12;
  if (!salaryTransparent) trust -= 4; // transparency issue, not proof of fraud
  const trustScore = clamp(trust);

  const severeScam = scamMatches.some((s) => s.severe);
  const scamRisk: JobIntelligence["scamRisk"] = severeScam || scamMatches.length >= 2 ? "high" : scamMatches.length === 1 ? "medium" : "low";
  const ghostPoints = ghostMatches.length * 2 + (age !== null && age > 60 ? 3 : age !== null && age > 30 ? 1 : 0) + (clarityScore < 45 ? 2 : 0);
  const ghostRisk: JobIntelligence["ghostRisk"] = ghostPoints >= 4 ? "high" : ghostPoints >= 2 ? "medium" : "low";

  const evidenceCoverage = evidence.length ? evidence.filter((e) => e.score > 0).length / evidence.length : 0;
  const freshness = age === null ? 0.65 : age <= 7 ? 1 : age <= 14 ? 0.9 : age <= 30 ? 0.72 : age <= 60 ? 0.4 : 0.15;
  const applicationPriority = clamp(atsScore * 45 + evidenceCoverage * 20 + (trustScore / 100) * 20 + freshness * 15);

  let recommendation: JobIntelligence["recommendation"] = "apply_now";
  if (scamRisk === "high" || trustScore < 45) recommendation = "verify_first";
  else if (applicationPriority < 55 || atsScore < 0.55) recommendation = "upskill_first";
  else if (ghostRisk !== "low" || applicationPriority < 72) recommendation = "apply_with_care";

  const grounded = evidence.filter((e) => e.score > 0 && e.requirement.length < 45);
  const topSkills = grounded.slice(0, 3).map((e) => e.requirement);
  const bestProject = profile.projects?.find((p) =>
    grounded.some((e) => e.evidence.some((proof) => proof.startsWith(p.name))),
  ) ?? profile.projects?.[0];
  const company = companyName || "your team";
  const role = roleTitle || "the open role";

  const recruiterMessage = `Hi — I’m interested in the ${role} role at ${company}. My background in ${topSkills.join(", ") || profile.skills.slice(0, 3).join(", ")} maps closely to the posting${bestProject ? `; I recently built ${bestProject.name}, ${bestProject.description.charAt(0).toLowerCase()}${bestProject.description.slice(1)}` : ""}. I’ve prepared a role-specific resume and would value a brief conversation about the team’s priorities. — ${profile.name}`;
  const referralRequest = `Hi! I’m exploring the ${role} opening at ${company}. The role aligns with my work across ${topSkills.join(", ") || profile.skills.slice(0, 3).join(", ")}. If you know the team, could you share what they value most—or point me to the right person? No pressure on a referral; context alone would be genuinely helpful. Thank you, ${profile.name}`;

  const actions: JobIntelligence["actions"] = [];
  if (scamRisk !== "low" || ghostRisk !== "low" || !sourceHost) {
    actions.push({ priority: "now", title: "Verify the listing", detail: `Find this exact role on ${company}'s official careers page. Never pay, deposit a check, or share bank/identity details before a verified interview.` });
  }
  if (age !== null && age > 30) {
    actions.push({ priority: "now", title: "Confirm it is active", detail: "Message a recruiter or employee before tailoring further; the posting is older than 30 days." });
  }
  if (atsScore < 0.7) {
    actions.push({ priority: "now", title: "Do not mass-apply", detail: `Current evidence covers only ${Math.round(evidenceCoverage * 100)}% of parsed requirements. Close or challenge the highest-impact gaps first.` });
  } else {
    actions.push({ priority: "now", title: "Apply on the company site", detail: "Use the verified careers page rather than relying only on Easy Apply or an aggregator." });
  }
  actions.push({ priority: "next", title: "Create a human signal", detail: "Send the recruiter note within 24 hours and ask one thoughtful role-specific question." });
  actions.push({ priority: "next", title: "Build a warm path", detail: "Send the low-pressure referral request to one relevant employee or alumni connection." });
  if (!salaryTransparent) actions.push({ priority: "next", title: "Protect your time", detail: "Ask for the compensation range before completing a long take-home assignment or multiple interviews." });
  actions.push({ priority: "later", title: "Follow up once", detail: "If there is no response, use AutoApply’s scheduled follow-up after 7 days; avoid repeated daily messages." });

  return {
    trustScore,
    clarityScore,
    applicationPriority,
    scamRisk,
    ghostRisk,
    recommendation,
    salaryTransparent,
    postingAgeDays: age,
    positiveSignals,
    riskFlags: Array.from(new Set(riskFlags)),
    actions,
    recruiterMessage,
    referralRequest,
  };
}
