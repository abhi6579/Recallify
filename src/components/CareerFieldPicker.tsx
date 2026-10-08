"use client";

import Image from "next/image";
import { CAREER_FIELDS, roleCountForField } from "@/lib/agents/careerFields";

export default function CareerFieldPicker({
  selected,
  onChange,
  max = 3,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  function toggle(key: string) {
    if (selected.includes(key)) onChange(selected.filter((k) => k !== key));
    else if (selected.length < max) onChange([...selected, key]);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CAREER_FIELDS.map((field) => {
        const active = selected.includes(field.key);
        const disabled = !active && selected.length >= max;
        return (
          <button
            key={field.key}
            type="button"
            onClick={() => toggle(field.key)}
            disabled={disabled}
            aria-pressed={active}
            className={`group overflow-hidden rounded-2xl border-2 text-left transition ${
              active
                ? "border-indigo-600 shadow-[0_12px_32px_rgba(79,70,229,0.22)]"
                : disabled
                  ? "cursor-not-allowed border-slate-200 opacity-45"
                  : "border-slate-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
            }`}
          >
            <div className="relative h-32 w-full overflow-hidden bg-slate-100">
              <Image
                src={field.image}
                alt={field.imageAlt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`object-cover transition duration-500 ${active ? "scale-105" : "group-hover:scale-105"}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />
              <p className="absolute bottom-2 left-3 right-10 text-sm font-bold leading-tight text-white drop-shadow">
                {field.label}
              </p>
              <span
                className={`absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full border-2 text-xs font-bold transition ${
                  active
                    ? "border-white bg-indigo-600 text-white"
                    : "border-white/70 bg-white/25 text-transparent backdrop-blur-sm"
                }`}
              >
                ✓
              </span>
            </div>
            <div className={`p-3.5 ${active ? "bg-indigo-50" : "bg-white"}`}>
              <p className="text-xs leading-relaxed text-slate-600">{field.blurb}</p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-indigo-600">
                {roleCountForField(field.key)} roles available
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
