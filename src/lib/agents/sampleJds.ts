import { ROLE_LIBRARY } from "./roleLibrary";

export type SampleJd = {
  id: string;
  company: string;
  role: string;
  matchesRoles: string[];
  text: string;
  generated?: boolean;
};

export const SAMPLE_JDS: SampleJd[] = [
  {
    id: "infosys_daai",
    company: "Infosys DaAI",
    role: "AI/ML Engineer",
    matchesRoles: ["AI/ML Engineer", "Generative AI Engineer", "Prompt Engineer"],
    text: `Infosys Data & AI (DaAI) is hiring an AI/ML Engineer to build production GenAI solutions for enterprise clients.

Responsibilities:
- Design and implement RAG pipelines using LangChain and vector stores such as FAISS
- Build and evaluate LLM applications; own prompt engineering and LLM evaluation frameworks
- Train and fine-tune models in PyTorch; ship them behind FastAPI services
- Containerize workloads with Docker and collaborate via Git

Requirements:
- Strong Python and SQL
- Experience with LangChain, FAISS, RAG, prompt engineering
- Hands-on PyTorch and FastAPI
- Familiarity with Docker and Git`,
  },
  {
    id: "rag_llm_startup",
    company: "Nimbus AI",
    role: "RAG/LLM Engineer",
    matchesRoles: ["RAG/LLM Engineer", "NLP Engineer", "AI Researcher"],
    text: `Nimbus AI builds retrieval-augmented assistants for legal and healthcare teams.

You will:
- Own our retrieval stack: chunking, embeddings, FAISS/Pinecone vector databases, rerankers
- Design LLM evaluation harnesses and benchmarks for RAG quality
- Improve prompt engineering across products and build agents with LangChain
- Deploy services on Kubernetes with Docker

Must have: Python, LangChain, FAISS, RAG, LLM evaluation, vector databases.
Nice to have: Pinecone, Kubernetes, Hugging Face transformers.`,
  },
  {
    id: "impossible_role",
    company: "QuantumForge Games",
    role: "Senior Unreal Engine Developer",
    matchesRoles: ["Game Developer"],
    text: `QuantumForge Games seeks a Senior Unreal Engine Developer.

Requirements:
- 6+ years of C++ with Unreal Engine
- Deep knowledge of 3D modeling pipelines and game design
- Experience shipping console titles on Unity or Unreal Engine
- Kubernetes-based dedicated server orchestration
- Swift and iOS porting experience a plus`,
  },
];

function titleCase(value: string): string {
  const exact: Record<string, string> = {
    sql: "SQL",
    gmp: "GMP",
    hplc: "HPLC",
    gcp: "GCP",
    "ci/cd": "CI/CD",
    "b2b sales": "B2B Sales",
    "ui design": "UI Design",
    "ux design": "UX Design",
    "rest apis": "REST APIs",
    llm: "LLM",
    rag: "RAG",
    faiss: "FAISS",
  };
  const key = value.toLowerCase();
  return exact[key] ?? value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Returns a curated JD where one exists. Otherwise, builds a truthful role
 * brief from the selected role template—never falls back to another industry.
 *
 * Generated briefs are clearly labelled and are used only to create a draft
 * application strategy. They are not presented as a live employer vacancy.
 */
export function findJdForRole(roleTitle: string): SampleJd {
  const curated = SAMPLE_JDS.find((j) => j.matchesRoles.includes(roleTitle) || j.role === roleTitle);
  if (curated) return curated;

  const role = ROLE_LIBRARY.find((r) => r.title === roleTitle);
  if (!role) {
    return {
      id: `generated-${roleTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      company: "Employer to be selected",
      role: roleTitle,
      matchesRoles: [roleTitle],
      generated: true,
      text: `Position: ${roleTitle}\n\nUse this draft workspace to add a real employer job description before applying.`,
    };
  }

  const skills = role.requiredSkills.map(titleCase);
  return {
    id: `generated-${role.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    company: "Employer to be selected",
    role: role.title,
    matchesRoles: [role.title],
    generated: true,
    text: `Target-role planning brief — not a live job posting
Position: ${role.title}
Career area: ${role.category}
Level: ${role.seniority}

Typical responsibilities:
- Apply professional knowledge across ${skills.slice(0, 3).join(", ")}
- Work with colleagues and stakeholders to deliver accurate, high-quality outcomes
- Document work clearly, follow relevant standards, and contribute to continuous improvement

Core requirements:
${skills.map((skill) => `- ${skill}`).join("\n")}

Important: replace this planning brief with a real employer job description before submitting an application.`,
  };
}
