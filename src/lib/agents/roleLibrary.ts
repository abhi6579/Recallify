import type { RoleTemplate } from "./types";

type Sen = "entry" | "mid" | "senior";

function r(
  title: string,
  category: string,
  requiredSkills: string[],
  domains: string[],
  seniority: Sen,
  inr: [number, number],
  usd: [number, number],
): RoleTemplate {
  return { title, category, requiredSkills, domains, seniority, salaryRangeInr: inr, salaryRangeUsdHourly: usd };
}

/**
 * AutoApply role library.
 *
 * Covers the same breadth as a mainstream job portal — technology, healthcare,
 * education, finance, legal, government, skilled trades, hospitality, retail,
 * logistics, creative, science, agriculture and more — so the recommender is
 * useful for every job seeker, not only software engineers.
 */
export const ROLE_LIBRARY: RoleTemplate[] = [
  // ───────────────────────── Technology & Engineering ─────────────────────────
  r("AI/ML Engineer", "Technology", ["python", "pytorch", "langchain", "docker", "git"], ["AI/ML", "Software Engineering"], "entry", [800000, 1500000], [15, 40]),
  r("RAG/LLM Engineer", "Technology", ["python", "langchain", "faiss", "rag", "vector databases"], ["AI/ML", "NLP"], "entry", [1000000, 1800000], [20, 50]),
  r("AI Researcher", "Technology", ["python", "pytorch", "deep learning", "machine learning", "statistics"], ["AI/ML", "Research"], "mid", [1000000, 2000000], [25, 55]),
  r("Data Scientist", "Technology", ["python", "sql", "machine learning", "statistics", "data visualization"], ["AI/ML", "Data"], "entry", [800000, 1400000], [18, 42]),
  r("NLP Engineer", "Technology", ["python", "natural language processing", "transformers", "hugging face", "pytorch"], ["AI/ML", "NLP"], "mid", [1000000, 1900000], [22, 52]),
  r("Computer Vision Engineer", "Technology", ["python", "computer vision", "opencv", "pytorch", "docker"], ["AI/ML", "Computer Vision"], "mid", [900000, 1800000], [20, 50]),
  r("MLOps Engineer", "Technology", ["docker", "kubernetes", "mlops", "model deployment", "ci/cd"], ["AI/ML", "DevOps"], "mid", [1200000, 2200000], [25, 60]),
  r("Prompt Engineer", "Technology", ["prompt engineering", "llm", "python", "langchain", "llm evaluation"], ["AI/ML", "NLP"], "entry", [800000, 1600000], [20, 48]),
  r("Generative AI Engineer", "Technology", ["generative ai", "llm", "python", "langchain", "diffusion models"], ["AI/ML", "NLP"], "mid", [1200000, 2200000], [28, 60]),
  r("Backend Engineer", "Technology", ["python", "fastapi", "postgresql", "docker", "rest apis"], ["Software Engineering"], "entry", [700000, 1400000], [15, 40]),
  r("Frontend Engineer", "Technology", ["javascript", "typescript", "react", "next.js", "git"], ["Software Engineering"], "entry", [700000, 1400000], [15, 40]),
  r("Full-Stack Engineer", "Technology", ["javascript", "react", "node.js", "postgresql", "docker"], ["Software Engineering"], "mid", [900000, 1800000], [18, 48]),
  r("Java Backend Engineer", "Technology", ["java", "sql", "microservices", "docker", "git"], ["Software Engineering"], "entry", [700000, 1500000], [15, 42]),
  r("DevOps Engineer", "Technology", ["docker", "kubernetes", "terraform", "ci/cd", "linux"], ["DevOps"], "mid", [1000000, 2000000], [24, 55]),
  r("Site Reliability Engineer", "Technology", ["kubernetes", "docker", "linux", "terraform", "ci/cd"], ["DevOps", "Software Engineering"], "mid", [1200000, 2200000], [28, 60]),
  r("Cloud Engineer", "Technology", ["aws", "azure", "google cloud platform", "terraform", "docker"], ["DevOps", "Cloud"], "mid", [1100000, 2100000], [26, 58]),
  r("Data Engineer", "Technology", ["python", "sql", "spark", "airflow", "etl"], ["Data", "Software Engineering"], "mid", [1000000, 1900000], [22, 55]),
  r("Analytics Engineer", "Technology", ["sql", "dbt", "snowflake", "data pipelines", "python"], ["Data"], "mid", [900000, 1700000], [20, 48]),
  r("Data Architect", "Technology", ["sql", "data pipelines", "system design", "spark", "kafka"], ["Data"], "senior", [1800000, 3200000], [40, 90]),
  r("Cybersecurity Analyst", "Technology", ["network security", "siem", "incident response", "linux", "iam"], ["Security"], "entry", [700000, 1400000], [18, 45]),
  r("Penetration Tester", "Technology", ["penetration testing", "network security", "linux", "python", "cryptography"], ["Security"], "mid", [1200000, 2200000], [28, 62]),
  r("Mobile Engineer (Android)", "Technology", ["android", "kotlin", "java", "git", "rest apis"], ["Software Engineering", "Mobile"], "entry", [700000, 1400000], [15, 40]),
  r("Mobile Engineer (iOS)", "Technology", ["ios", "swift", "git", "rest apis", "ui design"], ["Software Engineering", "Mobile"], "entry", [700000, 1400000], [15, 40]),
  r("QA / Test Engineer", "Technology", ["manual testing", "test automation", "selenium", "jira", "rest apis"], ["QA"], "entry", [500000, 1000000], [12, 32]),
  r("Game Developer", "Technology", ["unity", "unreal engine", "c++", "3d modeling", "game design"], ["Gaming"], "entry", [600000, 1300000], [14, 38]),
  r("IT Support Specialist", "Technology", ["troubleshooting", "windows administration", "networking", "customer service", "ticketing systems"], ["IT Support"], "entry", [300000, 700000], [12, 28]),
  r("Network Administrator", "Technology", ["networking", "cisco", "firewalls", "linux", "troubleshooting"], ["IT Support", "Infrastructure"], "mid", [600000, 1300000], [18, 42]),
  r("Database Administrator", "Technology", ["sql", "postgresql", "database tuning", "backup and recovery", "linux"], ["Data", "Infrastructure"], "mid", [800000, 1600000], [20, 48]),
  r("Solutions Architect", "Technology", ["system design", "aws", "microservices", "stakeholder management", "docker"], ["Cloud"], "senior", [2000000, 3800000], [45, 100]),
  r("Technical Writer", "Technology", ["technical writing", "documentation", "git", "rest apis", "editing"], ["Documentation"], "entry", [500000, 1000000], [14, 34]),

  // ───────────────────────────── Healthcare ─────────────────────────────
  r("Registered Nurse", "Healthcare", ["patient care", "clinical documentation", "vital signs", "medication administration", "infection control"], ["Healthcare", "Nursing"], "entry", [300000, 800000], [22, 45]),
  r("Staff Nurse (ICU)", "Healthcare", ["critical care", "patient care", "ventilator management", "medication administration", "emergency response"], ["Healthcare", "Nursing"], "mid", [400000, 1000000], [26, 52]),
  r("General Physician", "Healthcare", ["clinical diagnosis", "patient care", "treatment planning", "medical ethics", "clinical documentation"], ["Healthcare", "Medicine"], "mid", [800000, 2500000], [40, 120]),
  r("Dentist", "Healthcare", ["dental procedures", "oral surgery", "patient care", "radiography", "treatment planning"], ["Healthcare"], "mid", [600000, 1800000], [35, 90]),
  r("Pharmacist", "Healthcare", ["pharmacology", "dispensing", "inventory management", "patient counselling", "regulatory compliance"], ["Healthcare", "Pharmacy"], "entry", [300000, 800000], [20, 45]),
  r("Physiotherapist", "Healthcare", ["rehabilitation", "manual therapy", "exercise prescription", "patient care", "anatomy"], ["Healthcare", "Allied Health"], "entry", [300000, 800000], [18, 40]),
  r("Medical Lab Technician", "Healthcare", ["laboratory testing", "sample collection", "quality control", "biochemistry", "clinical documentation"], ["Healthcare", "Allied Health"], "entry", [250000, 600000], [15, 30]),
  r("Radiology Technician", "Healthcare", ["radiography", "medical imaging", "patient care", "radiation safety", "equipment handling"], ["Healthcare", "Allied Health"], "entry", [300000, 700000], [18, 38]),
  r("Clinical Research Associate", "Healthcare", ["clinical trials", "gcp", "regulatory compliance", "data collection", "medical writing"], ["Healthcare", "Research"], "mid", [500000, 1200000], [25, 55]),
  r("Hospital Administrator", "Healthcare", ["healthcare operations", "stakeholder management", "budgeting", "regulatory compliance", "staff management"], ["Healthcare", "Operations"], "senior", [900000, 2200000], [35, 80]),
  r("Nutritionist / Dietitian", "Healthcare", ["nutrition planning", "patient counselling", "dietary assessment", "health education"], ["Healthcare", "Wellness"], "entry", [250000, 700000], [18, 40]),
  r("Mental Health Counselor", "Healthcare", ["counselling", "active listening", "case management", "psychology", "crisis intervention"], ["Healthcare", "Mental Health"], "mid", [400000, 1000000], [25, 60]),
  r("Veterinarian", "Healthcare", ["animal care", "clinical diagnosis", "surgery", "pharmacology", "client communication"], ["Healthcare", "Veterinary"], "mid", [500000, 1500000], [30, 70]),

  // ───────────────────────────── Education ─────────────────────────────
  r("School Teacher", "Education", ["lesson planning", "classroom management", "curriculum design", "student assessment", "communication"], ["Education"], "entry", [250000, 700000], [15, 35]),
  r("Special Education Teacher", "Education", ["special education", "individualized education plans", "classroom management", "patience", "student assessment"], ["Education"], "mid", [300000, 800000], [20, 42]),
  r("College Lecturer", "Education", ["subject expertise", "curriculum design", "research", "public speaking", "student mentoring"], ["Education", "Research"], "mid", [500000, 1400000], [25, 60]),
  r("Corporate Trainer", "Education", ["training delivery", "curriculum design", "public speaking", "lms platforms", "stakeholder management"], ["Education", "Corporate"], "mid", [500000, 1400000], [30, 70]),
  r("Instructional Designer", "Education", ["curriculum design", "lms platforms", "e-learning", "storyboarding", "technical writing"], ["Education", "Design"], "mid", [600000, 1500000], [28, 65]),
  r("Academic Counselor", "Education", ["counselling", "career guidance", "communication", "student mentoring", "record keeping"], ["Education"], "entry", [300000, 800000], [16, 38]),
  r("AI Coding Instructor", "Education", ["python", "machine learning", "technical writing", "public speaking", "curriculum design"], ["Education", "AI/ML"], "entry", [600000, 1200000], [40, 70]),

  // ─────────────────────────── Finance & Accounting ───────────────────────────
  r("Financial Analyst", "Finance", ["financial modeling", "valuation", "excel modeling", "accounting", "forecasting"], ["Finance"], "entry", [500000, 1100000], [14, 36]),
  r("Investment Analyst", "Finance", ["financial modeling", "valuation", "statistics", "equity research", "excel modeling"], ["Finance"], "mid", [900000, 2000000], [22, 58]),
  r("Accountant", "Finance", ["accounting", "bookkeeping", "gaap", "excel", "tally"], ["Finance"], "entry", [250000, 700000], [12, 30]),
  r("Chartered Accountant", "Finance", ["accounting", "auditing", "taxation", "gaap", "financial reporting"], ["Finance"], "mid", [700000, 2000000], [25, 70]),
  r("Internal Auditor", "Finance", ["auditing", "risk assessment", "internal controls", "accounting", "regulatory compliance"], ["Finance", "Risk"], "mid", [700000, 1500000], [18, 44]),
  r("Tax Consultant", "Finance", ["taxation", "gst", "accounting", "regulatory compliance", "client advisory"], ["Finance"], "mid", [500000, 1400000], [20, 50]),
  r("Banking Relationship Manager", "Finance", ["banking operations", "client relationship management", "cross-selling", "kyc", "negotiation"], ["Finance", "Banking"], "mid", [400000, 1200000], [15, 40]),
  r("Loan Officer", "Finance", ["credit analysis", "kyc", "banking operations", "customer service", "documentation"], ["Finance", "Banking"], "entry", [300000, 800000], [14, 32]),
  r("Insurance Advisor", "Finance", ["insurance products", "client advisory", "negotiation", "lead generation", "customer service"], ["Finance", "Insurance"], "entry", [250000, 800000], [12, 35]),
  r("Risk Analyst", "Finance", ["risk assessment", "statistics", "financial modeling", "regulatory compliance", "sql"], ["Finance", "Risk"], "mid", [800000, 1800000], [22, 55]),
  r("Payroll Specialist", "Finance", ["payroll processing", "accounting", "excel", "labour law", "hris"], ["Finance", "HR"], "entry", [300000, 800000], [14, 32]),
  r("Quantitative Analyst", "Finance", ["python", "statistics", "machine learning", "financial modeling", "derivatives"], ["Finance", "AI/ML"], "senior", [1800000, 3500000], [40, 95]),

  // ──────────────────────── Sales, Marketing & Growth ────────────────────────
  r("Digital Marketing Specialist", "Marketing", ["seo", "sem", "google analytics", "content marketing", "social media marketing"], ["Marketing"], "entry", [400000, 900000], [10, 30]),
  r("SEO Specialist", "Marketing", ["seo", "google analytics", "keyword research", "content marketing", "link building"], ["Marketing"], "entry", [400000, 800000], [10, 28]),
  r("Performance Marketing Manager", "Marketing", ["google ads", "meta ads", "a/b testing", "google analytics", "budget management"], ["Marketing"], "mid", [900000, 2000000], [24, 55]),
  r("Content Writer", "Marketing", ["content writing", "seo", "editing", "research", "storytelling"], ["Marketing", "Content"], "entry", [250000, 700000], [12, 35]),
  r("Social Media Manager", "Marketing", ["social media marketing", "content calendar", "community management", "copywriting", "analytics"], ["Marketing"], "entry", [350000, 900000], [14, 38]),
  r("Brand Manager", "Marketing", ["brand strategy", "market research", "campaign management", "stakeholder management", "budget management"], ["Marketing"], "senior", [1200000, 2500000], [30, 70]),
  r("Sales Development Representative", "Sales", ["b2b sales", "lead generation", "salesforce", "cold calling", "negotiation"], ["Sales"], "entry", [400000, 800000], [10, 28]),
  r("Account Executive", "Sales", ["b2b sales", "negotiation", "crm", "salesforce", "pipeline management"], ["Sales"], "mid", [800000, 1800000], [20, 50]),
  r("Retail Sales Associate", "Sales", ["customer service", "product knowledge", "upselling", "pos systems", "inventory management"], ["Sales", "Retail"], "entry", [180000, 400000], [10, 20]),
  r("Business Development Manager", "Sales", ["business development", "negotiation", "market research", "crm", "stakeholder management"], ["Sales"], "senior", [1000000, 2500000], [28, 70]),
  r("Customer Success Manager", "Sales", ["customer success", "crm", "onboarding", "stakeholder management", "communication"], ["Sales", "Customer Experience"], "mid", [700000, 1800000], [22, 55]),
  r("Telecaller / Inside Sales", "Sales", ["cold calling", "customer service", "crm", "communication", "lead generation"], ["Sales"], "entry", [180000, 450000], [8, 20]),

  // ──────────────────────── Operations, Supply Chain, Logistics ────────────────────────
  r("Operations Manager", "Operations", ["operations management", "process improvement", "stakeholder management", "budgeting", "team leadership"], ["Operations"], "mid", [900000, 1900000], [20, 52]),
  r("Supply Chain Analyst", "Operations", ["supply chain", "logistics", "inventory management", "excel", "erp"], ["Operations"], "entry", [500000, 1000000], [12, 32]),
  r("Warehouse Supervisor", "Operations", ["warehouse operations", "inventory management", "team leadership", "safety compliance", "logistics"], ["Operations", "Logistics"], "mid", [300000, 800000], [14, 32]),
  r("Logistics Coordinator", "Operations", ["logistics", "shipment tracking", "vendor management", "documentation", "erp"], ["Operations", "Logistics"], "entry", [300000, 700000], [12, 28]),
  r("Procurement Executive", "Operations", ["procurement", "vendor management", "negotiation", "erp", "cost analysis"], ["Operations"], "mid", [500000, 1200000], [16, 40]),
  r("Quality Assurance Inspector", "Operations", ["quality control", "inspection", "iso standards", "documentation", "root cause analysis"], ["Operations", "Manufacturing"], "entry", [300000, 800000], [14, 32]),
  r("Production Supervisor", "Operations", ["production planning", "team leadership", "safety compliance", "lean manufacturing", "quality control"], ["Operations", "Manufacturing"], "mid", [400000, 1000000], [16, 38]),
  r("Delivery Driver", "Operations", ["safe driving", "route planning", "customer service", "time management", "vehicle maintenance"], ["Logistics"], "entry", [180000, 420000], [12, 24]),

  // ───────────────────────── Human Resources & Admin ─────────────────────────
  r("Recruiter / Talent Acquisition", "Human Resources", ["recruiting", "talent acquisition", "interviewing", "hris", "sourcing"], ["HR"], "entry", [350000, 900000], [12, 32]),
  r("HR Business Partner", "Human Resources", ["employee relations", "hris", "stakeholder management", "performance management", "labour law"], ["HR"], "mid", [900000, 1800000], [20, 48]),
  r("HR Generalist", "Human Resources", ["employee relations", "onboarding", "payroll processing", "hris", "policy implementation"], ["HR"], "entry", [300000, 800000], [14, 34]),
  r("Learning & Development Manager", "Human Resources", ["training delivery", "curriculum design", "lms platforms", "performance management", "stakeholder management"], ["HR", "Education"], "senior", [1000000, 2200000], [28, 65]),
  r("Executive Assistant", "Administration", ["calendar management", "travel coordination", "communication", "ms office", "confidentiality"], ["Administration"], "mid", [400000, 1000000], [16, 40]),
  r("Office Administrator", "Administration", ["office management", "record keeping", "ms office", "vendor coordination", "communication"], ["Administration"], "entry", [250000, 600000], [12, 26]),
  r("Data Entry Operator", "Administration", ["data entry", "typing speed", "ms office", "attention to detail", "record keeping"], ["Administration"], "entry", [150000, 350000], [8, 18]),
  r("Customer Support Executive", "Customer Service", ["customer service", "ticketing systems", "communication", "problem solving", "crm"], ["Customer Experience"], "entry", [220000, 550000], [10, 24]),
  r("Call Center Team Lead", "Customer Service", ["team leadership", "customer service", "quality monitoring", "crm", "performance management"], ["Customer Experience"], "mid", [400000, 900000], [14, 32]),

  // ───────────────────────────── Legal & Compliance ─────────────────────────────
  r("Legal Associate", "Legal", ["legal research", "drafting", "contract review", "litigation support", "legal documentation"], ["Legal"], "entry", [400000, 1200000], [20, 55]),
  r("Corporate Lawyer", "Legal", ["corporate law", "contract drafting", "negotiation", "regulatory compliance", "legal research"], ["Legal"], "senior", [1200000, 3000000], [45, 120]),
  r("Compliance Officer", "Legal", ["regulatory compliance", "risk assessment", "auditing", "policy implementation", "reporting"], ["Legal", "Risk"], "mid", [800000, 1800000], [25, 60]),
  r("Paralegal", "Legal", ["legal research", "legal documentation", "case management", "drafting", "record keeping"], ["Legal"], "entry", [300000, 800000], [16, 38]),
  r("Contract Manager", "Legal", ["contract drafting", "contract review", "negotiation", "vendor management", "regulatory compliance"], ["Legal", "Operations"], "mid", [900000, 1900000], [28, 65]),

  // ───────────────────────── Design, Media & Creative ─────────────────────────
  r("UX Designer", "Design", ["ux design", "figma", "wireframing", "user research", "prototyping"], ["Design"], "entry", [600000, 1300000], [16, 42]),
  r("UI Designer", "Design", ["ui design", "figma", "adobe xd", "visual design", "design systems"], ["Design"], "entry", [500000, 1100000], [14, 38]),
  r("Product Designer", "Design", ["ux design", "ui design", "figma", "user research", "prototyping"], ["Design", "Product"], "mid", [1000000, 2000000], [24, 58]),
  r("Graphic Designer", "Design", ["adobe photoshop", "adobe illustrator", "visual design", "branding", "typography"], ["Design", "Creative"], "entry", [250000, 700000], [12, 32]),
  r("Video Editor", "Design", ["video editing", "adobe premiere", "after effects", "storytelling", "colour grading"], ["Creative", "Media"], "entry", [300000, 800000], [14, 40]),
  r("Motion Graphics Artist", "Design", ["after effects", "motion graphics", "animation", "visual design", "storyboarding"], ["Creative", "Media"], "mid", [500000, 1200000], [20, 50]),
  r("Photographer", "Design", ["photography", "lighting", "photo editing", "adobe lightroom", "client communication"], ["Creative"], "entry", [250000, 800000], [15, 45]),
  r("Journalist / Reporter", "Media", ["reporting", "interviewing", "news writing", "research", "editing"], ["Media"], "entry", [300000, 800000], [14, 35]),
  r("Content Producer", "Media", ["content production", "scripting", "project coordination", "editing", "storytelling"], ["Media", "Content"], "mid", [500000, 1300000], [18, 45]),
  r("Public Relations Specialist", "Media", ["public relations", "media relations", "press releases", "communication", "crisis communication"], ["Media", "Marketing"], "mid", [500000, 1400000], [18, 48]),

  // ───────────────────────── Product & Project Management ─────────────────────────
  r("Product Manager", "Product", ["product management", "stakeholder management", "agile", "roadmapping", "a/b testing"], ["Product"], "mid", [1200000, 2400000], [30, 70]),
  r("Technical Product Manager", "Product", ["product management", "system design", "sql", "stakeholder management", "agile"], ["Product", "Technology"], "mid", [1400000, 2600000], [32, 75]),
  r("Project Manager", "Product", ["project management", "agile", "jira", "stakeholder management", "risk management"], ["Product"], "mid", [900000, 1800000], [22, 52]),
  r("Scrum Master", "Product", ["scrum", "agile", "jira", "facilitation", "team coaching"], ["Product"], "mid", [900000, 1700000], [22, 50]),
  r("Business Analyst", "Product", ["requirements gathering", "sql", "process mapping", "stakeholder management", "documentation"], ["Product", "Data"], "entry", [600000, 1400000], [18, 45]),
  r("Program Manager", "Product", ["program management", "stakeholder management", "budgeting", "risk management", "reporting"], ["Product", "Operations"], "senior", [1600000, 3000000], [38, 85]),

  // ───────────────────── Skilled Trades, Construction & Facilities ─────────────────────
  r("Electrician", "Skilled Trades", ["electrical wiring", "circuit troubleshooting", "safety compliance", "blueprint reading", "equipment maintenance"], ["Skilled Trades"], "entry", [200000, 600000], [15, 35]),
  r("Plumber", "Skilled Trades", ["plumbing installation", "pipe fitting", "leak detection", "safety compliance", "blueprint reading"], ["Skilled Trades"], "entry", [200000, 550000], [15, 35]),
  r("HVAC Technician", "Skilled Trades", ["hvac systems", "refrigeration", "equipment maintenance", "troubleshooting", "safety compliance"], ["Skilled Trades"], "mid", [250000, 700000], [18, 40]),
  r("Welder", "Skilled Trades", ["welding", "blueprint reading", "metal fabrication", "safety compliance", "quality control"], ["Skilled Trades", "Manufacturing"], "entry", [200000, 550000], [16, 36]),
  r("Automobile Mechanic", "Skilled Trades", ["vehicle maintenance", "engine diagnostics", "troubleshooting", "equipment handling", "customer service"], ["Skilled Trades"], "entry", [200000, 550000], [14, 32]),
  r("Civil Engineer", "Construction", ["autocad", "structural analysis", "site supervision", "project estimation", "safety compliance"], ["Construction", "Engineering"], "entry", [350000, 900000], [16, 42]),
  r("Site Supervisor", "Construction", ["site supervision", "safety compliance", "team leadership", "quality control", "scheduling"], ["Construction"], "mid", [400000, 1000000], [18, 42]),
  r("Architect", "Construction", ["architectural design", "autocad", "revit", "building codes", "project coordination"], ["Construction", "Design"], "mid", [500000, 1500000], [22, 60]),
  r("Interior Designer", "Construction", ["interior design", "space planning", "autocad", "client communication", "material selection"], ["Design", "Construction"], "entry", [300000, 900000], [16, 45]),
  r("Facility Manager", "Construction", ["facility management", "vendor management", "safety compliance", "budgeting", "maintenance planning"], ["Operations"], "mid", [600000, 1500000], [20, 48]),
  r("Mechanical Engineer", "Engineering", ["mechanical design", "autocad", "solidworks", "manufacturing processes", "quality control"], ["Engineering", "Manufacturing"], "entry", [350000, 900000], [16, 42]),
  r("Electrical Engineer", "Engineering", ["electrical design", "circuit analysis", "autocad", "power systems", "safety compliance"], ["Engineering"], "entry", [350000, 950000], [16, 44]),

  // ───────────────────────── Hospitality, Travel & Food ─────────────────────────
  r("Chef / Cook", "Hospitality", ["food preparation", "menu planning", "food safety", "kitchen management", "time management"], ["Hospitality"], "entry", [200000, 700000], [12, 30]),
  r("Restaurant Manager", "Hospitality", ["restaurant operations", "team leadership", "inventory management", "customer service", "budgeting"], ["Hospitality"], "mid", [400000, 1000000], [16, 38]),
  r("Hotel Front Desk Executive", "Hospitality", ["front desk operations", "customer service", "reservation systems", "communication", "problem solving"], ["Hospitality"], "entry", [200000, 500000], [11, 24]),
  r("Housekeeping Supervisor", "Hospitality", ["housekeeping operations", "team leadership", "quality control", "inventory management", "safety compliance"], ["Hospitality"], "entry", [200000, 500000], [11, 24]),
  r("Event Manager", "Hospitality", ["event planning", "vendor management", "budgeting", "stakeholder management", "logistics"], ["Hospitality", "Events"], "mid", [400000, 1200000], [18, 48]),
  r("Travel Consultant", "Hospitality", ["travel planning", "reservation systems", "customer service", "destination knowledge", "sales"], ["Hospitality", "Travel"], "entry", [250000, 650000], [12, 30]),
  r("Cabin Crew", "Hospitality", ["passenger safety", "customer service", "emergency procedures", "communication", "grooming standards"], ["Aviation", "Hospitality"], "entry", [400000, 1000000], [18, 40]),
  r("Barista", "Hospitality", ["beverage preparation", "customer service", "pos systems", "food safety", "teamwork"], ["Hospitality"], "entry", [150000, 350000], [9, 20]),

  // ───────────────────────── Science, Research & Environment ─────────────────────────
  r("Research Scientist", "Science", ["research design", "data analysis", "scientific writing", "laboratory techniques", "statistics"], ["Research", "Science"], "mid", [700000, 1800000], [25, 60]),
  r("Lab Chemist", "Science", ["analytical chemistry", "laboratory techniques", "quality control", "documentation", "safety compliance"], ["Science"], "entry", [300000, 750000], [15, 35]),
  r("Biotechnologist", "Science", ["molecular biology", "laboratory techniques", "research design", "data analysis", "documentation"], ["Science", "Healthcare"], "entry", [350000, 900000], [16, 40]),
  r("Environmental Specialist", "Science", ["environmental compliance", "impact assessment", "data analysis", "reporting", "sustainability"], ["Science", "Sustainability"], "mid", [500000, 1300000], [20, 50]),
  r("Agricultural Officer", "Agriculture", ["crop management", "soil analysis", "farm planning", "pest management", "extension services"], ["Agriculture"], "entry", [300000, 800000], [14, 32]),
  r("Food Technologist", "Agriculture", ["food processing", "quality control", "food safety", "product development", "regulatory compliance"], ["Agriculture", "Manufacturing"], "mid", [400000, 1000000], [16, 40]),

  // ───────────────────────── Public Sector, Safety & Social ─────────────────────────
  r("Civil Services Aspirant Role", "Government", ["policy analysis", "public administration", "report writing", "research", "communication"], ["Government"], "entry", [600000, 1500000], [15, 40]),
  r("Policy Analyst", "Government", ["policy analysis", "research", "data analysis", "report writing", "stakeholder management"], ["Government", "Research"], "mid", [700000, 1800000], [22, 55]),
  r("Social Worker", "Social Impact", ["case management", "counselling", "community outreach", "documentation", "empathy"], ["Social Impact"], "entry", [250000, 700000], [16, 35]),
  r("NGO Program Coordinator", "Social Impact", ["program management", "community outreach", "grant writing", "monitoring and evaluation", "stakeholder management"], ["Social Impact"], "mid", [400000, 1000000], [18, 42]),
  r("Security Guard", "Safety", ["surveillance", "access control", "incident reporting", "emergency response", "patrolling"], ["Safety"], "entry", [150000, 400000], [10, 22]),
  r("Safety Officer (EHS)", "Safety", ["safety compliance", "risk assessment", "incident investigation", "training delivery", "audits"], ["Safety", "Operations"], "mid", [400000, 1100000], [18, 45]),
  r("Firefighter / Emergency Responder", "Safety", ["emergency response", "first aid", "physical fitness", "equipment handling", "teamwork"], ["Safety"], "entry", [300000, 800000], [18, 40]),

  // ───────────────────────── Real Estate, Retail & Personal Services ─────────────────────────
  r("Real Estate Agent", "Real Estate", ["property sales", "client relationship management", "negotiation", "market research", "documentation"], ["Real Estate"], "entry", [250000, 1200000], [12, 45]),
  r("Property Manager", "Real Estate", ["property management", "tenant relations", "maintenance planning", "budgeting", "documentation"], ["Real Estate", "Operations"], "mid", [400000, 1100000], [16, 40]),
  r("Store Manager", "Retail", ["retail operations", "team leadership", "inventory management", "sales targets", "customer service"], ["Retail"], "mid", [350000, 900000], [15, 35]),
  r("Visual Merchandiser", "Retail", ["visual merchandising", "store layout", "branding", "creativity", "inventory management"], ["Retail", "Design"], "entry", [250000, 650000], [12, 30]),
  r("Fitness Trainer", "Wellness", ["personal training", "exercise prescription", "nutrition planning", "client motivation", "first aid"], ["Wellness"], "entry", [250000, 800000], [15, 45]),
  r("Yoga Instructor", "Wellness", ["yoga instruction", "anatomy", "class planning", "client motivation", "mindfulness"], ["Wellness"], "entry", [200000, 700000], [15, 45]),
  r("Beautician / Cosmetologist", "Wellness", ["skincare", "hair styling", "client consultation", "hygiene standards", "customer service"], ["Wellness"], "entry", [180000, 550000], [12, 32]),
  r("Childcare Worker", "Personal Services", ["child supervision", "activity planning", "first aid", "patience", "communication"], ["Personal Services"], "entry", [180000, 450000], [12, 25]),

  // ───────────────────── Pharmaceuticals & Life Sciences ─────────────────────
  r("Pharmacovigilance Associate", "Pharmaceuticals", ["pharmacovigilance", "drug safety", "adverse event reporting", "regulatory compliance", "medical writing"], ["Pharmaceuticals", "Healthcare"], "entry", [350000, 900000], [18, 42]),
  r("Regulatory Affairs Associate", "Pharmaceuticals", ["regulatory affairs", "regulatory compliance", "dossier preparation", "documentation", "pharmacology"], ["Pharmaceuticals"], "entry", [400000, 1000000], [20, 48]),
  r("Formulation Scientist", "Pharmaceuticals", ["formulation development", "pharmacology", "laboratory techniques", "quality control", "research design"], ["Pharmaceuticals", "Science"], "mid", [500000, 1300000], [22, 52]),
  r("Quality Control Analyst (Pharma)", "Pharmaceuticals", ["quality control", "hplc", "laboratory techniques", "gmp", "documentation"], ["Pharmaceuticals", "Manufacturing"], "entry", [300000, 800000], [16, 38]),
  r("Quality Assurance Officer (Pharma)", "Pharmaceuticals", ["gmp", "quality assurance", "auditing", "regulatory compliance", "documentation"], ["Pharmaceuticals"], "mid", [400000, 1100000], [18, 45]),
  r("Production Pharmacist", "Pharmaceuticals", ["pharmaceutical production", "gmp", "batch documentation", "quality control", "safety compliance"], ["Pharmaceuticals", "Manufacturing"], "entry", [300000, 800000], [16, 36]),
  r("Medical Writer", "Pharmaceuticals", ["medical writing", "clinical trials", "research", "regulatory compliance", "editing"], ["Pharmaceuticals", "Research"], "mid", [500000, 1400000], [25, 60]),
  r("Clinical Data Manager", "Pharmaceuticals", ["clinical trials", "data management", "sql", "gcp", "documentation"], ["Pharmaceuticals", "Data"], "mid", [500000, 1300000], [22, 55]),
  r("Medical Representative", "Pharmaceuticals", ["pharmaceutical sales", "product knowledge", "client relationship management", "negotiation", "territory management"], ["Pharmaceuticals", "Sales"], "entry", [250000, 700000], [12, 32]),
  r("Drug Inspector / Analyst", "Pharmaceuticals", ["pharmacology", "regulatory compliance", "inspection", "quality control", "documentation"], ["Pharmaceuticals", "Government"], "mid", [500000, 1200000], [20, 48]),

  // ───────────────────────── Academia & Higher Education ─────────────────────────
  r("Assistant Professor", "Education", ["subject expertise", "research", "curriculum design", "academic writing", "student mentoring"], ["Education", "Research"], "mid", [600000, 1500000], [28, 65]),
  r("Associate Professor", "Education", ["subject expertise", "research", "academic writing", "curriculum design", "grant writing"], ["Education", "Research"], "senior", [900000, 2200000], [38, 85]),
  r("Research Associate (Academic)", "Education", ["research design", "data analysis", "academic writing", "laboratory techniques", "literature review"], ["Education", "Research"], "entry", [350000, 900000], [18, 45]),
  r("Lab Instructor / Demonstrator", "Education", ["laboratory techniques", "student mentoring", "lesson planning", "safety compliance", "subject expertise"], ["Education"], "entry", [250000, 700000], [15, 35]),

  // ───────────────────────── Management & Consulting ─────────────────────────
  r("Management Consultant", "Management", ["business strategy", "market research", "financial modeling", "stakeholder management", "presentation skills"], ["Management", "Business"], "mid", [1200000, 2800000], [35, 90]),
  r("Strategy Analyst", "Management", ["business strategy", "market research", "data analysis", "financial modeling", "presentation skills"], ["Management", "Business"], "entry", [700000, 1600000], [22, 55]),
  r("Operations Strategy Manager", "Management", ["operations management", "business strategy", "process improvement", "stakeholder management", "budgeting"], ["Management", "Operations"], "senior", [1400000, 2800000], [35, 80]),
  r("General Manager", "Management", ["team leadership", "budgeting", "business strategy", "stakeholder management", "performance management"], ["Management"], "senior", [1500000, 3500000], [40, 95]),
  r("Marketing Manager", "Management", ["marketing strategy", "campaign management", "budget management", "market research", "team leadership"], ["Management", "Marketing"], "mid", [900000, 2200000], [26, 65]),
  r("Supply Chain Manager", "Management", ["supply chain", "vendor management", "logistics", "budgeting", "team leadership"], ["Management", "Operations"], "senior", [1200000, 2500000], [30, 72]),
];

/** Every distinct skill used across the library — merged into the parser vocabulary. */
export const ROLE_LIBRARY_SKILLS: string[] = Array.from(
  new Set(ROLE_LIBRARY.flatMap((role) => role.requiredSkills.map((s) => s.toLowerCase()))),
);

export const ROLE_CATEGORIES: string[] = Array.from(new Set(ROLE_LIBRARY.map((r) => r.category))).sort();
