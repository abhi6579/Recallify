import { ROLE_LIBRARY } from "./roleLibrary";

/**
 * Career fields are the first question we ask a job seeker.
 *
 * A candidate with an M.Pharma should never be shown software engineering
 * roles, and an MBA should not be matched against clinical jobs. Each field
 * maps to the role-library categories that are genuinely reachable from that
 * background, plus the qualifications and starter skills typical for it.
 */
export type CareerField = {
  key: string;
  label: string;
  emoji: string;
  blurb: string;
  /** Role-library categories unlocked by this field. */
  categories: string[];
  /** Typical qualifications, shown as helper text during onboarding. */
  qualifications: string[];
  /** Suggested starter skills offered as one-tap chips. */
  starterSkills: string[];
  /** Representative photo (Pexels — free for commercial use, no attribution required). */
  image: string;
  imageAlt: string;
  photographer: string;
};

export const CAREER_FIELDS: CareerField[] = [
  {
    key: "engineering-tech",
    label: "Engineering & Technology",
    emoji: "💻",
    blurb: "Software, data, AI, IT, electrical, mechanical and civil engineering",
    categories: ["Technology", "Engineering", "Product"],
    qualifications: ["B.Tech / B.E.", "M.Tech / M.E.", "BCA / MCA", "B.Sc / M.Sc (CS, IT)", "Diploma (Engineering)"],
    starterSkills: ["Python", "SQL", "JavaScript", "Java", "AutoCAD", "Git", "Data Analysis", "Troubleshooting"],
    image: "/images/careers/engineering-tech.jpg",
    imageAlt: "Team of developers working together on computers in a modern tech office",
    photographer: "cottonbro studio",
  },
  {
    key: "pharmacy-life-sciences",
    label: "Pharmacy & Life Sciences",
    emoji: "💊",
    blurb: "Pharma industry, regulatory affairs, clinical research, QA/QC and teaching",
    categories: ["Pharmaceuticals", "Science", "Healthcare", "Education"],
    qualifications: ["B.Pharm", "M.Pharm", "Pharm.D", "B.Sc / M.Sc (Life Sciences)", "Ph.D (Pharmacy)"],
    starterSkills: ["Pharmacology", "GMP", "Quality Control", "Regulatory Compliance", "Clinical Trials", "Laboratory Techniques", "Medical Writing", "Documentation"],
    image: "/images/careers/pharmacy-life-sciences.jpg",
    imageAlt: "Pharmacist organising medicine shelves in a pharmacy",
    photographer: "World Sikh Organization of Canada",
  },
  {
    key: "healthcare-medicine",
    label: "Healthcare & Medicine",
    emoji: "🩺",
    blurb: "Clinical practice, nursing, allied health and hospital operations",
    categories: ["Healthcare", "Science"],
    qualifications: ["MBBS / MD", "B.Sc / M.Sc Nursing", "BDS / MDS", "BPT / MPT", "DMLT / BMLT"],
    starterSkills: ["Patient Care", "Clinical Documentation", "Medication Administration", "Vital Signs", "Infection Control", "Emergency Response", "First Aid"],
    image: "/images/careers/healthcare-medicine.jpg",
    imageAlt: "Two healthcare professionals in scrubs reviewing a patient chart",
    photographer: "cottonbro studio",
  },
  {
    key: "management-business",
    label: "Management & Business",
    emoji: "📊",
    blurb: "Consulting, strategy, product, operations, general management",
    categories: ["Management", "Product", "Operations", "Human Resources", "Marketing", "Sales"],
    qualifications: ["MBA / PGDM", "BBA / BMS", "B.Com / M.Com", "Any graduate + experience"],
    starterSkills: ["Business Strategy", "Stakeholder Management", "Market Research", "Project Management", "Team Leadership", "Presentation Skills", "Budgeting", "Agile"],
    image: "/images/careers/management-business.jpg",
    imageAlt: "A diverse group of professionals in a strategy meeting",
    photographer: "Christina Morillo",
  },
  {
    key: "finance-accounting",
    label: "Finance & Accounting",
    emoji: "💰",
    blurb: "Banking, accounting, audit, taxation, investment and risk",
    categories: ["Finance", "Management"],
    qualifications: ["CA / CMA / CS", "MBA (Finance)", "B.Com / M.Com", "CFA / FRM", "BBA (Finance)"],
    starterSkills: ["Accounting", "Financial Modeling", "Excel", "Taxation", "Auditing", "Financial Reporting", "Tally", "Risk Assessment"],
    image: "/images/careers/finance-accounting.jpg",
    imageAlt: "Hands using a calculator at a desk with financial documents",
    photographer: "Mikhail Nilov",
  },
  {
    key: "education-academia",
    label: "Education & Academia",
    emoji: "🎓",
    blurb: "Teaching, professorship, research, training and instructional design",
    categories: ["Education", "Science"],
    qualifications: ["B.Ed / M.Ed", "Ph.D", "NET / SET / JRF", "M.A / M.Sc", "Subject master's degree"],
    starterSkills: ["Lesson Planning", "Curriculum Design", "Student Assessment", "Research", "Academic Writing", "Classroom Management", "Public Speaking", "Student Mentoring"],
    image: "/images/careers/education-academia.jpg",
    imageAlt: "A teacher presenting a lesson to students in a classroom",
    photographer: "Gustavo Fring",
  },
  {
    key: "science-research",
    label: "Science & Research",
    emoji: "🔬",
    blurb: "Laboratory science, biotech, environment, agriculture and R&D",
    categories: ["Science", "Agriculture", "Pharmaceuticals", "Education"],
    qualifications: ["B.Sc / M.Sc", "Ph.D", "B.Tech (Biotech)", "M.Phil"],
    starterSkills: ["Laboratory Techniques", "Research Design", "Data Analysis", "Scientific Writing", "Quality Control", "Statistics", "Documentation"],
    image: "/images/careers/science-research.jpg",
    imageAlt: "A scientist in a lab coat using a microscope in a laboratory",
    photographer: "Artem Podrez",
  },
  {
    key: "law-compliance",
    label: "Law & Compliance",
    emoji: "⚖️",
    blurb: "Legal practice, corporate law, compliance and contracts",
    categories: ["Legal", "Government"],
    qualifications: ["LL.B / LL.M", "BA LL.B", "Company Secretary (CS)", "Diploma in Cyber Law"],
    starterSkills: ["Legal Research", "Contract Drafting", "Regulatory Compliance", "Legal Documentation", "Negotiation", "Case Management"],
    image: "/images/careers/law-compliance.jpg",
    imageAlt: "A legal professional writing at a desk in a law library",
    photographer: "KATRIN BOLOVTSOVA",
  },
  {
    key: "sales-marketing",
    label: "Sales & Marketing",
    emoji: "📣",
    blurb: "Digital marketing, brand, business development and retail sales",
    categories: ["Marketing", "Sales", "Media", "Management", "Real Estate"],
    qualifications: ["MBA (Marketing)", "BBA", "Any graduate", "Digital marketing certification"],
    starterSkills: ["SEO", "Social Media Marketing", "Google Analytics", "CRM", "Negotiation", "Lead Generation", "Content Marketing", "B2B Sales"],
    image: "/images/careers/sales-marketing.jpg",
    imageAlt: "A professional presenting campaign performance data in a meeting",
    photographer: "Mikael Blomkvist",
  },
  {
    key: "design-creative",
    label: "Design, Media & Creative",
    emoji: "🎨",
    blurb: "UX/UI, graphic design, video, journalism and content production",
    categories: ["Design", "Media", "Product"],
    qualifications: ["B.Des / M.Des", "BFA / MFA", "Mass Communication", "Portfolio-based entry"],
    starterSkills: ["Figma", "Adobe Photoshop", "Adobe Illustrator", "UX Design", "Video Editing", "Content Writing", "Visual Design", "Storytelling"],
    image: "/images/careers/design-creative.jpg",
    imageAlt: "A digital artist working with a graphics tablet",
    photographer: "Kawê Rodrigues",
  },
  {
    key: "hospitality-travel",
    label: "Hospitality, Travel & Food",
    emoji: "🍽️",
    blurb: "Hotels, restaurants, aviation, events and tourism",
    categories: ["Hospitality", "Customer Service"],
    qualifications: ["BHM / Hotel Management", "Culinary diploma", "Travel & tourism diploma", "Any graduate"],
    starterSkills: ["Customer Service", "Food Safety", "Food Preparation", "Reservation Systems", "Event Planning", "Team Leadership", "Communication"],
    image: "/images/careers/hospitality-travel.jpg",
    imageAlt: "Two chefs preparing dishes in a professional kitchen",
    photographer: "cottonbro studio",
  },
  {
    key: "trades-construction",
    label: "Skilled Trades & Construction",
    emoji: "🔧",
    blurb: "Electrical, plumbing, HVAC, welding, site work and facilities",
    categories: ["Skilled Trades", "Construction", "Engineering", "Safety"],
    qualifications: ["ITI certificate", "Diploma (Civil / Electrical / Mechanical)", "Apprenticeship", "Trade licence"],
    starterSkills: ["Blueprint Reading", "Safety Compliance", "Equipment Maintenance", "Troubleshooting", "Electrical Wiring", "Welding", "Site Supervision"],
    image: "/images/careers/trades-construction.jpg",
    imageAlt: "Two electricians installing an electrical panel on site",
    photographer: "Nelson Axigoth",
  },
  {
    key: "operations-logistics",
    label: "Operations, Supply Chain & Logistics",
    emoji: "📦",
    blurb: "Warehousing, procurement, manufacturing, quality and transport",
    categories: ["Operations", "Management", "Retail"],
    qualifications: ["MBA (Operations / SCM)", "B.Tech", "Any graduate", "Diploma in logistics"],
    starterSkills: ["Inventory Management", "Supply Chain", "Logistics", "Vendor Management", "Quality Control", "ERP", "Process Improvement"],
    image: "/images/careers/operations-logistics.jpg",
    imageAlt: "Workers handling packages in a large warehouse",
    photographer: "Tiger Lily",
  },
  {
    key: "hr-admin",
    label: "Human Resources & Administration",
    emoji: "👥",
    blurb: "Recruitment, HR operations, payroll, office and executive support",
    categories: ["Human Resources", "Administration", "Customer Service"],
    qualifications: ["MBA (HR)", "MSW", "BBA", "Any graduate"],
    starterSkills: ["Recruiting", "Employee Relations", "HRIS", "Onboarding", "Payroll Processing", "MS Office", "Communication"],
    image: "/images/careers/hr-admin.jpg",
    imageAlt: "Colleagues shaking hands after a successful interview",
    photographer: "Edmond Dantès",
  },
  {
    key: "government-social",
    label: "Government, Public & Social Impact",
    emoji: "🏛️",
    blurb: "Civil services, policy, NGOs, social work and public safety",
    categories: ["Government", "Social Impact", "Safety", "Legal"],
    qualifications: ["Any graduate", "MSW", "MA (Public Policy)", "Competitive exam preparation"],
    starterSkills: ["Policy Analysis", "Report Writing", "Research", "Community Outreach", "Case Management", "Communication"],
    image: "/images/careers/government-social.jpg",
    imageAlt: "Volunteers distributing support at a community event",
    photographer: "RDNE Stock project",
  },
  {
    key: "retail-wellness",
    label: "Retail, Wellness & Personal Services",
    emoji: "🛍️",
    blurb: "Store operations, fitness, beauty, childcare and customer-facing work",
    categories: ["Retail", "Wellness", "Personal Services", "Customer Service", "Real Estate"],
    qualifications: ["Any graduate / 12th pass", "Fitness certification", "Cosmetology diploma", "On-the-job training"],
    starterSkills: ["Customer Service", "Product Knowledge", "POS Systems", "Inventory Management", "Personal Training", "Client Consultation"],
    image: "/images/careers/retail-wellness.jpg",
    imageAlt: "A store assistant helping a customer choose clothing",
    photographer: "MART PRODUCTION",
  },
];

export function fieldByKey(key: string): CareerField | undefined {
  return CAREER_FIELDS.find((f) => f.key === key);
}

/** Union of role categories unlocked by the selected fields. */
export function categoriesForFields(keys: string[]): string[] {
  const set = new Set<string>();
  for (const key of keys) {
    for (const c of fieldByKey(key)?.categories ?? []) set.add(c);
  }
  return Array.from(set);
}

/** How many roles a field currently unlocks — shown in the picker. */
export function roleCountForField(key: string): number {
  const cats = new Set(fieldByKey(key)?.categories ?? []);
  return ROLE_LIBRARY.filter((r) => cats.has(r.category)).length;
}
