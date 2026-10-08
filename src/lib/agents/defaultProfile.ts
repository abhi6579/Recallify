import type { Profile } from "./types";

export const DEFAULT_PROFILE: Profile = {
  name: "Abhinav Mishra",
  location: "Pune, India",
  relocate: true,
  phone: "+91-90000-00000",
  email: "abhinav.mishra@example.com",
  linkedin: "linkedin.com/in/abhinavmishra",
  careerFields: ["engineering-tech"],
  education: [
    {
      degree: "M.Tech",
      field: "Artificial Intelligence & Machine Learning",
      institution: "NIMS University, Jaipur",
      year: "2026",
    },
    {
      degree: "B.Tech",
      field: "Computer Science & Engineering",
      institution: "CSVTU",
      year: "2023",
    },
  ],
  experience: [
    {
      title: "Data & Strategy Consultant",
      company: "MAHI INFRA GLOBAL PVT LTD",
      duration: "July 2023 – Sept 2024",
      description: "Built SQL pipelines, designed dashboards, reduced delays by 15%",
    },
  ],
  projects: [
    {
      name: "TriDomRAG-Bench",
      description: "First tri-domain benchmark for RAG evaluation",
      technologies: ["Python", "LangChain", "FAISS", "GPT-4o-mini"],
    },
    {
      name: "DocTune",
      description: "Agent-based RAG configuration tuning platform",
      technologies: ["Next.js", "FastAPI", "PostgreSQL", "LangChain"],
    },
    {
      name: "GeoPrompt",
      description: "Zero-shot satellite imagery segmentation",
      technologies: ["PyTorch", "CLIP", "SAM", "Docker"],
    },
  ],
  skills: [
    "Python", "SQL", "LangChain", "FAISS", "RAG", "LLM Evaluation",
    "Prompt Engineering", "PyTorch", "FastAPI", "Docker", "Git",
  ],
  publications: [
    {
      title: "TriDomRAG-Bench: A Tri-Domain Benchmark for Evaluating RAG",
      doi: "10.21203/rs.3.rs-9859942/v1",
      status: "Under review",
    },
  ],
  certifications: [
    "Deep Learning Specialization – DeepLearning.AI",
    "Microsoft Azure AI Fundamentals (AI-900)",
    "Google AI Essentials",
    "BCG GenAI Job Simulation",
  ],
};
