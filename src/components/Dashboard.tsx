"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/agents/types";
import ProfileTab from "./ProfileTab";
import RecommenderTab from "./RecommenderTab";
import ResumeAgentTab from "./ResumeAgentTab";
import FollowUpTab from "./FollowUpTab";
import OverviewTab from "./OverviewTab";
import JobSearchTab from "./JobSearchTab";
import SalaryTab from "./SalaryTab";
import MockInterviewTab from "./MockInterviewTab";
import LinkedInOptimizerTab from "./LinkedInOptimizerTab";
import CoachingPlanTab from "./CoachingPlanTab";
import StyleMirrorTab from "./StyleMirrorTab";

const TABS = [
  { id: "overview", label: "Overview & Autopilot" },
  { id: "coaching", label: "Coaching Plan" },
  { id: "profile", label: "Profile memory" },
  { id: "style", label: "Style Mirror" },
  { id: "recommender", label: "Role Recommender" },
  { id: "jobs", label: "Find Jobs" },
  { id: "mock-interview", label: "Mock Interview" },
  { id: "linkedin", label: "LinkedIn Optimizer" },
  { id: "salary", label: "Salary Coach" },
  { id: "resume", label: "Resume Agent" },
  { id: "followup", label: "Follow-up & Pipeline" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export default function Dashboard() {
  const [active, setActive] = useState<TabId>("overview");
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; targetRole?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = window.localStorage.getItem("autoapply:profile-cache");
      return cached ? (JSON.parse(cached) as Profile) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const requestedTab = window.sessionStorage.getItem("autoapply:dashboard-tab") as TabId | null;
    if (requestedTab && TABS.some((tab) => tab.id === requestedTab)) setActive(requestedTab);
    window.sessionStorage.removeItem("autoapply:dashboard-tab");

    const storedUser = window.localStorage.getItem("autoapply_user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {}
    }
  }, []);

  function updateProfile(next: Profile) {
    setProfile(next);
    window.localStorage.setItem("autoapply:profile-cache", JSON.stringify(next));
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/profile", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) updateProfile(data.profile);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const openSalary = () => setActive("salary");
    window.addEventListener("autoapply:open-salary", openSalary as EventListener);
    return () => window.removeEventListener("autoapply:open-salary", openSalary as EventListener);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Dashboard</h1>
          <p className="prose-muted mt-2 max-w-3xl">
            Role discovery → truthful resume tailoring with a verify-and-revise loop → cover letter, interview brief and
            listing trust check → tracked applications with automated follow-ups.
          </p>
        </div>
        {profile && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white">
              {(currentUser?.name || profile.name).charAt(0).toUpperCase()}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-slate-900">{currentUser?.name || profile.name}</p>
                <span className="badge bg-emerald-100 text-emerald-800 text-[10px] font-bold">Personal Workspace</span>
              </div>
              <p className="text-xs text-slate-500">
                {profile.skills.length} skills · {profile.projects.length} projects {profile.location ? `· ${profile.location}` : ""}
              </p>
            </div>
          </div>
        )}
      </header>

      {profile && profile.careerFields.length === 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 p-5">
          <div className="flex-1">
            <p className="font-bold text-indigo-900">Tell us your career field first</p>
            <p className="text-sm text-indigo-800">
              Takes 60 seconds and stops unrelated roles appearing in your matches.
            </p>
          </div>
          <a href="/onboarding" className="btn-primary">Set up my field →</a>
        </div>
      )}

      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-1 p-4 text-xs">
          {[
            ["1", "Profile", "Your evidence"],
            ["2", "Recommender", "Which roles fit"],
            ["3", "Find Jobs", "Live openings"],
            ["4", "Resume Agent", "Tailor + verify"],
            ["5", "Apply on employer site", "You submit"],
            ["6", "Follow-up", "Track + remind"],
          ].map(([n, title, sub], i, arr) => (
            <div key={title} className="flex items-center gap-1">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="font-bold text-slate-800">
                  <span className="mr-1 text-indigo-600">{n}</span>{title}
                </p>
                <p className="text-[10px] text-slate-500">{sub}</p>
              </div>
              {i < arr.length - 1 && <span className="text-slate-300">→</span>}
            </div>
          ))}
        </div>
      </div>

      <nav className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
              active === tab.id
                ? "bg-white text-indigo-700 shadow-[0_-2px_0_0_rgba(99,102,241,1)_inset]"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section>
        {active === "overview" && <OverviewTab onNavigate={setActive} />}
        {active === "coaching" && <CoachingPlanTab />}
        {active === "profile" && <ProfileTab profile={profile} onProfileChange={updateProfile} />}
        {active === "style" && <StyleMirrorTab />}
        {active === "recommender" && <RecommenderTab profile={profile} onTailor={() => setActive("jobs")} />}
        {active === "jobs" && <JobSearchTab profile={profile} onTailor={() => setActive("resume")} />}
        {active === "mock-interview" && <MockInterviewTab profile={profile} />}
        {active === "linkedin" && <LinkedInOptimizerTab profile={profile} />}
        {active === "salary" && <SalaryTab />}
        {active === "resume" && <ResumeAgentTab profile={profile} onProfileChange={updateProfile} />}
        {active === "followup" && <FollowUpTab profile={profile} />}
      </section>
    </div>
  );
}
