export type EducationItem = {
  degree: string;
  field: string;
  institution: string;
  year: string;
};

export type ExperienceItem = {
  title: string;
  company: string;
  duration: string;
  description: string;
};

export type ProjectItem = {
  name: string;
  description: string;
  technologies: string[];
};

export type PublicationItem = {
  title: string;
  doi?: string;
  status?: string;
};

export type Profile = {
  id?: number;
  name: string;
  location: string;
  relocate: boolean;
  phone: string;
  email: string;
  linkedin: string;
  careerFields: string[];
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: string[];
  publications: PublicationItem[];
  certifications: string[];
};

export type RoleTemplate = {
  id?: number;
  title: string;
  category: string;
  requiredSkills: string[];
  domains: string[];
  seniority: "entry" | "mid" | "senior";
  salaryRangeInr: [number, number];
  salaryRangeUsdHourly: [number, number];
};

export type JobListing = {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  salaryText: string;
  employmentType: string;
  postedAt: string | null;
  applyUrl: string;
  source: string;
  description: string;
  tags: string[];
};

export type ScoredJob = JobListing & {
  fitScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  freshnessDays: number | null;
  salaryTransparent: boolean;
  verdict: "strong_fit" | "worth_applying" | "stretch" | "low_fit";
};

export type SavedJobRecord = ScoredJob & { savedId: number; savedAt: string; note: string };

// ---------- Alex (AI consultant) ----------
export type AlexAction = {
  type: "tab" | "search" | "autopilot" | "tailor-latest";
  label: string;
  tab?: "overview" | "coaching" | "profile" | "style" | "recommender" | "jobs" | "mock-interview" | "linkedin" | "salary" | "resume" | "followup";
  query?: string;
};

export type AlexReply = {
  reply: string;
  actions: AlexAction[];
  agent: string | null;
  data?: Record<string, unknown>;
};

// ---------- Salary coach ----------
export type SalaryBand = { p25: number; median: number; p75: number };

export type SalaryReport = {
  role: string;
  currency: string;
  sampleSize: number;
  band: SalaryBand | null;
  dataSource: "live_market" | "internal_estimate" | "jd_and_live";
  anchor: "internal" | "jd" | "live";
  anchorValue: number | null;
  targetComp: number | null;
  marketLine: string;
  talkingPoints: string[];
  openingAsk: string;
  rangeStatement: string;
  negotiationScript: string;
  walkAwayThreshold: number | null;
  caveats: string[];
};

// ---------- User & Authentication ----------
export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  active: boolean;
  targetRole: string;
  careerField: string;
  avatarUrl: string;
  lastLoginAt: string | null;
  createdAt: string;
};

// ---------- Style Mirror ----------
export type StyleProfile = {
  tone: string[];
  formality: "casual" | "balanced" | "formal";
  directness: "direct" | "measured" | "narrative";
  sentenceLength: "short" | "mixed" | "long";
  averageWordsPerSentence: number;
  paragraphLength: "compact" | "balanced" | "extended";
  contractions: "avoid" | "occasional" | "frequent";
  punctuationHabits: string[];
  preferredPhrases: string[];
  transitionWords: string[];
  dos: string[];
  donts: string[];
  voiceSignature: string;
  sampleCount: number;
  analyzedAt: string;
};

export type PiiSanitizationReport = {
  totalDetected: number;
  byType: Record<string, number>;
  processingMs: number;
  rawStored: false;
};

export type StyleRewriteKind = "summary" | "cover_letter" | "recruiter_message" | "follow_up" | "freeform";

// ---------- Workspace User Account ----------
export type Workspace = {
  id: number;
  slug: string;
  name: string;
  email: string;
  targetRole: string;
  careerField: string;
  avatarUrl: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

// ---------- Resume Import & Parsing ----------
export type ParsedResume = {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  skills: string[];
  careerFields: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: string[];
  publications: PublicationItem[];
  confidenceScore: number;
  extractedLines: number;
  summary: string;
};

// ---------- Mock Interview Types ----------
export type MockFeedback = {
  overallScore: number;
  starScore: number;
  evidenceScore: number;
  clarityScore: number;
  strengths: string[];
  weaknesses: string[];
  modelAnswer: string;
};

export type MockQuestion = {
  id: number;
  category: "Introduction" | "Technical Competency" | "Project Deep-Dive" | "STAR Behavioural" | "Problem Solving" | "Culture & Alignment";
  question: string;
  contextHint: string;
  answer?: string;
  feedback?: MockFeedback;
};

export type MockInterviewReport = {
  id?: number;
  roleTitle: string;
  companyName: string;
  jobDescription?: string;
  overallScore: number;
  readinessGrade: "A+" | "A" | "B" | "C" | "Needs Practice";
  hiringDecision: "Strong Hire" | "Hire" | "Lean Hire" | "Pass";
  summaryReport: string;
  questions: MockQuestion[];
  status: "in_progress" | "completed";
  createdAt?: string;
};

// ---------- Company Intelligence ----------
export type CompanyIntelligence = {
  id?: number;
  companyName: string;
  industry: string;
  website: string;
  headquarters: string;
  sizeStage: string;
  techStack: string[];
  businessModel: string;
  recentDevelopments: string[];
  cultureSignals: string[];
  hiringVelocity: "High" | "Moderate" | "Pausing";
  redFlags: string[];
  whyUsPitch: string;
  smartQuestions: string[];
};

// ---------- LinkedIn Optimization ----------
export type LinkedInPackage = {
  id?: number;
  roleTarget: string;
  seoScore: number;
  headlines: string[];
  aboutNarratives: { title: string; content: string }[];
  coreCompetencies: string[];
  featuredProjectHooks: string[];
  outreachTemplates: { target: string; message: string }[];
};

// ---------- Coaching Plan ----------
export type CoachingTask = {
  id: string;
  title: string;
  category: "application" | "interview" | "upskilling" | "networking";
  dueDate: string;
  completed: boolean;
};

export type CoachingPlanData = {
  id?: number;
  weekNumber: number;
  weeklyGoalApps: number;
  weeklyGoalInterviews: number;
  weeklyGoalFollowups: number;
  completedApps: number;
  completedInterviews: number;
  completedFollowups: number;
  currentStreakDays: number;
  focusRole: string;
  focusSkillToLearn: string;
  mondayPlanSummary: string;
  fridayReviewNotes: string;
  actionChecklist: CoachingTask[];
  updatedAt?: string;
};

// ---------- Job Alert ----------
export type JobAlertItem = {
  id: number;
  title: string;
  query: string;
  careerField: string;
  remoteOnly: boolean;
  minFitScore: number;
  frequency: "daily" | "weekly" | "instant";
  active: boolean;
  lastMatchedCount: number;
  lastCheckedAt: string;
  createdAt: string;
};

// ---------- Email Delivery Verification ----------
export type EmailDispatchResult = {
  status: "sent" | "simulated" | "failed";
  recipient: string;
  subject: string;
  messageId?: string;
  provider: "smtp" | "resend" | "simulator";
  timestamp: string;
  previewSnippet?: string;
  error?: string;
};

// ---------- Customer Feedback & Insights ----------
export type CustomerFeedbackItem = {
  id: number;
  userName: string;
  userRole: string;
  careerField: string;
  rating: number;
  whatUnderstood: string;
  whatLacking: string;
  favoriteFeature: string;
  helpfulScore: number;
  createdAt: string;
};

export type NewsArticle = {
  id: string;
  title: string;
  url: string;
  source: string;
  topic: string;
  publishedAt: string | null;
  summary: string;
};

export type SavedArticle = NewsArticle & {
  savedId: number;
  note: string;
  savedAt: string;
};

export type ProfileSignature = {
  skills: string[];
  normalizedSkills: string[];
  domains: string[];
  seniority: "entry" | "mid" | "senior";
  totalYearsExperience: number;
  keywordFrequency: Record<string, number>;
};

export type MatchedRole = {
  role: RoleTemplate;
  matchScore: number;
  missingSkills: string[];
  matchedSkills: string[];
};

export type SalaryEstimate = {
  title: string;
  salaryRangeInr: [number, number];
  salaryRangeUsdHourly: [number, number];
};

export type Recommendation = {
  title: string;
  category: string;
  matchScore: number;
  missingSkills: string[];
  matchedSkills: string[];
  domains: string[];
  seniority: string;
  salaryRangeInr: [number, number];
  salaryRangeUsdHourly: [number, number];
};

export type RecommenderResult = {
  profileSignature: ProfileSignature;
  recommendations: Recommendation[];
  auditTrail: string[];
};

export type EvidenceMatch = {
  requirement: string;
  score: number;
  evidence: string[];
  source: "skills" | "experience" | "projects" | "publications" | "certifications" | "none";
};

export type TraceStep = {
  node: string;
  detail: string;
  status: "ok" | "warn" | "skip";
  atMs: number;
};

export type InterviewQuestion = { question: string; hint: string };

export type JobContext = {
  source?: string;
  sourceUrl?: string;
  postedDate?: string;
  salaryText?: string;
  workMode?: "onsite" | "hybrid" | "remote" | "not-specified";
};

export type JobIntelligenceAction = {
  priority: "now" | "next" | "later";
  title: string;
  detail: string;
};

export type JobIntelligence = {
  trustScore: number;
  clarityScore: number;
  applicationPriority: number;
  scamRisk: "low" | "medium" | "high";
  ghostRisk: "low" | "medium" | "high";
  recommendation: "apply_now" | "apply_with_care" | "verify_first" | "upskill_first";
  salaryTransparent: boolean;
  postingAgeDays: number | null;
  positiveSignals: string[];
  riskFlags: string[];
  actions: JobIntelligenceAction[];
  recruiterMessage: string;
  referralRequest: string;
};

export type ResumeAgentResult = {
  trace: TraceStep[];
  jobContext: JobContext;
  jobIntelligence: JobIntelligence;
  coverLetter: string;
  interviewQuestions: InterviewQuestion[];
  matchRange: [number, number];
  llmEnhanced: boolean;
  jobDescription: string;
  companyName: string;
  roleTitle: string;
  jdRequirements: string[];
  matchedEvidence: EvidenceMatch[];
  resumeText: string;
  atsScore: number;
  atsMissingKeywords: string[];
  factualIssues: string[];
  factualScore: number;
  revisionCount: number;
  changeReport: string[];
  auditTrail: string[];
  finalStatus: "approved" | "max_revisions";
};

export type ApplicationStatus = "pending" | "sent" | "responded" | "no_response";

export type Application = {
  id: number;
  company: string;
  role: string;
  contactEmail: string;
  appliedDate: string;
  followUpDelayDays: number;
  followUpMessage: string;
  maxFollowUps: number;
  status: ApplicationStatus;
  stage: "applied" | "screening" | "interview" | "offer" | "rejected";
  resumeRunId: number | null;
  followUpCount: number;
  lastFollowUp: string | null;
  responseDate: string | null;
  notes: string;
  createdAt: string;
};
