"use client";

import { useEffect, useState } from "react";
import type { JobAlertItem } from "@/lib/agents/types";
import { CAREER_FIELDS } from "@/lib/agents/careerFields";

export default function JobAlertsModal({
  onClose,
  onRunSearch,
}: {
  onClose: () => void;
  onRunSearch: (query: string) => void;
}) {
  const [alerts, setAlerts] = useState<JobAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newQuery, setNewQuery] = useState("");
  const [newField, setNewField] = useState("");
  const [newRemoteOnly, setNewRemoteOnly] = useState(false);
  const [newMinFit, setNewMinFit] = useState(60);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/alerts");
      const data = await res.json();
      setAlerts(data.alerts || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuery.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/jobs/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim() || newQuery.trim(),
          query: newQuery.trim(),
          careerField: newField,
          remoteOnly: newRemoteOnly,
          minFitScore: newMinFit,
          frequency: "daily",
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewQuery("");
        await loadAlerts();
      }
    } finally {
      setCreating(false);
    }
  }

  async function toggleAlert(id: number, active: boolean) {
    await fetch("/api/jobs/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    await loadAlerts();
  }

  async function deleteAlert(id: number) {
    await fetch(`/api/jobs/alerts?id=${id}`, { method: "DELETE" });
    await loadAlerts();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h3 className="font-bold text-slate-900">🔔 Automated Job Alerts</h3>
            <p className="text-xs text-slate-500">Monitor live job boards and notify on high-fit opportunities</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-lg">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Create Alert Form */}
          <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Create Search Alert</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="input text-xs"
                placeholder="Alert Name (e.g. Senior Clinical Scientist)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <input
                className="input text-xs"
                required
                placeholder="Search Keywords (e.g. clinical trial, GCP, Python)"
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <select className="input" value={newField} onChange={(e) => setNewField(e.target.value)}>
                <option value="">All Career Fields</option>
                {CAREER_FIELDS.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>

              <select className="input" value={newMinFit} onChange={(e) => setNewMinFit(Number(e.target.value))}>
                <option value={50}>Min 50% Match</option>
                <option value={65}>Min 65% Match</option>
                <option value={80}>Min 80% Match</option>
              </select>

              <label className="flex items-center gap-2 text-slate-700">
                <input type="checkbox" checked={newRemoteOnly} onChange={(e) => setNewRemoteOnly(e.target.checked)} />
                Remote Only
              </label>
            </div>

            <button type="submit" disabled={creating || !newQuery.trim()} className="btn-primary text-xs">
              {creating ? "Saving Alert…" : "+ Create Active Alert"}
            </button>
          </form>

          {/* Existing Alerts */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Active Alerts ({alerts.length})</p>
            {loading ? (
              <p className="text-xs text-slate-400 animate-pulse">Loading alerts…</p>
            ) : alerts.length === 0 ? (
              <p className="text-xs text-slate-400">No job alerts configured yet. Create one above to track new openings.</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{a.title}</span>
                        <span className={`badge ${a.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                          {a.active ? "Active" : "Paused"}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Query: &quot;{a.query}&quot; • Min {a.minFitScore}% • {a.remoteOnly ? "Remote" : "All Locations"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onRunSearch(a.query);
                          onClose();
                        }}
                        className="text-xs font-bold text-indigo-600 hover:underline px-2"
                      >
                        Search Now ↗
                      </button>
                      <button
                        onClick={() => toggleAlert(a.id, a.active)}
                        className="btn-secondary text-[10px] px-2 py-1"
                      >
                        {a.active ? "Pause" : "Resume"}
                      </button>
                      <button onClick={() => deleteAlert(a.id)} className="text-slate-400 hover:text-rose-600 font-bold px-1 text-sm">
                        ×
                      </button>
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
