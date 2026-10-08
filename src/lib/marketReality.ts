export type MarketRealityItem = {
  stat: string;
  problem: string;
  source: string;
  sourceUrl: string;
  solution: string;
  agent: string;
};

/**
 * Current market evidence used in the Overview. These are intentionally
 * transparent, linkable survey findings—not hidden scoring inputs.
 */
export const MARKET_REALITY: MarketRealityItem[] = [
  {
    stat: "59%",
    problem: "Job seekers name applying and hearing nothing back as a top challenge.",
    source: "iHire State of Online Recruiting 2025",
    sourceUrl: "https://www.ihire.com/resourcecenter/employer/pages/the-state-of-online-recruiting-2025",
    solution: "A timed follow-up agent, response tracking, and a pipeline that stops reminders when a response arrives.",
    agent: "Follow-up Agent",
  },
  {
    stat: "39.3%",
    problem: "Candidates cite fake, fraudulent, or ghost postings as a major challenge.",
    source: "iHire State of Online Recruiting 2025",
    sourceUrl: "https://www.ihire.com/resourcecenter/employer/pages/the-state-of-online-recruiting-2025",
    solution: "A job quality gate checks freshness, clarity, source, ghost wording, and FTC-style scam patterns before applying.",
    agent: "Job Intelligence",
  },
  {
    stat: "36.5%",
    problem: "Finding jobs that meet salary requirements is a leading pain point.",
    source: "iHire State of Online Recruiting 2025",
    sourceUrl: "https://www.ihire.com/resourcecenter/employer/pages/the-state-of-online-recruiting-2025",
    solution: "Role salary estimates plus a transparency warning and an action to ask for budget before lengthy interviews.",
    agent: "Role Recommender",
  },
  {
    stat: "27.5%",
    problem: "Candidates struggle to identify jobs they are actually qualified for.",
    source: "iHire State of Online Recruiting 2025",
    sourceUrl: "https://www.ihire.com/resourcecenter/employer/pages/the-state-of-online-recruiting-2025",
    solution: "Evidence-based role matching, confidence ranges, gap challenges, and concrete learning roadmaps.",
    agent: "Role Recommender",
  },
  {
    stat: "3.1%",
    problem: "LinkedIn applications converted to interviews at a low rate in Huntr's dataset.",
    source: "Huntr 2025 Annual Job Search Trends",
    sourceUrl: "https://huntr.co/research/2025-annual-job-search-trends-report",
    solution: "The strategy agent recommends the verified company site and generates human recruiter/referral outreach—not mass apply alone.",
    agent: "Application Strategy",
  },
  {
    stat: "41%",
    problem: "Respondents in a 2025 Huntr survey said they had applied to a job scam.",
    source: "Huntr Job Search Trends Q1 2025",
    sourceUrl: "https://huntr.co/research/job-search-trends-q1-2025",
    solution: "High-risk language triggers a verify-first decision; the app warns never to pay, deposit checks, or disclose financial details.",
    agent: "Trust & Safety",
  },
];
