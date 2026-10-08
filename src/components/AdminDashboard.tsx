"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/agents/types";

type AdminOverview = {
  counts: {
    users: number;
    activeUsers: number;
    admins: number;
    profiles: number;
    applications: number;
    resumeRuns: number;
    mockInterviews: number;
    jobAlerts: number;
    savedJobs: number;
    cachedJobs: number;
    feedback: number;
    activeSessions: number;
    styleProfiles: number;
  };
  users: {
    id: number;
    name: string;
    email: string;
    role: string;
    active: boolean;
    targetRole: string;
    careerField: string;
    lastLoginAt: string | null;
    createdAt: string;
  }[];
  feedback: {
    id: number;
    userName: string;
    userRole: string;
    rating: number;
    favoriteFeature: string;
    whatLacking: string;
    createdAt: string;
  }[];
  integrations: {
    email: { configured: boolean; provider: string; details: string };
    llm: { enabled: boolean; provider: string };
    adzuna: boolean;
  };
};

type Tab = "overview" | "users" | "feedback" | "security";

export default function AdminDashboard({ admin }: { admin: AuthUser }) {
  const router = useRouter();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/overview", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Admin data could not be loaded.");
      setOverview(data.overview);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Admin data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleUser(userId: number, active: boolean) {
    const response = await fetch("/api/admin/overview", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, active }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Account update failed.");
      return;
    }
    await load();
  }

  async function changeAdminPassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    const response = await fetch("/api/admin/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await response.json();
    if (!response.ok) {
      setPasswordMessage(data.error || "Password change failed.");
      return;
    }

    window.localStorage.removeItem("autoapply_token");
    window.localStorage.removeItem("autoapply_user");
    router.push("/login?changed=1");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-100 py-8">
      <div className="section">
        <header className="mb-6 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
          <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">Creator control room</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">AutoApply Administration</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Monitor users, adoption, resumes, interviews, live-job inventory, customer feedback, and production integrations.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <p className="font-bold">{admin.name}</p>
              <p className="text-xs text-slate-400">{admin.email}</p>
              <span className="mt-2 inline-flex rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-200">Administrator</span>
            </div>
          </div>
        </header>

        <nav className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {([
            ["overview", "Overview"],
            ["users", "Users"],
            ["feedback", "Customer feedback"],
            ["security", "Security & integrations"],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === id ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {label}
            </button>
          ))}
          <button onClick={load} className="btn-secondary ml-auto text-xs" disabled={loading}>
            {loading ? "Refreshing…" : "Refresh data"}
          </button>
        </nav>

        {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}

        {!overview && loading ? (
          <div className="card animate-pulse text-sm text-slate-500">Loading administrative data…</div>
        ) : overview ? (
          <>
            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                  <Metric label="Registered users" value={overview.counts.users} detail={`${overview.counts.activeUsers} active`} />
                  <Metric label="Applications" value={overview.counts.applications} detail="tracked" />
                  <Metric label="Resume runs" value={overview.counts.resumeRuns} detail="generated" />
                  <Metric label="Mock interviews" value={overview.counts.mockInterviews} detail="sessions" />
                  <Metric label="Cached jobs" value={overview.counts.cachedJobs} detail={`${overview.counts.savedJobs} saved`} />
                  <Metric label="Feedback" value={overview.counts.feedback} detail="reviews" />
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className="card">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-slate-900">Platform activity</h2>
                      <span className="badge bg-emerald-100 text-emerald-700">Live</span>
                    </div>
                    <div className="mt-4 space-y-3 text-sm">
                      <Activity label="Profiles initialized" value={overview.counts.profiles} />
                      <Activity label="Active sessions" value={overview.counts.activeSessions} />
                      <Activity label="Job alerts configured" value={overview.counts.jobAlerts} />
                      <Activity label="Administrator accounts" value={overview.counts.admins} />
                    </div>
                  </section>

                  <section className="card">
                    <h2 className="font-bold text-slate-900">Deployment readiness</h2>
                    <div className="mt-4 space-y-3 text-sm">
                      <Status label="Email delivery" ok={overview.integrations.email.configured} detail={overview.integrations.email.details} />
                      <Status label="AI enhancement" ok={overview.integrations.llm.enabled} detail={overview.integrations.llm.provider} />
                      <Status label="Adzuna market data" ok={overview.integrations.adzuna} detail={overview.integrations.adzuna ? "Configured" : "Optional key not configured"} />
                      <Status label="Database & sessions" ok detail="PostgreSQL operational" />
                    </div>
                  </section>
                </div>
              </div>
            )}

            {tab === "users" && (
              <section className="card overflow-hidden p-0">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="font-bold text-slate-900">User accounts</h2>
                  <p className="text-xs text-slate-500">Suspend or restore customer access. Password data is never exposed.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Target</th>
                        <th className="px-4 py-3">Last login</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {overview.users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </td>
                          <td className="px-4 py-3"><span className={`badge ${user.role === "admin" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-700"}`}>{user.role}</span></td>
                          <td className="px-4 py-3 text-slate-600">{user.targetRole || "Not set"}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</td>
                          <td className="px-4 py-3"><span className={`badge ${user.active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{user.active ? "Active" : "Suspended"}</span></td>
                          <td className="px-4 py-3">
                            {user.role === "admin" ? (
                              <span className="text-xs text-slate-400">Protected</span>
                            ) : (
                              <button onClick={() => toggleUser(user.id, !user.active)} className={`text-xs font-bold ${user.active ? "text-rose-600" : "text-emerald-600"}`}>
                                {user.active ? "Suspend" : "Reactivate"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {tab === "feedback" && (
              <section className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-900">What customers say is missing</h2>
                    <p className="text-xs text-slate-500">Use this feedback to prioritize the next release.</p>
                  </div>
                  <span className="badge bg-amber-100 text-amber-800">
                    {overview.feedback.length
                      ? `${(overview.feedback.reduce((sum, item) => sum + item.rating, 0) / overview.feedback.length).toFixed(1)} ★`
                      : "No ratings"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {overview.feedback.map((item) => (
                    <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.userName}</p>
                          <p className="text-[11px] text-slate-500">{item.userRole}</p>
                        </div>
                        <span className="text-sm font-bold text-amber-500">{"★".repeat(item.rating)}</span>
                      </div>
                      <p className="mt-3 text-xs font-semibold text-indigo-700">Favorite: {item.favoriteFeature}</p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-700"><strong>Requested:</strong> {item.whatLacking}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {tab === "security" && (
              <div className="grid gap-5 lg:grid-cols-2">
                <section className="card">
                  <h2 className="font-bold text-slate-900">Change administrator password</h2>
                  <p className="mt-1 text-xs text-slate-500">Use at least 12 characters. All sessions will be revoked after the change.</p>
                  <form onSubmit={changeAdminPassword} className="mt-4 space-y-3">
                    <input type="password" required className="input" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    <input type="password" required minLength={12} className="input" placeholder="New password (12+ characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <input type="password" required minLength={12} className="input" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    {passwordMessage && <p className="text-xs font-semibold text-rose-600">{passwordMessage}</p>}
                    <button type="submit" className="btn-primary">Change password & sign out</button>
                  </form>
                </section>

                <section className="card">
                  <h2 className="font-bold text-slate-900">Security posture</h2>
                  <ul className="mt-4 space-y-3 text-sm text-slate-700">
                    <li>✓ HttpOnly, SameSite session cookies</li>
                    <li>✓ 120,000-round PBKDF2-SHA512 password hashing</li>
                    <li>✓ Timing-safe password verification</li>
                    <li>✓ Server-side role authorization on every admin API request</li>
                    <li>✓ Session revocation after password changes and account suspension</li>
                    <li>✓ No credential values exposed through admin APIs</li>
                  </ul>
                </section>
              </div>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
      <p className="text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function Activity({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-600">{label}</span><strong className="text-slate-900">{value}</strong></div>;
}

function Status({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <div><p className="font-medium text-slate-800">{label}</p><p className="text-xs text-slate-500">{detail}</p></div>
      <span className={`badge ${ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{ok ? "Ready" : "Setup needed"}</span>
    </div>
  );
}
