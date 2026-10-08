"use client";

import { useEffect, useState } from "react";
import type { CustomerFeedbackItem, Profile } from "@/lib/agents/types";
import { CAREER_FIELDS } from "@/lib/agents/careerFields";

export default function CustomerFeedbackModal({
  profile,
  onClose,
}: {
  profile: Profile | null;
  onClose: () => void;
}) {
  const [reviews, setReviews] = useState<CustomerFeedbackItem[]>([]);
  const [avgRating, setAvgRating] = useState<number>(5.0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const [userName, setUserName] = useState(profile?.name || "");
  const [userRole, setUserRole] = useState(profile?.skills?.[0] ? `${profile.skills[0]} Candidate` : "Job Seeker");
  const [careerField, setCareerField] = useState(profile?.careerFields?.[0] || CAREER_FIELDS[0].label);
  const [rating, setRating] = useState(5);
  const [whatUnderstood, setWhatUnderstood] = useState("");
  const [whatLacking, setWhatLacking] = useState("");
  const [favoriteFeature, setFavoriteFeature] = useState("Role Recommender & Resume Agent");

  useEffect(() => {
    loadFeedback();
  }, []);

  async function loadFeedback() {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback");
      const data = await res.json();
      setReviews(data.reviews || []);
      setAvgRating(data.avgRating || 5.0);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userName.trim() || !whatUnderstood.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          userRole,
          careerField,
          rating,
          whatUnderstood,
          whatLacking,
          favoriteFeature,
        }),
      });
      if (res.ok) {
        setSubmittedSuccess(true);
        await loadFeedback();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900">💬 Customer Verdict &amp; Feature Feedback</h3>
              <span className="badge bg-amber-100 text-amber-900 font-bold">★ {avgRating} / 5.0 ({reviews.length} Reviews)</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Share what you understood, what value you got, and what features you think we lack</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-lg">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Submission Form */}
          {!submittedSuccess ? (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-900">Submit Your Review &amp; Gap Assessment</p>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Your Name
                  <input
                    className="input mt-1 text-xs"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Abhinav Mishra"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  Your Role / Background
                  <input
                    className="input mt-1 text-xs"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    placeholder="e.g. Data Scientist, M.Pharm, MBA"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  Rating
                  <select
                    className="input mt-1 text-xs font-bold text-amber-600"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  >
                    <option value={5}>★★★★★ (5/5) Outstanding</option>
                    <option value={4}>★★★★☆ (4/5) Very Good</option>
                    <option value={3}>★★★☆☆ (3/5) Good / Average</option>
                    <option value={2}>★★☆☆☆ (2/5) Needs Improvement</option>
                    <option value={1}>★☆☆☆☆ (1/5) Poor</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700">
                  What did you understand best about AutoApply?
                  <textarea
                    className="input mt-1 min-h-[75px] text-xs leading-relaxed"
                    required
                    placeholder="e.g. How it works as an AI job consultant, matching my specific field without fake skills, live ATS scoring..."
                    value={whatUnderstood}
                    onChange={(e) => setWhatUnderstood(e.target.value)}
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  What do you think we lack? What should we add next?
                  <textarea
                    className="input mt-1 min-h-[75px] text-xs leading-relaxed"
                    placeholder="e.g. More local hiring portals for India, 1-click Google Calendar sync, audio voice mock interviews..."
                    value={whatLacking}
                    onChange={(e) => setWhatLacking(e.target.value)}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <span>Favorite Feature:</span>
                  <select
                    className="input py-1 text-xs w-52"
                    value={favoriteFeature}
                    onChange={(e) => setFavoriteFeature(e.target.value)}
                  >
                    <option value="Role Recommender & Resume Agent">Role Recommender &amp; Resume Agent</option>
                    <option value="Mock Interview Simulator">Mock Interview Simulator</option>
                    <option value="Salary Coach">Salary Coach</option>
                    <option value="Job Discovery (Live Feeds)">Job Discovery (Live Feeds)</option>
                    <option value="LinkedIn Optimizer">LinkedIn Optimizer</option>
                    <option value="Weekly Coaching Plan">Weekly Coaching Plan</option>
                    <option value="Follow-up Agent & Pipeline">Follow-up Agent &amp; Pipeline</option>
                  </select>
                </label>

                <button type="submit" disabled={submitting || !whatUnderstood.trim()} className="btn-primary text-xs">
                  {submitting ? "Submitting…" : "Publish Review & Feedback →"}
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center space-y-2">
              <p className="font-bold text-emerald-900 text-sm">✓ Thank you for your feedback!</p>
              <p className="text-xs text-slate-600">Your review and feature suggestions have been saved into the platform.</p>
              <button onClick={() => setSubmittedSuccess(false)} className="btn-secondary text-xs px-3 py-1 mt-2">
                Submit Another Feedback Note
              </button>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Live Customer Reviews ({reviews.length})</p>
              <span className="text-xs text-slate-400">Direct candidate feedback</span>
            </div>

            {loading ? (
              <p className="text-xs text-slate-400 animate-pulse">Loading reviews…</p>
            ) : reviews.length === 0 ? (
              <p className="text-xs text-slate-500">No reviews published yet. Be the first to submit!</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="rounded-2xl border border-slate-200 bg-white p-4.5 space-y-2.5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 place-items-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                          {rev.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{rev.userName}</p>
                          <p className="text-[10px] text-slate-500">{rev.userRole} {rev.careerField ? `• ${rev.careerField}` : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge bg-indigo-50 text-indigo-700 text-[10px]">❤️ {rev.favoriteFeature}</span>
                        <span className="text-amber-500 font-bold text-xs">{"★".repeat(rev.rating)}</span>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800 text-[11px] mb-0.5">💡 What they understood:</p>
                        <p className="text-slate-600 leading-relaxed text-[11px]">{rev.whatUnderstood}</p>
                      </div>
                      {rev.whatLacking && rev.whatLacking !== "None reported" && (
                        <div>
                          <p className="font-bold text-amber-900 text-[11px] mb-0.5">🛠️ What they think we lack / feature idea:</p>
                          <p className="text-slate-600 leading-relaxed text-[11px]">{rev.whatLacking}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-right">
          <button onClick={onClose} className="btn-secondary text-xs">Close</button>
        </div>
      </div>
    </div>
  );
}
