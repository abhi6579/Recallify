"use client";

import { useState } from "react";
import type { AuthUser } from "@/lib/agents/types";
import { CAREER_FIELDS } from "@/lib/agents/careerFields";

export default function AuthModal({
  initialMode = "login",
  onSuccess,
  onClose,
}: {
  initialMode?: "login" | "signup";
  onSuccess: (user: AuthUser) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [careerField, setCareerField] = useState(CAREER_FIELDS[0].key);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload =
        mode === "signup"
          ? { name, email, password, targetRole, careerField }
          : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      // The session stays in an HttpOnly cookie; only non-sensitive display
      // data is cached client-side for a fast header refresh.
      if (data.user) {
        window.localStorage.removeItem("autoapply:profile-cache");
        window.localStorage.setItem("autoapply_user", JSON.stringify(data.user));
        onSuccess(data.user);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-rise">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-black text-white">A</span>
              <h3 className="font-bold text-slate-900 text-base">
                {mode === "login" ? "Log In to AutoApply" : "Create Your AutoApply Account"}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === "login"
                ? "Access your personal workspace, applications & profile"
                : "Your own dedicated AI career consultant workspace"}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-lg">×</button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-100 p-1 m-4 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              mode === "login" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              mode === "signup" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  className="input text-xs"
                  required
                  placeholder="e.g. Abhinav Mishra or Dr. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                className="input text-xs"
                required
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                className="input text-xs"
                required
                type="password"
                placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {mode === "signup" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Job Title</label>
                    <input
                      className="input text-xs"
                      placeholder="e.g. Clinical Trial Manager, AI Engineer"
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
              </>
            )}

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-semibold">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-xs font-bold mt-2"
            >
              {loading
                ? "Verifying…"
                : mode === "login"
                ? "Log In to My Workspace →"
                : "Create Account & Start Free →"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              {mode === "login" ? "Don't have an account yet?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError(null);
                }}
                className="font-bold text-indigo-600 hover:underline"
              >
                {mode === "login" ? "Sign up free" : "Log in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
