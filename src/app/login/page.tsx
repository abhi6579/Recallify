"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
      }

      if (data.user) {
        window.localStorage.removeItem("autoapply:profile-cache");
        window.localStorage.setItem("autoapply_user", JSON.stringify(data.user));
      }

      const requested = new URLSearchParams(window.location.search).get("next");
      const destination = data.user?.role === "admin"
        ? requested === "/admin" || !requested ? "/admin" : requested
        : "/dashboard";
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md card shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-black text-white shadow-sm">A</span>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Auto<span className="text-indigo-600">Apply</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">Welcome Back</h1>
          <p className="text-xs text-slate-500">Access your personal AI career consultant workspace</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
            {loading ? "Logging in…" : "Log In to Workspace →"}
          </button>
        </form>

        <div className="border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-500">
            Don&apos;t have an account yet?{" "}
            <Link href="/signup" className="font-bold text-indigo-600 hover:underline">
              Create free account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
