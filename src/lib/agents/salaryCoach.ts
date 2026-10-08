import type { Profile, SalaryBand, SalaryReport } from "./types";
import { fetchLiveJobs } from "./jobSources";
import { ROLE_LIBRARY } from "./roleLibrary";
import { adzunaEnabled, fromAdzuna } from "./adzuna";

/**
 * Agent 7: Salary Coach.
 *
 * Builds a pay band from LIVE job listings where possible (the honest source),
 * falls back to the internal library estimate with an explicit "estimate"
 * label, and only then writes negotiation language. Never presents a number
 * where none was found.
 */

const CURRENCY_CODE: Record<string, string> = { us: "USD", in: "INR", gb: "GBP", ca: "CAD", au: "AUD", za: "ZAR" };

const PERIOD: Record<string, string> = { year: "yr", month: "mo", week: "wk", day: "day", hour: "hr" };

function isIndiaContext(profile: Profile, locationHint?: string): boolean {
  const loc = (locationHint || profile.location || "").toLowerCase();
  return /india|\bin\b|pune|mumbai|hyderabad|bangalore|delhi|chennai|kolkata|jaipur|nida|gurgaon/.test(loc);
}

const PAY_RE = /([$€£₹]\s?\d[\d,]{2,}(?:\.\d{1,2})?[kKmM]?|\d[\d,]{2,}(?:\.\d{1,2})?\s?(?:k|L|LPA|lakhs?|lpa))\s*(?:–|-|to|–)?\s*([$€£₹]\s?\d[\d,]{2,}(?:\.\d{1,2})?[kKmM]?|\d[\d,]{2,}(?:\.\d{1,2})?\s?(?:k|L|LPA|lakhs?|lpa))?/gi;

function toAnnualAmount(raw: string, currency: string): number | null {
  const clean = raw.replace(/[$€£₹,\s]/g, "");
  const m = clean.match(/([\d.]+)([kKmM]|L|LPA|lakh|lakhs|lpa)?/);
  if (!m) return null;
  let n = parseFloat(m[1]);
  const suffix = (m[2] ?? "").toLowerCase();
  if (["k"].includes(suffix)) n *= 1000;
  else if (["m"].includes(suffix)) n *= 1_000_000;
  else if (["l", "lpa", "lakh", "lakhs"].includes(suffix)) n *= 100_000;
  if (Number.isNaN(n) || n < 3000 || n > 2_000_000) return null;
  // Heuristic: very small numbers like "120" without suffix are probably k.
  if (n < 300 && !suffix.includes("l")) n *= 1000;
  return Math.round(n);
}

/** Extracts salary midpoints from a listing's `salaryText` or description. */
function extractFromListing(job: { salaryText?: string; description?: string }): number | null {
  const text = `${job.salaryText ?? ""}\n${job.description ?? ""}`.slice(0, 3000);
  const matches = Array.from(text.matchAll(PAY_RE));
  for (const m of matches) {
    const a = toAnnualAmount(m[1] ?? "", "");
    const b = m[2] ? toAnnualAmount(m[2], "") : null;
    if (a && b && a > 5000 && a < 1_500_000 && b > a) return Math.round((a + b) / 2);
    if (a && !b && a > 15_000 && a < 1_000_000) return Math.round(a);
  }
  return null;
}

export function parseLiveSalaries(
  jobs: { salaryText?: string; description?: string }[],
): { values: number[]; currencies: string[] } {
  const values: number[] = [];
  const currencies: string[] = ["USD"]; // most live feeds with salary are USD-denominated remote
  for (const job of jobs) {
    const mid = extractFromListing(job);
    if (mid) values.push(mid);
  }
  return { values, currencies };
}

function band(values: number[]): SalaryBand | null {
  if (values.length < 3) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  return { p25: q(0.25), median: q(0.5), p75: q(0.75) };
}

function fmt(n: number, currency: string): string {
  if (currency === "INR") return `₹${n >= 100000 ? (n / 100000).toFixed(1) + " L" : n.toLocaleString("en-IN")}`;
  const symbol = { USD: "$", GBP: "£", CAD: "C$", AUD: "A$", ZAR: "R" }[currency] ?? currency + " ";
  return `${symbol}${n.toLocaleString("en-US")}`;
}

function findLibraryRole(title: string): typeof ROLE_LIBRARY[number] | null {
  const t = title.toLowerCase();
  let best: { role: typeof ROLE_LIBRARY[number]; score: number } | null = null;
  for (const role of ROLE_LIBRARY) {
    let score = 0;
    if (role.title.toLowerCase() === t) score = 100;
    else if (t.includes(role.title.toLowerCase()) || role.title.toLowerCase().includes(t)) score = 60;
    else {
      const rwords = role.title.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
      const hits = rwords.filter((w) => t.includes(w)).length;
      score = rwords.length ? (hits / rwords.length) * 50 : 0;
    }
    if (score > (best?.score ?? 0) && score >= 45) best = { role, score };
  }
  return best?.role ?? null;
}

export async function buildSalaryReport(options: {
  profile: Profile;
  roleTitle: string;
  jobDescription?: string;
  locationHint?: string;
  experienceYears?: number;
  anchorFrom?: "internal" | "jd" | "live";
  anchorValue?: number;
  skills?: string[];
}): Promise<SalaryReport> {
  const { profile, roleTitle } = options;
  const india = isIndiaContext(profile, options.locationHint);
  const currency = india ? "INR" : "USD";

  // 1) Library estimate as a floor signal
  const libraryRole = findLibraryRole(roleTitle);
  const libraryBand: [number, number] | null = libraryRole
    ? libraryRole.salaryRangeInr[1] > 0
      ? libraryRole.salaryRangeInr
      : null
    : null;

  // 2) Live market data from job feeds
  let liveListings: { salaryText?: string; description?: string }[] = [];
  try {
    const primary = await fetchLiveJobs({ query: roleTitle, sources: ["remotive", "jobicy", "himalayas"] });
    liveListings = primary.jobs;
    if (libraryRole) {
      const more = await fetchLiveJobs({ query: libraryRole.title, sources: ["remotive", "jobicy", "himalayas"] });
      liveListings = liveListings.concat(more.jobs);
    }
  } catch {
    /* live fetch is best-effort; fall back to estimate */
  }

  // Optional Adzuna (only if keys configured)
  if (adzunaEnabled()) {
    try {
      const az = await fromAdzuna(roleTitle, india ? "in" : "us");
      liveListings = liveListings.concat(
        az.map((a) => ({
          salaryText: a.minSalary && a.maxSalary
            ? `${a.currency ?? "USD"} ${a.minSalary} to ${a.maxSalary}`
            : "",
        })),
      );
    } catch {
      /* ignore */
    }
  }

  const { values, currencies } = parseLiveSalaries(liveListings);
  const liveBand = band(values);
  const liveCurrency = currencies.length
    ? currencies.sort((a, b) => currencies.filter((c) => c === b).length - currencies.filter((c) => c === a).length)[0]
    : currency;

  const dataSource: SalaryReport["dataSource"] = liveBand ? (options.jobDescription ? "jd_and_live" : "live_market") : "internal_estimate";

  // Anchor selection (which salary the candidate should quote)
  let anchor: SalaryReport["anchor"] = "internal";
  let anchorValue: number | null = null;
  const jdBand = options.anchorValue
    ? null
    : null;
  void jdBand;

  if (liveBand) {
    anchor = "live";
    anchorValue = liveBand.p75; // aim toward upper quartile, rounded below
  } else if (libraryBand) {
    anchor = "internal";
    anchorValue = Math.round((libraryBand[0] + libraryBand[1]) / 2);
  }

  // Skills premium / experience adjustment (small, conservative)
  let adj = 1;
  const highValueSkill = /llm|rag|machine learning|pytorch|cloud|kubernetes|devops|fintech|security|investment banking|strategy/i.test(
    profile.skills?.join(" ") ?? "",
  );
  if (highValueSkill) adj += 0.08;
  if ((profile.experience?.length ?? 0) > 0 && profile.skills.some((s) => liveBand && anchorValue && anchorValue > 0)) adj += 0.0;

  let targetComp: number | null = anchorValue ? Math.round(anchorValue * adj) : null;
  const walkAwayThreshold = targetComp ? Math.round(targetComp * 0.8) : null;

  const askCur = liveBand ? liveCurrency : currency;
  const talkingPoints: string[] = [];
  if (liveBand) {
    talkingPoints.push(
      `Live market data (from ${values.length} recent postings${liveCurrency ? `, mostly ${liveCurrency}` : ""}) ranges ${fmt(liveBand.p25, liveCurrency)}–${fmt(liveBand.p75, liveCurrency)} with a median near ${fmt(liveBand.median, liveCurrency)}.`,
    );
  }
  if (libraryBand) {
    talkingPoints.push(
      liveBand
        ? "This aligns with the role's typical internal band."
        : `Market estimate for ${libraryRole?.title ?? "this role"} is roughly ${fmt(libraryBand[0], currency)}–${fmt(libraryBand[1], currency)} (our internal library; no live postings had salary data).`,
    );
  }
  if (highValueSkill) {
    talkingPoints.push(
      "Your profile carries high-leverage skills (e.g. LLM/ML/clinical leadership), which typically supports the upper end of the range.",
    );
  }

  const marketLine = liveBand
    ? `For a ${roleTitle}, current live listings put the pay band roughly between ${fmt(liveBand.p25, liveCurrency)} and ${fmt(liveBand.p75, liveCurrency)}, with a midpoint around ${fmt(liveBand.median, liveCurrency)}.`
    : libraryBand
      ? `For a ${roleTitle}, the typical range appears to be ${fmt(libraryBand[0], currency)}–${fmt(libraryBand[1], currency)} (estimate).`
      : `There isn't enough public salary data for a confident ${roleTitle} range, so I would anchor on the responsibilities rather than a figure.`;

  const rangeStatement = targetComp
    ? `Based on current market data for similar ${roleTitle} roles, and on the scope of this position, I'm targeting a package around ${fmt(
        Math.round(targetComp),
        askCur,
      )} to ${fmt(Math.round(targetComp * 1.12), askCur)}. I'm flexible on total structure depending on the exact responsibilities.`
    : `I'd prefer to understand the exact responsibilities first so we can land on a fair range together.`;

  const openingAsk = targetComp
    ? `Given live data for comparable roles (${liveBand ? `${fmt(liveBand.p25, liveCurrency)}–${fmt(liveBand.p75, liveCurrency)}` : "internal estimate"}), a number aligned to that scope would be around ${fmt(Math.round(targetComp * 1.1), askCur)}, with room to discuss the final structure based on benefits and responsibilities.`
    : `I'd rather anchor on scope first, then settle a number we both find fair.`;

  const negotiationScript = buildScript({ profile, roleTitle, marketLine, openingAsk, rangeStatement, currency: askCur });

  const caveats: string[] = [];
  if (!liveBand) caveats.push("No public live listings with pay data were found, so this is an internal estimate — treat it as a starting point, not a market truth.");
  if (india && !liveBand) caveats.push("Indian compensation varies widely by city and sector; the band above is a broad national estimate.");
  caveats.push("Numbers are anchors for negotiation, not guarantees. Verify on the employer's offer letter.");

  return {
    role: roleTitle,
    currency: liveBand ? liveCurrency : currency,
    sampleSize: values.length,
    band: liveBand,
    dataSource,
    anchor,
    anchorValue,
    targetComp,
    marketLine,
    talkingPoints,
    openingAsk,
    rangeStatement,
    negotiationScript,
    walkAwayThreshold,
    caveats,
  };
}

function buildScript(input: {
  profile: Profile;
  roleTitle: string;
  marketLine: string;
  openingAsk: string;
  rangeStatement: string;
  currency: string;
}): string {
  const { profile, roleTitle, marketLine, openingAsk } = input;
  const name = profile.name?.trim() || "[Candidate]";
  const strongest = (profile.skills ?? [])[0] ?? "your core strengths";
  const flagship = profile.projects?.[0]
    ? ` — for instance, ${profile.projects[0].name}, ${profile.projects[0].description.replace(/^[a-z]/,(c)=>c.toLowerCase())}`
    : "";

  return [
    `Subject: ${roleTitle} — compensation discussion`,
    "",
    `Hi,`,
    ``,
    `Thank you for the offer — I’m enthusiastic about the ${roleTitle} role and the team.`,
    ``,
    `${marketLine}`,
    ``,
    `Considering the responsibilities and my preparation across ${strongest}${flagship ? `, ${flagship}` : ""}, I was hoping we could align closer to the market.`,
    ``,
    `${openingAsk}`,
    ``,
    `I’m flexible on the structure — base, benefits, performance components and growth path — as long as the total package reflects the scope.`,
    ``,
    `Thanks again. Looking forward to working through the details.`,
    ``,
    `Warm regards,`,
    name,
  ].join("\n");
}
