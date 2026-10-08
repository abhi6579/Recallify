import {
  pgTable,
  serial,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  date,
} from "drizzle-orm/pg-core";

// ---------- Shared JSON value types ----------
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

// ---------- Profiles ----------
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  location: text("location").notNull().default(""),
  relocate: boolean("relocate").notNull().default(true),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  linkedin: text("linkedin").notNull().default(""),
  careerFields: jsonb("career_fields").$type<string[]>().notNull().default([]),
  education: jsonb("education").$type<EducationItem[]>().notNull().default([]),
  experience: jsonb("experience").$type<ExperienceItem[]>().notNull().default([]),
  projects: jsonb("projects").$type<ProjectItem[]>().notNull().default([]),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  publications: jsonb("publications").$type<PublicationItem[]>().notNull().default([]),
  certifications: jsonb("certifications").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Role templates ----------
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull().default("General"),
  requiredSkills: jsonb("required_skills").$type<string[]>().notNull().default([]),
  domains: jsonb("domains").$type<string[]>().notNull().default([]),
  seniority: text("seniority").notNull().default("entry"),
  salaryMinInr: integer("salary_min_inr").notNull().default(0),
  salaryMaxInr: integer("salary_max_inr").notNull().default(0),
  salaryMinUsdHourly: integer("salary_min_usd_hourly").notNull().default(0),
  salaryMaxUsdHourly: integer("salary_max_usd_hourly").notNull().default(0),
});

// ---------- Industry updates (news feed + bookmarks) ----------
export const newsCache = pgTable("news_cache", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>[]>().notNull().default([]),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
});

export const savedArticles = pgTable("saved_articles", {
  id: serial("id").primaryKey(),
  articleId: text("article_id").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  source: text("source").notNull().default(""),
  topic: text("topic").notNull().default(""),
  summary: text("summary").notNull().default(""),
  publishedAt: text("published_at"),
  note: text("note").notNull().default(""),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
});

export const savedJobs = pgTable("saved_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  jobId: text("job_id").notNull(),
  title: text("title").notNull(),
  company: text("company").notNull().default(""),
  location: text("location").notNull().default(""),
  remote: boolean("remote").notNull().default(false),
  salaryText: text("salary_text").notNull().default(""),
  employmentType: text("employment_type").notNull().default(""),
  postedAt: text("posted_at"),
  applyUrl: text("apply_url").notNull(),
  source: text("source").notNull().default(""),
  description: text("description").notNull().default(""),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  fitScore: integer("fit_score").notNull().default(0),
  matchedSkills: jsonb("matched_skills").$type<string[]>().notNull().default([]),
  missingSkills: jsonb("missing_skills").$type<string[]>().notNull().default([]),
  note: text("note").notNull().default(""),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Live Jobs Cache (Background Caching) ----------
export const liveJobsCache = pgTable("live_jobs_cache", {
  id: serial("id").primaryKey(),
  jobId: text("job_id").notNull().unique(),
  title: text("title").notNull(),
  company: text("company").notNull().default(""),
  location: text("location").notNull().default(""),
  remote: boolean("remote").notNull().default(false),
  salaryText: text("salary_text").notNull().default(""),
  employmentType: text("employment_type").notNull().default(""),
  postedAt: text("posted_at"),
  applyUrl: text("apply_url").notNull(),
  source: text("source").notNull().default(""),
  description: text("description").notNull().default(""),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  cachedAt: timestamp("cached_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Users & Authentication ----------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  salt: text("salt").notNull(),
  role: text("role").notNull().default("user"), // user | admin
  active: boolean("active").notNull().default(true),
  targetRole: text("target_role").notNull().default(""),
  careerField: text("career_field").notNull().default(""),
  avatarUrl: text("avatar_url").notNull().default(""),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Style Mirror (encrypted fingerprint, never raw examples) ----------
export const styleProfiles = pgTable("style_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  ciphertext: text("ciphertext").notNull(),
  iv: text("iv").notNull(),
  authTag: text("auth_tag").notNull(),
  sampleCount: integer("sample_count").notNull().default(0),
  piiSummary: jsonb("pii_summary").$type<Record<string, number>>().notNull().default({}),
  modelProvider: text("model_provider").notNull().default("deterministic"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Workspaces / User Accounts (Legacy compatibility) ----------
export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  targetRole: text("target_role").notNull().default(""),
  careerField: text("career_field").notNull().default(""),
  avatarUrl: text("avatar_url").notNull().default(""),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Mock Interviews ----------
export type MockQuestionItem = {
  id: number;
  category: string;
  question: string;
  contextHint: string;
  answer?: string;
  feedback?: {
    overallScore: number;
    starScore: number;
    evidenceScore: number;
    clarityScore: number;
    strengths: string[];
    weaknesses: string[];
    modelAnswer: string;
  };
};

export const mockInterviews = pgTable("mock_interviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  roleTitle: text("role_title").notNull(),
  companyName: text("company_name").notNull().default(""),
  jobDescription: text("job_description").notNull().default(""),
  overallScore: integer("overall_score").notNull().default(0),
  readinessGrade: text("readiness_grade").notNull().default("B"), // A, B, C, D
  hiringDecision: text("hiring_decision").notNull().default("Hire"), // Strong Hire, Hire, Lean Hire, Pass
  summaryReport: text("summary_report").notNull().default(""),
  questions: jsonb("questions").$type<MockQuestionItem[]>().notNull().default([]),
  status: text("status").notNull().default("in_progress"), // in_progress, completed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Company Intelligence Briefs ----------
export const companyBriefs = pgTable("company_briefs", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull().unique(),
  industry: text("industry").notNull().default(""),
  website: text("website").notNull().default(""),
  headquarters: text("headquarters").notNull().default(""),
  sizeStage: text("size_stage").notNull().default(""),
  techStack: jsonb("tech_stack").$type<string[]>().notNull().default([]),
  businessModel: text("business_model").notNull().default(""),
  recentDevelopments: jsonb("recent_developments").$type<string[]>().notNull().default([]),
  cultureSignals: jsonb("culture_signals").$type<string[]>().notNull().default([]),
  hiringVelocity: text("hiring_velocity").notNull().default("Moderate"), // High, Moderate, Pausing
  redFlags: jsonb("red_flags").$type<string[]>().notNull().default([]),
  whyUsPitch: text("why_us_pitch").notNull().default(""),
  smartQuestions: jsonb("smart_questions").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- LinkedIn Optimizations ----------
export const linkedInOptimizations = pgTable("linkedin_optimizations", {
  id: serial("id").primaryKey(),
  roleTarget: text("role_target").notNull(),
  seoScore: integer("seo_score").notNull().default(85),
  headlines: jsonb("headlines").$type<string[]>().notNull().default([]),
  aboutNarratives: jsonb("about_narratives").$type<{ title: string; content: string }[]>().notNull().default([]),
  coreCompetencies: jsonb("core_competencies").$type<string[]>().notNull().default([]),
  featuredProjectHooks: jsonb("featured_project_hooks").$type<string[]>().notNull().default([]),
  outreachTemplates: jsonb("outreach_templates").$type<{ target: string; message: string }[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Coaching Plans & Goals ----------
export type CoachingTask = {
  id: string;
  title: string;
  category: "application" | "interview" | "upskilling" | "networking";
  dueDate: string;
  completed: boolean;
};

export const coachingPlans = pgTable("coaching_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  weekNumber: integer("week_number").notNull().default(1),
  weeklyGoalApps: integer("weekly_goal_apps").notNull().default(8),
  weeklyGoalInterviews: integer("weekly_goal_interviews").notNull().default(2),
  weeklyGoalFollowups: integer("weekly_goal_followups").notNull().default(3),
  completedApps: integer("completed_apps").notNull().default(0),
  completedInterviews: integer("completed_interviews").notNull().default(0),
  completedFollowups: integer("completed_followups").notNull().default(0),
  currentStreakDays: integer("current_streak_days").notNull().default(3),
  focusRole: text("focus_role").notNull().default(""),
  focusSkillToLearn: text("focus_skill_to_learn").notNull().default(""),
  mondayPlanSummary: text("monday_plan_summary").notNull().default(""),
  fridayReviewNotes: text("friday_review_notes").notNull().default(""),
  actionChecklist: jsonb("action_checklist").$type<CoachingTask[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Job Alerts ----------
export const jobAlerts = pgTable("job_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  title: text("title").notNull(),
  query: text("query").notNull(),
  careerField: text("career_field").notNull().default(""),
  remoteOnly: boolean("remote_only").notNull().default(false),
  minFitScore: integer("min_fit_score").notNull().default(60),
  frequency: text("frequency").notNull().default("daily"), // daily, weekly, instant
  active: boolean("active").notNull().default(true),
  lastMatchedCount: integer("last_matched_count").notNull().default(0),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Customer Feedback & Reviews ----------
export const customerFeedback = pgTable("customer_feedback", {
  id: serial("id").primaryKey(),
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull().default("Job Seeker"),
  careerField: text("career_field").notNull().default(""),
  rating: integer("rating").notNull().default(5), // 1 to 5
  whatUnderstood: text("what_understood").notNull().default(""),
  whatLacking: text("what_lacking").notNull().default(""),
  favoriteFeature: text("favorite_feature").notNull().default("Resume Agent"),
  helpfulScore: integer("helpful_score").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Applications (Follow-up Agent) ----------
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  company: text("company").notNull(),
  role: text("role").notNull(),
  contactEmail: text("contact_email").notNull().default(""),
  appliedDate: date("applied_date").notNull(),
  followUpDelayDays: integer("follow_up_delay_days").notNull().default(7),
  followUpMessage: text("follow_up_message").notNull().default(""),
  maxFollowUps: integer("max_follow_ups").notNull().default(3),
  status: text("status").notNull().default("pending"), // pending | sent | responded | no_response
  stage: text("stage").notNull().default("applied"), // applied | screening | interview | offer | rejected
  resumeRunId: integer("resume_run_id"),
  followUpCount: integer("follow_up_count").notNull().default(0),
  lastFollowUp: timestamp("last_follow_up", { withTimezone: true }),
  responseDate: timestamp("response_date", { withTimezone: true }),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const followUpLogs = pgTable("follow_up_logs", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  message: text("message").notNull().default(""),
  channel: text("channel").notNull().default("email"),
});

// ---------- Resume Agent runs ----------
export const resumeRuns = pgTable("resume_runs", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull().default(""),
  roleTitle: text("role_title").notNull().default(""),
  jobDescription: text("job_description").notNull(),
  jdRequirements: jsonb("jd_requirements").$type<string[]>().notNull().default([]),
  matchedEvidence: jsonb("matched_evidence").$type<Record<string, unknown>[]>().notNull().default([]),
  resumeText: text("resume_text").notNull().default(""),
  atsScore: real("ats_score").notNull().default(0),
  atsMissingKeywords: jsonb("ats_missing_keywords").$type<string[]>().notNull().default([]),
  factualIssues: jsonb("factual_issues").$type<string[]>().notNull().default([]),
  factualScore: real("factual_score").notNull().default(0),
  revisionCount: integer("revision_count").notNull().default(0),
  changeReport: jsonb("change_report").$type<string[]>().notNull().default([]),
  auditTrail: jsonb("audit_trail").$type<string[]>().notNull().default([]),
  finalStatus: text("final_status").notNull().default("approved"), // approved | max_revisions
  coverLetter: text("cover_letter").notNull().default(""),
  interviewQuestions: jsonb("interview_questions").$type<{ question: string; hint: string }[]>().notNull().default([]),
  matchRangeLow: integer("match_range_low").notNull().default(0),
  matchRangeHigh: integer("match_range_high").notNull().default(0),
  llmEnhanced: boolean("llm_enhanced").notNull().default(false),
  jobContext: jsonb("job_context").$type<Record<string, unknown>>().notNull().default({}),
  jobIntelligence: jsonb("job_intelligence").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
