"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthModal from "./AuthModal";
import CustomerFeedbackModal from "./CustomerFeedbackModal";
import type { AuthUser } from "@/lib/agents/types";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/onboarding", label: "Get started" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/style", label: "Style Mirror" },
  { href: "/news", label: "Updates" },
  { href: "/about", label: "About us" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    // Check local storage & fetch /api/auth/me
    const stored = window.localStorage.getItem("autoapply_user");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {}
    }

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setCurrentUser(d.user);
          window.localStorage.setItem("autoapply_user", JSON.stringify(d.user));
        } else {
          setCurrentUser(null);
          window.localStorage.removeItem("autoapply_user");
          window.localStorage.removeItem("autoapply_token");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      for (const item of NAV) {
        if (item.href !== pathname) router.prefetch(item.href);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [pathname, router]);

  async function handleLogout() {
    setUserMenuOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.localStorage.removeItem("autoapply_token");
    window.localStorage.removeItem("autoapply_user");
    window.localStorage.removeItem("autoapply:profile-cache");
    setCurrentUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-lg print:hidden">
      <div className="section flex h-16 items-center justify-between gap-4">
        <Link href="/" prefetch className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-base font-black text-white shadow-sm">A</span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Auto<span className="text-indigo-600">Apply</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            title="Submit candidate feedback & feature suggestions"
          >
            💬 Feedback
          </button>

          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-28 truncate">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400">▾</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 text-xs animate-rise">
                  <div className="p-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    {currentUser.targetRole && (
                      <span className="badge bg-indigo-50 text-indigo-700 mt-1.5 text-[10px]">
                        🎯 {currentUser.targetRole}
                      </span>
                    )}
                  </div>

                  <div className="py-1">
                    {currentUser.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg bg-violet-50 px-2.5 py-1.5 font-bold text-violet-700 hover:bg-violet-100"
                      >
                        Admin Control Room
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 w-full px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
                    >
                      📊 My Dashboard Workspace
                    </Link>
                    <Link
                      href="/onboarding"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 w-full px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
                    >
                      ⚙️ Reconfigure Domain / Skills
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-bold"
                    >
                      🚪 Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }}
                className="btn-ghost text-xs px-3 py-1.5 font-bold"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setAuthMode("signup");
                  setShowAuthModal(true);
                }}
                className="btn-primary text-xs px-3 py-1.5 font-bold"
              >
                Sign Up Free
              </button>
            </div>
          )}

          <Link href="/dashboard" prefetch className="hidden btn-primary sm:inline-flex text-xs">
            Open dashboard
          </Link>
          <button
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-300 text-slate-700 md:hidden"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <nav className="section flex flex-col py-2">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} prefetch onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          initialMode={authMode}
          onSuccess={(user) => {
            setCurrentUser(user);
            router.push(user.role === "admin" ? "/admin" : "/dashboard");
            router.refresh();
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {showFeedbackModal && (
        <CustomerFeedbackModal
          profile={null}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
    </header>
  );
}
