"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AlexReply } from "@/lib/agents/types";

type Msg = { id: number; role: "user" | "alex"; text: string; actions?: AlexReply["actions"]; data?: Record<string, unknown> };

const OPENERS = [
  "Which roles can I actually get?",
  "What does the market pay for my role?",
  "Find me live jobs",
  "Why am I not hearing back?",
];

export default function Alex() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const counter = useRef(0);
  const router = useRouter();
  const pathname = usePathname();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  function push(role: Msg["role"], text: string, actions?: Msg["actions"], data?: Msg["data"]) {
    counter.current += 1;
    setMsgs((m) => [...m, { id: counter.current, role, text, actions, data }].slice(-40));
  }

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || busy) return;
    setInput("");
    push("user", msg);
    setBusy(true);
    try {
      const res = await fetch("/api/alex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data: AlexReply & { error?: string } = await res.json();
      if (!res.ok || data.error) push("alex", data.error ?? "Something went wrong. Try again.");
      else push("alex", data.reply, data.actions, data.data);
    } catch {
      push("alex", "Network issue reaching Alex. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  function doAction(a: AlexReply["actions"][number]) {
    setOpen(false);
    if (a.tab) sessionStorage.setItem("autoapply:dashboard-tab", a.tab);
    if (a.type === "search") {
      sessionStorage.setItem("autoapply:job-query", a.query ?? "");
      sessionStorage.setItem("autoapply:dashboard-tab", "jobs");
    }
    if (a.type === "autopilot") sessionStorage.setItem("autoapply:dashboard-tab", "overview");
    router.push("/dashboard");
  }

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open Alex"
        className={`fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_12px_32px_rgba(79,70,229,0.4)] transition hover:scale-105 print:hidden ${open ? "rotate-45" : ""}`}
      >
        {open ? (
          <span className="text-xl font-bold">×</span>
        ) : (
          <span className="relative flex h-7 w-7 items-center justify-center">
            <span className="absolute h-full w-full rounded-full bg-white/20" />
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M12 2a5 5 0 015 5c0 2.5-1.6 4-3 5l-1.2 1.2A4.5 4.5 0 0012 11V6a5 5 0 00-5-5h5z" fill="currentColor" stroke="none" opacity=".95"/>
              <path d="M6 9.5C6 6 9 3.75 12 3.75S18 6 18 9.5c0 3.2-2.4 5-4.2 6.7-.8.7-1.3 1.6-1.3 2.6V21H12" />
            </svg>
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[520px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.28)] print:hidden">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-sm font-black">A</span>
              <div>
                <p className="text-sm font-bold">Alex</p>
                <p className="text-[11px] text-indigo-100">Your AI job consultant · online</p>
              </div>
            </div>
          </div>

          <div ref={boxRef} className="flex-1 space-y-3 overflow-y-auto p-3">
            {msgs.length === 0 && (
              <div className="pt-2">
                <div className="rounded-2xl rounded-tl-sm bg-slate-100 p-3 text-xs text-slate-700">
                  I&apos;m Alex. Ask me to recommend roles, research real salaries, find live openings, tailor a resume,
                  or tell you exactly why the pipeline is stuck.
                </div>
                <p className="mt-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Try asking</p>
                <div className="mt-2 space-y-1.5">
                  {OPENERS.map((o) => (
                    <button key={o} onClick={() => send(o)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50">
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "rounded-br-sm bg-indigo-600 text-white" : "rounded-tl-sm bg-slate-100 text-slate-800"}`}>
                  {m.text}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.actions.map((a, i) => (
                        <button key={i} onClick={() => doAction(a)} className="rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-indigo-700">
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2 text-xs text-slate-500">
                  Alex is thinking…
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-slate-200 p-2"
          >
            <div className="flex gap-1.5">
              <input
                className="input flex-1 py-2 text-xs"
                placeholder={pathname.includes("/dashboard") ? "Ask about this page or your search…" : "Ask Alex…"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" disabled={busy || !input.trim()} className="btn-primary px-3.5 py-2 text-xs">
                →
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
