// Canonical skill dictionary used to normalize free-text skills/keywords so
// that matching between profiles, job descriptions, and role templates is
// resilient to casing, punctuation, and common synonyms.

export const SKILL_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  reactjs: "react",
  "react.js": "react",
  nodejs: "node.js",
  node: "node.js",
  py: "python",
  ml: "machine learning",
  dl: "deep learning",
  nlp: "natural language processing",
  cv: "computer vision",
  llm: "llm",
  llms: "llm",
  genai: "generative ai",
  "gen ai": "generative ai",
  k8s: "kubernetes",
  gcp: "google cloud platform",
  aws: "amazon web services",
  postgres: "postgresql",
  "vector db": "vector databases",
  "vector dbs": "vector databases",
  "power bi": "power bi",
  powerbi: "power bi",
  "sql server": "sql",
  tf: "tensorflow",
};

export function normalizeSkill(raw: string): string {
  const cleaned = raw.trim().toLowerCase().replace(/[.,;:]+$/g, "");
  return SKILL_ALIASES[cleaned] ?? cleaned;
}

export function normalizeSkillList(skills: string[]): string[] {
  const seen = new Set<string>();
  for (const s of skills) {
    seen.add(normalizeSkill(s));
  }
  return Array.from(seen);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Builds a safe case-insensitive matcher for a skill/keyword, always
 * escaping regex metacharacters and only applying word-boundaries when the
 * term is a single alphanumeric word (boundaries don't make sense around
 * tokens like "c++" or "node.js"). */
export function buildSkillRegex(skill: string): RegExp {
  const escaped = escapeRegExp(skill.toLowerCase());
  const isSimpleWord = /^[a-z0-9]+$/i.test(skill);
  return new RegExp(isSimpleWord ? `\\b${escaped}\\b` : escaped, "i");
}

// A broad vocabulary of tech/business skill keywords used to scan free-text
// (job descriptions, resume bullets) and pull out recognizable skills.
const BASE_SKILL_VOCABULARY: string[] = [
  "python", "sql", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "r",
  "langchain", "langgraph", "faiss", "pinecone", "weaviate", "vector databases",
  "rag", "llm", "generative ai", "prompt engineering", "llm evaluation",
  "pytorch", "tensorflow", "keras", "scikit-learn", "opencv", "clip", "sam",
  "machine learning", "deep learning", "natural language processing", "computer vision",
  "docker", "kubernetes", "terraform", "ansible", "jenkins", "ci/cd", "git", "github actions",
  "aws", "amazon web services", "azure", "google cloud platform", "gcp",
  "fastapi", "flask", "django", "node.js", "express", "next.js", "react", "vue", "angular",
  "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "spark", "hadoop", "kafka",
  "power bi", "tableau", "excel", "looker", "airflow", "dbt", "snowflake", "bigquery",
  "linux", "bash", "rest apis", "graphql", "microservices", "system design",
  "agile", "scrum", "jira", "product management", "stakeholder management",
  "data visualization", "statistics", "a/b testing", "experiment design",
  "hugging face", "transformers", "diffusion models", "reinforcement learning",
  "mlops", "model deployment", "feature engineering", "data pipelines", "etl",
  "seo", "sem", "google analytics", "content marketing", "social media marketing",
  "salesforce", "hubspot", "crm", "lead generation", "negotiation", "b2b sales",
  "financial modeling", "valuation", "accounting", "auditing", "gaap", "excel modeling",
  "ui design", "ux design", "figma", "adobe xd", "wireframing", "user research",
  "network security", "penetration testing", "siem", "iam", "cryptography",
  "android", "ios", "swift", "kotlin", "flutter", "react native",
  "unity", "unreal engine", "3d modeling", "game design",
  "supply chain", "logistics", "inventory management", "erp", "sap",
  "recruiting", "talent acquisition", "hris", "employee relations",
  "public speaking", "technical writing", "curriculum design", "lms platforms",
];

import { ROLE_LIBRARY, ROLE_LIBRARY_SKILLS } from "./roleLibrary";
import type { RoleTemplate } from "./types";

/**
 * The parser vocabulary is the base tech list plus every skill used by the
 * full role library, so job descriptions for healthcare, education, trades,
 * hospitality, finance and other sectors parse just as well as software ones.
 */
export const SKILL_VOCABULARY: string[] = Array.from(
  new Set([...BASE_SKILL_VOCABULARY, ...ROLE_LIBRARY_SKILLS].map((s) => s.toLowerCase())),
).sort((a, b) => b.length - a.length);

export const ROLE_TEMPLATES: RoleTemplate[] = ROLE_LIBRARY;
export { ROLE_CATEGORIES } from "./roleLibrary";
