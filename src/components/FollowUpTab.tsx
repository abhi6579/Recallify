"use client";

import { Fragment, useEffect, useState } from "react";
import { DEFAULT_FOLLOWUP_TEMPLATE } from "@/lib/agents/followupTemplate";
import EmailDispatchModal from "./EmailDispatchModal";
import type { Profile, StyleProfile } from "@/lib/agents/types";

type ApplicationRow = {
  id: number;
  company: string;
  role: string;
  contactEmail: string;
  appliedDate: string;
  followUpDelayDays: number;
  followUpMessage: string;
  maxFollowUps: number;
  status: string;
  stage: string;
  resumeRunId: number | null;
  followUpCount: number;
  lastFollowUp: string | null;
  responseDate: string | null;
  notes: string;
  createdAt: string;
};

type FollowUpLog = {
  id: number;
  applicationId: number;
  sentAt: string;
  message: string;
  channel: string;
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  sent: "bg-amber-100 text-amber-700",
  responded: "bg-emerald-100 text-emerald-700",
  no_response: "bg-rose-100 text-rose-700",
};

const STAGES = ["applied", "screening", "interview", "offer", "rejected"] as const;
const STAGE_STYLE: Record<string, string> = {
  applied: "border-slate-300",
  screening: "border-sky-400",
  interview: "border-violet-400",
  offer: "border-emerald-500",
  rejected: "border-rose-400",
};

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default function FollowUpTab({ profile }: { profile?: Profile | null }) {
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [runSummary, setRunSummary] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [logs, setLogs] = useState<FollowUpLog[]>([]);
  const [dispatchApp, setDispatchApp] = useState<ApplicationRow | null>(null);
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [stylingMessage, setStylingMessage] = useState(false);

  const [form, setForm] = useState({
    company: "",
    role: "",
    contactEmail: "",
    appliedDate: new Date().toISOString().slice(0, 10),
    followUpDelayDays: 7,
    maxFollowUps: 3,
    followUpMessage: DEFAULT_FOLLOWUP_TEMPLATE,
  });
  const [creating, setCreating] = useState(false);

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/applications");
    const data = await res.json();
    setApplications(data.applications ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const ephemeral = window.sessionStorage.getItem("autoapply:style-profile");
    if (ephemeral) {
      try {
        setStyleProfile(JSON.parse(ephemeral) as StyleProfile);
      } catch {
        window.sessionStorage.removeItem("autoapply:style-profile");
      }
    }
    fetch("/api/style")
      .then((response) => response.json())
      .then((data) => {
        if (data.profile) setStyleProfile(data.profile as StyleProfile);
      })
      .catch(() => {});
  }, []);

  async function styleFollowUpMessage() {
    if (!styleProfile) return;
    setStylingMessage(true);
    try {
      const response = await fetch("/api/style/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: form.followUpMessage,
          kind: "follow_up",
          style: styleProfile,
        }),
      });
      const data = await response.json();
      if (response.ok && data.text) setForm((current) => ({ ...current, followUpMessage: data.text }));
    } finally {
      setStylingMessage(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ ...form, company: "", role: "", contactEmail: "" });
      await refresh();
    } finally {
      setCreating(false);
    }
  }

  async function handleMarkResponded(id: number) {
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markResponded: true }),
    });
    await refresh();
  }

  async function handleStage(id: number, stage: string) {
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, ...(stage !== "applied" ? { markResponded: true } : {}) }),
    });
    await refresh();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    await refresh();
  }

  async function handleRunCheck() {
    setRunning(true);
    setRunSummary(null);
    try {
      const res = await fetch("/api/followups/run", { method: "POST" });
      const data = await res.json();
      setRunSummary(
        `Checked ${data.checked} application(s) · sent ${data.emailsSent} reminder(s) · marked ${data.markedNoResponse} as no_response.`,
      );
      await refresh();
    } finally {
      setRunning(false);
    }
  }

  async function toggleLogs(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    const res = await fetch(`/api/applications/${id}`);
    const data = await res.json();
    setLogs(data.logs ?? []);
    setExpandedId(id);
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900">📧 Follow-up Agent</h2>
        <p className="mt-1 text-sm text-slate-600">
          Track applications and let the scheduler send polite reminders when a hiring team goes quiet.
          Click &quot;Run Follow-up Check Now&quot; to simulate the daily scheduler tick.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleRunCheck} disabled={running} className="btn-primary">
            {running ? "Checking…" : "Run Follow-up Check Now"}
          </button>
          {runSummary && <span className="text-sm text-slate-600">{runSummary}</span>}
        </div>
      </div>

      <div className="card">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Log a new application</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            required
            placeholder="Company"
            className="input"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
          <input
            required
            placeholder="Role"
            className="input"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />
          <input
            placeholder="Contact email"
            className="input"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
          />
          <label className="block text-xs text-slate-500">
            Applied date
            <input
              type="date"
              required
              className="input mt-1"
              value={form.appliedDate}
              onChange={(e) => setForm({ ...form, appliedDate: e.target.value })}
            />
          </label>
          <label className="block text-xs text-slate-500">
            Follow-up delay (days)
            <input
              type="number"
              min={1}
              max={60}
              className="input mt-1"
              value={form.followUpDelayDays}
              onChange={(e) => setForm({ ...form, followUpDelayDays: Number(e.target.value) })}
            />
          </label>
          <label className="block text-xs text-slate-500">
            Max follow-ups
            <input
              type="number"
              min={1}
              max={10}
              className="input mt-1"
              value={form.maxFollowUps}
              onChange={(e) => setForm({ ...form, maxFollowUps: Number(e.target.value) })}
            />
          </label>
          <label className="col-span-full block text-xs text-slate-500">
            <span className="flex items-center justify-between gap-3">
              <span>Message template</span>
              {styleProfile && (
                <button type="button" onClick={styleFollowUpMessage} disabled={stylingMessage} className="text-xs font-bold text-violet-700 hover:underline">
                  {stylingMessage ? "Matching voice…" : "Apply my Style Mirror"}
                </button>
              )}
            </span>
            <textarea
              className="input mt-1 min-h-[120px] font-mono text-xs"
              value={form.followUpMessage}
              onChange={(e) => setForm({ ...form, followUpMessage: e.target.value })}
            />
          </label>
          <div className="col-span-full">
            <button type="submit" disabled={creating} className="btn-primary">
              {creating ? "Saving…" : "Add Application"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Pipeline board</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {STAGES.map((stage) => (
            <div key={stage} className={`rounded-xl border-t-4 bg-slate-50 p-2 ${STAGE_STYLE[stage]}`}>
              <p className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-600">
                {stage}
                <span className="rounded-full bg-white px-2 text-slate-500">{applications.filter((a) => a.stage === stage).length}</span>
              </p>
              <div className="space-y-2">
                {applications
                  .filter((a) => a.stage === stage)
                  .map((a) => (
                    <div key={a.id} className="rounded-lg border border-slate-200 bg-white p-2 text-xs shadow-sm">
                      <p className="font-semibold text-slate-900">{a.company}</p>
                      <p className="text-slate-600">{a.role}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className={`badge ${STATUS_STYLE[a.status] ?? ""}`}>{a.status}</span>
                        <select
                          className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px]"
                          value={a.stage}
                          onChange={(e) => handleStage(a.id, e.target.value)}
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>
                              → {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      {a.resumeRunId && (
                        <a href={`/resume/${a.resumeRunId}`} target="_blank" className="mt-1 block text-[10px] font-semibold text-indigo-600 hover:underline">
                          Tailored resume ↗
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Applications</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : applications.length === 0 ? (
          <p className="text-sm text-slate-500">No applications logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Applied</th>
                  <th className="py-2 pr-4">Days</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Follow-ups</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <Fragment key={app.id}>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-medium text-slate-900">{app.company}</td>
                      <td className="py-3 pr-4 text-slate-700">{app.role}</td>
                      <td className="py-3 pr-4 text-slate-600">{app.appliedDate}</td>
                      <td className="py-3 pr-4 text-slate-600">{daysSince(app.appliedDate)}d</td>
                      <td className="py-3 pr-4">
                        <span className={`badge ${STATUS_STYLE[app.status] ?? "bg-slate-100 text-slate-700"}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {app.followUpCount}/{app.maxFollowUps}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2 items-center">
                          <button
                            onClick={() => setDispatchApp(app)}
                            className="btn-secondary text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-200"
                            title="Review & Dispatch Follow-Up"
                          >
                            ✉️ Dispatch
                          </button>
                          <button onClick={() => toggleLogs(app.id)} className="text-xs font-semibold text-indigo-600 hover:underline">
                            {expandedId === app.id ? "Hide log" : "View log"}
                          </button>
                          {app.status !== "responded" && (
                            <button
                              onClick={() => handleMarkResponded(app.id)}
                              className="text-xs font-semibold text-emerald-600 hover:underline"
                            >
                              Mark responded
                            </button>
                          )}
                          <button onClick={() => handleDelete(app.id)} className="text-xs font-semibold text-rose-600 hover:underline">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === app.id && (
                      <tr className="bg-slate-50">
                        <td colSpan={7} className="p-4">
                          {logs.length === 0 ? (
                            <p className="text-xs text-slate-500">No follow-up emails sent yet.</p>
                          ) : (
                            <ul className="space-y-3">
                              {logs.map((log) => (
                                <li key={log.id} className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
                                  <p className="mb-1 font-semibold text-slate-700">
                                    Sent {new Date(log.sentAt).toLocaleString()} via {log.channel}
                                  </p>
                                  <pre className="whitespace-pre-wrap text-slate-600">{log.message}</pre>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {dispatchApp && (
        <EmailDispatchModal
          recipientEmail={dispatchApp.contactEmail}
          companyName={dispatchApp.company}
          roleTitle={dispatchApp.role}
          initialMessage={dispatchApp.followUpMessage}
          profile={profile || null}
          onClose={() => setDispatchApp(null)}
          onDispatched={async () => {
            await refresh();
          }}
        />
      )}
    </div>
  );
}
