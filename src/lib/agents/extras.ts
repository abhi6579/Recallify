import type { EvidenceMatch, Profile } from "./types";
import { normalizeSkill } from "./skillsData";

// ---------------------------------------------------------------------------
// Learning paths: turn a skill gap into an actionable upskilling roadmap.
// ---------------------------------------------------------------------------

type LearningPath = { resource: string; effort: string; project: string };

const LEARNING_PATHS: Record<string, LearningPath> = {
  docker: { resource: "Docker Getting Started guide + Play with Docker labs", effort: "1 week", project: "Containerize an existing FastAPI/Flask service with a multi-stage Dockerfile" },
  kubernetes: { resource: "Kubernetes Basics (kubernetes.io) + KodeKloud CKAD course", effort: "2–3 weeks", project: "Deploy a model-serving API to a local kind/minikube cluster with HPA" },
  spark: { resource: "Databricks Academy: Apache Spark Programming", effort: "2 weeks", project: "Rewrite an ETL job in PySpark over a 1GB+ public dataset" },
  pinecone: { resource: "Pinecone Learning Center + LangChain vector store docs", effort: "3 days", project: "Swap FAISS for Pinecone in an existing RAG project and benchmark recall" },
  "vector databases": { resource: "Weaviate/Pinecone quickstarts; 'Vector Databases' by Freedium", effort: "1 week", project: "Build a hybrid (BM25 + dense) retriever with metadata filtering" },
  "lms platforms": { resource: "Moodle / Canvas instructor onboarding", effort: "2 days", project: "Publish a 3-lesson mini-course with quizzes on an LMS" },
  tensorflow: { resource: "TensorFlow Developer Certificate curriculum", effort: "2 weeks", project: "Port a PyTorch model to Keras and match its accuracy" },
  "hugging face": { resource: "Hugging Face NLP Course (free)", effort: "1–2 weeks", project: "Fine-tune a small transformer on a domain dataset and push to the Hub" },
  transformers: { resource: "'The Illustrated Transformer' + HF Course ch. 1–3", effort: "1 week", project: "Implement attention from scratch and fine-tune DistilBERT" },
  statistics: { resource: "Khan Academy Statistics + 'Practical Statistics for Data Scientists'", effort: "2 weeks", project: "Design and analyse an A/B test with power analysis" },
  "data visualization": { resource: "Storytelling with Data (book) + Plotly docs", effort: "1 week", project: "Publish an interactive dashboard on a public dataset" },
  mlops: { resource: "Made With ML (MLOps course) + MLflow docs", effort: "2–3 weeks", project: "Add experiment tracking, model registry and CI to an ML project" },
  "model deployment": { resource: "FastAPI + BentoML deployment tutorials", effort: "1 week", project: "Serve a model behind an authenticated REST endpoint with monitoring" },
  "ci/cd": { resource: "GitHub Actions docs + 'CI/CD for ML' articles", effort: "3 days", project: "Add lint/test/build/deploy pipeline to a repo" },
  terraform: { resource: "HashiCorp Learn: Terraform on AWS", effort: "1 week", project: "Provision a VPC + EC2 + RDS stack from code" },
  aws: { resource: "AWS Cloud Practitioner Essentials (free)", effort: "2 weeks", project: "Deploy a serverless API with Lambda + API Gateway + DynamoDB" },
  "machine learning": { resource: "Andrew Ng ML Specialization", effort: "4 weeks", project: "End-to-end tabular ML project with cross-validation and error analysis" },
  "deep learning": { resource: "fast.ai Practical Deep Learning", effort: "4 weeks", project: "Train and deploy an image classifier" },
  "computer vision": { resource: "fast.ai + OpenCV Bootcamp", effort: "3 weeks", project: "Build an object detection demo with YOLO" },
  opencv: { resource: "OpenCV official tutorials", effort: "1 week", project: "Real-time webcam filter/detector app" },
  "natural language processing": { resource: "HF NLP Course + spaCy 101", effort: "2–3 weeks", project: "NER + summarization pipeline over news articles" },
  javascript: { resource: "javascript.info", effort: "2 weeks", project: "Build a small SPA without frameworks" },
  typescript: { resource: "TypeScript Handbook", effort: "1 week", project: "Convert a JS project to strict TS" },
  react: { resource: "react.dev learn track", effort: "2 weeks", project: "Build a dashboard consuming a public API" },
  "next.js": { resource: "Next.js Learn course", effort: "1 week", project: "Ship a full-stack app with server actions + Postgres" },
  postgresql: { resource: "PostgreSQL Tutorial + 'The Art of PostgreSQL'", effort: "1 week", project: "Design a normalized schema with indexes and EXPLAIN-tuned queries" },
  kafka: { resource: "Confluent Kafka 101", effort: "1 week", project: "Streaming pipeline with producer/consumer and a topic-based aggregator" },
  airflow: { resource: "Astronomer Airflow Fundamentals", effort: "1 week", project: "Schedule a daily ETL DAG with retries and alerts" },
  etl: { resource: "'Fundamentals of Data Engineering' (book)", effort: "2 weeks", project: "Build an incremental ETL with data-quality checks" },
  "public speaking": { resource: "Toastmasters / local meetups", effort: "ongoing", project: "Give a 15-minute talk at a meetup and record it" },
  "technical writing": { resource: "Google Technical Writing courses (free)", effort: "1 week", project: "Write 3 tutorials for your own projects" },
  "curriculum design": { resource: "Backward Design (Wiggins & McTighe) primer", effort: "1 week", project: "Design a 4-week syllabus with learning outcomes and assessments" },
};

export function learningPathFor(skill: string): LearningPath {
  const key = normalizeSkill(skill);
  return (
    LEARNING_PATHS[key] ?? {
      resource: `Official docs + one hands-on tutorial for ${skill}`,
      effort: "1–2 weeks",
      project: `Add ${skill} to an existing portfolio project and document the results`,
    }
  );
}

// ---------------------------------------------------------------------------
// Match confidence range: express the ATS match as a band rather than a
// false-precision single number (as recommended by leading ATS tools).
// ---------------------------------------------------------------------------

export function matchConfidenceRange(atsScore: number, evidence: EvidenceMatch[]): [number, number] {
  const total = evidence.length || 1;
  const strong = evidence.filter((e) => e.score >= 0.99).length;
  const partial = evidence.filter((e) => e.score > 0 && e.score < 0.99).length;
  // Partial evidence contributes uncertainty: it may or may not satisfy a
  // human reviewer / stricter ATS.
  const uncertainty = Math.round((partial / total) * 100 * 0.4) + 3;
  const center = Math.round(atsScore * 100);
  const strongFloor = Math.round((strong / total) * 100);
  // Lower bound: never more than 12 points below center, never below the
  // fraction of requirements backed by hard (skill-list) evidence.
  const low = Math.max(0, Math.max(center - Math.min(uncertainty, 12), Math.min(strongFloor, center)));
  const high = Math.min(100, center + Math.min(uncertainty, 8));
  return [Math.min(low, center), high];
}

// ---------------------------------------------------------------------------
// Cover letter (deterministic template; optionally polished by an LLM).
// ---------------------------------------------------------------------------

export function buildCoverLetter(
  profile: Profile,
  companyName: string,
  roleTitle: string,
  evidence: EvidenceMatch[],
): string {
  const company = companyName || "your company";
  const role = roleTitle || "this role";
  const grounded = evidence.filter((e) => e.score > 0);
  const topSkills = grounded.filter((e) => e.source === "skills").slice(0, 4).map((e) => e.requirement);
  const projectEvidence = grounded.filter((e) => e.source === "projects").slice(0, 2);
  const topProject = profile.projects?.[0];
  const exp = profile.experience?.[0];
  const edu = profile.education?.[0];

  const lines: string[] = [];
  lines.push(`Dear ${company} Hiring Team,`);
  lines.push("");
  lines.push(
    `I am writing to apply for the ${role} position at ${company}. ${edu ? `As a ${edu.degree} candidate in ${edu.field}` : "As an applied AI practitioner"}${exp ? ` with industry experience as a ${exp.title} at ${exp.company}` : ""}, I bring a track record of shipping practical, well-evaluated systems.`,
  );
  lines.push("");
  if (topSkills.length > 0) {
    lines.push(
      `Your posting emphasizes ${topSkills.join(", ")} — all areas where I have hands-on, verifiable experience.${topProject ? ` For example, on ${topProject.name} I ${topProject.description.charAt(0).toLowerCase()}${topProject.description.slice(1)}, working with ${topProject.technologies.slice(0, 3).join(", ")}.` : ""}`,
    );
    lines.push("");
  }
  if (projectEvidence.length > 0) {
    lines.push(
      `Beyond the core stack, my project work directly maps to your requirements around ${projectEvidence.map((p) => p.requirement).join(" and ")}: ${projectEvidence[0].evidence[0] ?? ""}`,
    );
    lines.push("");
  }
  if (exp) {
    lines.push(`In my role at ${exp.company}, I ${exp.description.charAt(0).toLowerCase()}${exp.description.slice(1)} — experience I would bring to delivering measurable impact on your team from day one.`);
    lines.push("");
  }
  lines.push(
    `I would welcome the opportunity to discuss how my background can contribute to ${company}'s goals.${profile.relocate ? " I am open to relocation and available to start immediately." : ""} Thank you for your time and consideration.`,
  );
  lines.push("");
  lines.push("Sincerely,");
  lines.push(profile.name);
  if (profile.email) lines.push(profile.email);
  if (profile.phone) lines.push(profile.phone);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Interview prep brief: likely questions grounded in JD requirements and the
// candidate's own evidence (so hints are always truthful).
// ---------------------------------------------------------------------------

export function buildInterviewQuestions(
  roleTitle: string,
  evidence: EvidenceMatch[],
  profile: Profile,
): { question: string; hint: string }[] {
  const out: { question: string; hint: string }[] = [];
  const grounded = evidence.filter((e) => e.score > 0 && e.requirement.length < 40);
  const gaps = evidence.filter((e) => e.score === 0 && e.requirement.length < 40);

  for (const e of grounded.slice(0, 4)) {
    out.push({
      question: `Walk me through a project where you used ${e.requirement}. What trade-offs did you make?`,
      hint: e.evidence[0] ? `Anchor on: ${e.evidence[0]}` : `Anchor on your listed skill "${e.requirement}" with a concrete example.`,
    });
  }
  for (const g of gaps.slice(0, 2)) {
    out.push({
      question: `We use ${g.requirement} heavily. How would you get up to speed?`,
      hint: `Be honest that it's a gap; describe your learning plan (${learningPathFor(g.requirement).resource}) and relate it to adjacent skills you already have.`,
    });
  }
  const proj = profile.projects?.[0];
  if (proj) {
    out.push({
      question: `Tell me about ${proj.name}. What was the hardest technical problem and how did you measure success?`,
      hint: `Structure with STAR: situation, task, action, result. Mention ${proj.technologies.slice(0, 2).join(" and ")}.`,
    });
  }
  const exp = profile.experience?.[0];
  if (exp) {
    out.push({
      question: `At ${exp.company}, how did you quantify the impact of your work?`,
      hint: `Cite: ${exp.description}`,
    });
  }
  out.push({
    question: `Why ${roleTitle || "this role"}, and why now?`,
    hint: "Tie your recent projects/education to the team's mission; show you've read the JD.",
  });
  return out;
}
