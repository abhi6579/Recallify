"use client";

import { useEffect, useState } from "react";
import type { CoachingPlanData, CoachingTask } from "@/lib/agents/types";

export default function CoachingPlanTab() {
  const [plan, setPlan] = useState<CoachingPlanData | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<CoachingTask["category"]>("application");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/coaching")
      .then((r) => r.json())
      .then((d) => setPlan(d.plan))
      .catch(() => {});
  }, []);

  async function updatePlan(patch: Partial<CoachingPlanData>) {
    setSaving(true);
    try {
      const res = await fetch("/api/coaching", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (res.ok && data.plan) setPlan(data.plan);
    } finally {
      setSaving(false);
    }
  }

  function toggleTask(taskId: string) {
    if (!plan) return;
    const updatedTasks = plan.actionChecklist.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    updatePlan({ actionChecklist: updatedTasks });
  }

  function addTask() {
    if (!plan || !newTaskTitle.trim()) return;
    const newTask: CoachingTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      dueDate: "This week",
      completed: false,
    };
    updatePlan({ actionChecklist: [...plan.actionChecklist, newTask] });
    setNewTaskTitle("");
  }

  function deleteTask(taskId: string) {
    if (!plan) return;
    const updatedTasks = plan.actionChecklist.filter((t) => t.id !== taskId);
    updatePlan({ actionChecklist: updatedTasks });
  }

  if (!plan) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Weekly Coaching Plan…</div>;

  const completedCount = plan.actionChecklist.filter((t) => t.completed).length;
  const progressPct = plan.actionChecklist.length
    ? Math.round((completedCount / plan.actionChecklist.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header & Streak Tracker */}
      <div className="card bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge bg-indigo-500/30 text-indigo-200">Week #{plan.weekNumber} Active Plan</span>
              <span className="badge bg-amber-400/20 text-amber-300 font-bold">🔥 {plan.currentStreakDays} Day Search Streak</span>
            </div>
            <h2 className="text-2xl font-black mt-2">Active Career Coaching Dashboard</h2>
            <p className="text-xs text-indigo-200 mt-1">Focus Skill: <strong>{plan.focusSkillToLearn}</strong></p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-emerald-400">{progressPct}%</p>
            <p className="text-[10px] uppercase text-slate-400">Weekly Tasks Done</p>
          </div>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-[10px] uppercase text-indigo-200">Target Applications</p>
            <p className="text-lg font-bold">{plan.completedApps} / {plan.weeklyGoalApps}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-[10px] uppercase text-indigo-200">Mock Interview Reps</p>
            <p className="text-lg font-bold">{plan.completedInterviews} / {plan.weeklyGoalInterviews}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-[10px] uppercase text-indigo-200">Follow-Up Quota</p>
            <p className="text-lg font-bold">{plan.completedFollowups} / {plan.weeklyGoalFollowups}</p>
          </div>
        </div>
      </div>

      {/* Monday Plan & Friday Review */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="card space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <h3 className="font-bold text-slate-900 text-sm">Monday Strategy Brief</h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {plan.mondayPlanSummary}
          </p>
        </div>

        <div className="card space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h3 className="font-bold text-slate-900 text-sm">Friday Funnel Diagnosis</h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {plan.fridayReviewNotes}
          </p>
        </div>
      </div>

      {/* Interactive Task Checklist */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Weekly Action Checklist</h3>
            <p className="text-xs text-slate-500">High-leverage tasks to move your search forward this week</p>
          </div>
          <span className="badge bg-indigo-50 text-indigo-700">{completedCount} of {plan.actionChecklist.length} Completed</span>
        </div>

        <div className="space-y-2">
          {plan.actionChecklist.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-xs transition ${
                task.completed ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white"
              }`}
            >
              <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className={`font-medium ${task.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                  {task.title}
                </span>
              </label>

              <div className="flex items-center gap-2">
                <span className="badge bg-slate-100 text-slate-600 uppercase text-[10px]">{task.category}</span>
                <button onClick={() => deleteTask(task.id)} className="text-slate-400 hover:text-rose-600 font-bold px-1">×</button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Task Form */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <input
            className="input flex-1 text-xs"
            placeholder="Add custom task (e.g. Follow up with hiring manager at Stripe)..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <select
            className="input w-36 text-xs"
            value={newTaskCategory}
            onChange={(e) => setNewTaskCategory(e.target.value as CoachingTask["category"])}
          >
            <option value="application">Application</option>
            <option value="interview">Interview</option>
            <option value="upskilling">Upskilling</option>
            <option value="networking">Networking</option>
          </select>
          <button onClick={addTask} disabled={!newTaskTitle.trim()} className="btn-primary text-xs">
            + Add Task
          </button>
        </div>
      </div>
    </div>
  );
}
