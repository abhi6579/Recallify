"use client";

import type { TraceStep } from "@/lib/agents/types";

const STATUS: Record<TraceStep["status"], string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  skip: "bg-slate-300",
};

export default function AgentTrace({ trace }: { trace: TraceStep[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-950 p-4 text-slate-100">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Agent execution trace</p>
      <ol className="relative space-y-2 border-l border-slate-700 pl-4">
        {trace.map((s, i) => (
          <li key={i} className="relative">
            <span className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-slate-950 ${STATUS[s.status]}`} />
            <div className="flex flex-wrap items-baseline gap-x-2">
              <code className="text-xs font-bold text-indigo-300">{s.node}</code>
              <span className="text-[10px] text-slate-500">+{s.atMs}ms</span>
            </div>
            <p className="text-xs text-slate-300">{s.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
