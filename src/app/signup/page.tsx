"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CAREER_FIELDS } from "@/lib/agents/careerFields";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [careerField, setCareerField] = useState(CAREER_FIELDS[0].key);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, targetRole, careerField }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Signup failed.");
      }

      if (data.user) {
        window.localStorage.removeItem("autoapply:profile-cache");
        window.localStorage.setItem("autoapply_user", JSON.stringify(data.user));
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[85vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md card shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-black text-white shadow-sm">A</span>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Auto<span className="text-indigo-600">Apply</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">Create Your Workspace</h1>
          <p className="text-xs text-slate-500">Your private, single workspace for role matching, resumes &amp; mock interviews</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              className="input text-sm"
              placeholder="e.g. Abhinav Mishra"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              className="input text-sm"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="input text-sm"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Role</label>
              <input
                type="text"
                className="input text-xs"
                placeholder="e.g. AI Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Career Field</label>
              <select
                className="input text-xs"
                value={careerField}
                onChange={(e) => setCareerField(e.target.value)}
              >
                {CAREER_FIELDS.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-semibold">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm font-bold"
          >
            {loading ? "Creating Account…" : "Create Workspace & Start Free →"}
          </button>
        </form>

        <div className="border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-indigo-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
