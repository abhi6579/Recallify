import { ROLE_LIBRARY } from "./roleLibrary";
import { CAREER_FIELDS, categoriesForFields } from "./careerFields";

/**
 * Canonical, human-readable skill catalogue used by the LinkedIn-style
 * autocomplete. Skills are stored lowercase internally for matching, but must
 * be presented with correct capitalisation (SQL, GMP, UX Design, CI/CD…).
 */
const EXACT_CASE: Record<string, string> = {
  sql: "SQL", html: "HTML", css: "CSS", aws: "AWS", gcp: "GCP", api: "API",
  "rest apis": "REST APIs", "ci/cd": "CI/CD", ux: "UX", ui: "UI",
  "ux design": "UX Design", "ui design": "UI Design", "ai": "AI", "ml": "ML",
  llm: "LLM", "llm evaluation": "LLM Evaluation", rag: "RAG", nlp: "NLP",
  "generative ai": "Generative AI", mlops: "MLOps", "a/b testing": "A/B Testing",
  "node.js": "Node.js", "next.js": "Next.js", "c++": "C++", "c#": "C#",
  gmp: "GMP", gcp_pharma: "GCP", hplc: "HPLC", kyc: "KYC", gst: "GST",
  gaap: "GAAP", erp: "ERP", sap: "SAP", crm: "CRM", hris: "HRIS",
  "ms office": "MS Office", "pos systems": "POS Systems", iam: "IAM",
  siem: "SIEM", seo: "SEO", sem: "SEM", "power bi": "Power BI",
  ios: "iOS", "google cloud platform": "Google Cloud Platform",
  "amazon web services": "Amazon Web Services", faiss: "FAISS",
  etl: "ETL", dbt: "dbt", "hugging face": "Hugging Face",
  "iso standards": "ISO Standards", "first aid": "First Aid",
  "individualized education plans": "Individualized Education Plans",
  "adobe xd": "Adobe XD", "after effects": "After Effects",
  "adobe premiere": "Adobe Premiere", "adobe photoshop": "Adobe Photoshop",
  "adobe illustrator": "Adobe Illustrator", "adobe lightroom": "Adobe Lightroom",
  autocad: "AutoCAD", solidworks: "SolidWorks", revit: "Revit",
  "hvac systems": "HVAC Systems", "ehs": "EHS", jira: "Jira",
  "b2b sales": "B2B Sales", "google ads": "Google Ads", "meta ads": "Meta Ads",
  "google analytics": "Google Analytics", tally: "Tally", cisco: "Cisco",
  "pytorch": "PyTorch", tensorflow: "TensorFlow", "scikit-learn": "scikit-learn",
  opencv: "OpenCV", langchain: "LangChain", fastapi: "FastAPI",
  postgresql: "PostgreSQL", mysql: "MySQL", mongodb: "MongoDB",
  javascript: "JavaScript", typescript: "TypeScript", "github actions": "GitHub Actions",
  kubernetes: "Kubernetes", docker: "Docker", terraform: "Terraform",
  "clip": "CLIP", "sam": "SAM", "gpt-4o-mini": "GPT-4o-mini",
};

const LOWER_WORDS = new Set(["and", "of", "for", "the", "to", "in", "with", "per", "a", "an"]);

export function displaySkill(raw: string): string {
  const key = raw.trim().toLowerCase();
  if (EXACT_CASE[key]) return EXACT_CASE[key];
  return key
    .split(" ")
    .map((word, i) => {
      if (i > 0 && LOWER_WORDS.has(word)) return word;
      if (word.includes("/")) return word.split("/").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("/");
      if (word.includes("-")) return word.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("-");
      if (word.startsWith("(")) return "(" + word.slice(1).charAt(0).toUpperCase() + word.slice(2);
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export type SkillEntry = {
  value: string;        // display form, e.g. "Patient Care"
  key: string;          // lowercase match key
  categories: string[]; // role categories that require it
  demand: number;       // how many roles require it
};

function buildCatalog(): SkillEntry[] {
  const map = new Map<string, { categories: Set<string>; demand: number }>();

  for (const role of ROLE_LIBRARY) {
    for (const raw of role.requiredSkills) {
      const key = raw.trim().toLowerCase();
      if (!map.has(key)) map.set(key, { categories: new Set(), demand: 0 });
      const entry = map.get(key)!;
      entry.categories.add(role.category);
      entry.demand += 1;
    }
  }

  // Starter skills from career fields may not appear in any role yet — include
  // them so the picker still suggests sensible options for that field.
  for (const field of CAREER_FIELDS) {
    for (const raw of field.starterSkills) {
      const key = raw.trim().toLowerCase();
      if (!map.has(key)) map.set(key, { categories: new Set(field.categories), demand: 0 });
      else for (const c of field.categories) map.get(key)!.categories.add(c);
    }
  }

  return Array.from(map.entries())
    .map(([key, v]) => ({ key, value: displaySkill(key), categories: Array.from(v.categories), demand: v.demand }))
    .sort((a, b) => b.demand - a.demand || a.value.localeCompare(b.value));
}

export const SKILL_CATALOG: SkillEntry[] = buildCatalog();

/**
 * LinkedIn-style ranked suggestions: prefix matches first, then word-start
 * matches, then substring matches. Skills relevant to the user's chosen
 * career fields are boosted so a pharmacy candidate sees GMP before Git.
 */
export function suggestSkills(options: {
  query: string;
  fields?: string[];
  exclude?: string[];
  limit?: number;
}): SkillEntry[] {
  const q = options.query.trim().toLowerCase();
  const limit = options.limit ?? 10;
  const excluded = new Set((options.exclude ?? []).map((s) => s.trim().toLowerCase()));
  const fieldCategories = new Set(categoriesForFields(options.fields ?? []));

  const scored: { entry: SkillEntry; score: number }[] = [];

  for (const entry of SKILL_CATALOG) {
    if (excluded.has(entry.key)) continue;

    let score: number;
    if (!q) {
      score = 10; // browsing with no query — rank purely by relevance/demand
    } else if (entry.key === q) {
      score = 1000;
    } else if (entry.key.startsWith(q)) {
      score = 500 - entry.key.length;
    } else if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(entry.key)) {
      score = 300 - entry.key.length;
    } else if (entry.key.includes(q)) {
      score = 120 - entry.key.length;
    } else {
      continue;
    }

    if (fieldCategories.size > 0 && entry.categories.some((c) => fieldCategories.has(c))) {
      score += 260; // strongly prefer skills from the candidate's own field
    }
    score += Math.min(entry.demand, 12);

    scored.push({ entry, score });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.entry);
}
