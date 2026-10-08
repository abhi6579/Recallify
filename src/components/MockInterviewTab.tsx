"use client";

import { useEffect, useState } from "react";
import type { MockFeedback, MockInterviewReport, MockQuestion, Profile } from "@/lib/agents/types";

export default function MockInterviewTab({ profile }: { profile: Profile | null }) {
  const [roleTitle, setRoleTitle] = useState(profile?.skills?.[0] ? `${profile.skills[0]} Specialist` : "AI/ML Engineer");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [activeSession, setActiveSession] = useState<MockInterviewReport | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answerInput, setAnswerInput] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [pastSessions, setPastSessions] = useState<MockInterviewReport[]>([]);

  useEffect(() => {
    fetch("/api/mock-interview")
      .then((r) => r.json())
      .then((d) => setPastSessions(d.reports || []))
      .catch(() => {});
  }, []);

  async function startSession() {
    setStarting(true);
    try {
      const res = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleTitle, companyName, jobDescription, profile }),
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setActiveSession(data.session);
        setCurrentQIndex(0);
        setAnswerInput("");
      }
    } finally {
      setStarting(false);
    }
  }

  async function submitAnswer() {
    if (!activeSession || !answerInput.trim()) return;
    const q = activeSession.questions[currentQIndex];
    setEvaluating(true);

    try {
      const res = await fetch("/api/mock-interview", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          questionId: q.id,
          answerText: answerInput,
          profile,
        }),
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setActiveSession(data.session);
      }
    } finally {
      setEvaluating(false);
    }
  }

  const currentQ: MockQuestion | undefined = activeSession?.questions[currentQIndex];
  const isCompleted = activeSession?.status === "completed" || (activeSession && activeSession.questions.every((q) => q.feedback));

  return (
    <div className="space-y-6">
      {!activeSession ? (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">🎤 AI Mock Interview Simulator</h2>
                <p className="prose-muted mt-1 max-w-2xl text-sm">
                  Practice high-stakes interview loops with an AI Hiring Manager. Get evaluated in real-time against
                  a strict STAR rubric (Structure, Metrics Grounding, Technical Depth) and learn model answers tailored to your profile.
                </p>
              </div>
              <span className="badge bg-indigo-50 text-indigo-700">6 Structured Rounds</span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-slate-600">
                Target Role
                <input
                  className="input mt-1"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Staff AI Engineer, Pharmacovigilance Associate"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Target Company (Optional)
                <input
                  className="input mt-1"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Stripe, Novartis, Google"
                />
              </label>
            </div>

            <label className="block text-xs font-semibold text-slate-600 mt-3">
              Job Description Context (Optional)
              <textarea
                className="input mt-1 min-h-[80px] text-xs"
                placeholder="Paste key JD bullets to tailor interview questions specifically to the employer's expectations..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </label>

            <button
              onClick={startSession}
              disabled={starting || !roleTitle.trim()}
              className="btn-primary mt-5"
            >
              {starting ? "Generating Targeted Interview Loop…" : "Start Mock Interview Session →"}
            </button>
          </div>

          {pastSessions.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Past Interview Rehearsals</h3>
              <div className="divide-y divide-slate-100">
                {pastSessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{s.roleTitle} {s.companyName ? `@ ${s.companyName}` : ""}</p>
                      <p className="text-xs text-slate-500">{new Date(s.createdAt || "").toLocaleDateString()} • {s.questions.length} questions</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${s.overallScore >= 80 ? "bg-emerald-100 text-emerald-800" : s.overallScore >= 65 ? "bg-indigo-100 text-indigo-800" : "bg-amber-100 text-amber-800"}`}>
                        Score: {s.overallScore}/100 ({s.readinessGrade})
                      </span>
                      <button
                        onClick={() => {
                          setActiveSession(s);
                          setCurrentQIndex(0);
                        }}
                        className="btn-secondary text-xs px-3 py-1"
                      >
                        View Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Session Header */}
          <div className="card flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Active Interview Simulation</p>
              <h2 className="text-xl font-bold text-slate-900">{activeSession.roleTitle} {activeSession.companyName ? `@ ${activeSession.companyName}` : ""}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSession(null)}
                className="btn-secondary text-xs"
              >
                Exit Session
              </button>
            </div>
          </div>

          {/* Question Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {activeSession.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentQIndex(idx);
                  setAnswerInput(q.answer || "");
                }}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                  currentQIndex === idx
                    ? "bg-indigo-600 text-white shadow-md"
                    : q.feedback
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Round {q.id}: {q.category} {q.feedback ? `(${q.feedback.overallScore}%)` : ""}
              </button>
            ))}
          </div>

          {/* Question & Answer Area */}
          {currentQ && (
            <div className="card space-y-5">
              <div>
                <span className="badge bg-indigo-100 text-indigo-800 mb-2">{currentQ.category}</span>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">{currentQ.question}</h3>
                <p className="text-xs text-slate-500 mt-1">💡 Coach Tip: {currentQ.contextHint}</p>
              </div>

              {!currentQ.feedback ? (
                <div className="space-y-3">
                  <textarea
                    className="input min-h-[160px] text-sm leading-relaxed"
                    placeholder="Type or dictate your answer using the STAR format (Situation, Task, Action, Result) with specific metrics..."
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                  />

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-slate-500">{answerInput.split(/\s+/).filter(Boolean).length} words</p>
                    <button
                      onClick={submitAnswer}
                      disabled={evaluating || !answerInput.trim()}
                      className="btn-primary"
                    >
                      {evaluating ? "Evaluating against STAR Rubric…" : "Submit Answer & Get Feedback →"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Score Breakdown */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500">Your Round Score</p>
                        <p className="text-3xl font-black text-indigo-700">{currentQ.feedback.overallScore}/100</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs text-center">
                        <div className="rounded-lg bg-white p-2 shadow-sm border border-slate-200">
                          <p className="text-[10px] uppercase text-slate-400">STAR Structure</p>
                          <p className="text-base font-bold text-slate-800">{currentQ.feedback.starScore}%</p>
                        </div>
                        <div className="rounded-lg bg-white p-2 shadow-sm border border-slate-200">
                          <p className="text-[10px] uppercase text-slate-400">Evidence & Metrics</p>
                          <p className="text-base font-bold text-slate-800">{currentQ.feedback.evidenceScore}%</p>
                        </div>
                        <div className="rounded-lg bg-white p-2 shadow-sm border border-slate-200">
                          <p className="text-[10px] uppercase text-slate-400">Clarity</p>
                          <p className="text-base font-bold text-slate-800">{currentQ.feedback.clarityScore}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                      <p className="font-bold text-emerald-900 mb-1">✓ What You Did Well</p>
                      <ul className="space-y-1 text-slate-700">
                        {currentQ.feedback.strengths.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                      <p className="font-bold text-amber-900 mb-1">⚠ What to Improve</p>
                      <ul className="space-y-1 text-slate-700">
                        {currentQ.feedback.weaknesses.map((w, i) => (
                          <li key={i}>• {w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Profile-grounded Model Answer */}
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-indigo-900 mb-1">✨ Tailored Model Answer</p>
                    <p className="text-xs leading-relaxed text-slate-800">{currentQ.feedback.modelAnswer}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setAnswerInput(currentQ.answer || "");
                        const updated = { ...activeSession };
                        updated.questions[currentQIndex].feedback = undefined;
                        setActiveSession(updated);
                      }}
                      className="btn-secondary text-xs"
                    >
                      ↻ Re-answer this Question
                    </button>

                    {currentQIndex < activeSession.questions.length - 1 ? (
                      <button
                        onClick={() => {
                          const nextIdx = currentQIndex + 1;
                          setCurrentQIndex(nextIdx);
                          setAnswerInput(activeSession.questions[nextIdx]?.answer || "");
                        }}
                        className="btn-primary"
                      >
                        Next Question →
                      </button>
                    ) : (
                      <span className="badge bg-emerald-100 text-emerald-800 font-bold">All 6 Rounds Completed!</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Final Comprehensive Report */}
          {isCompleted && (
            <div className="card bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="badge bg-indigo-500/30 text-indigo-200">Final Interview Evaluation</span>
                  <h3 className="text-2xl font-black mt-1">Readiness Grade: {activeSession.readinessGrade}</h3>
                  <p className="text-xs text-indigo-200">Hiring Decision: <strong>{activeSession.hiringDecision}</strong></p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-400">{activeSession.overallScore}/100</p>
                  <p className="text-[10px] text-slate-400 uppercase">Composite Score</p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-slate-300 border-t border-white/10 pt-3">
                {activeSession.summaryReport}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
