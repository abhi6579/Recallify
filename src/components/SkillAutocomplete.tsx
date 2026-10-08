"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SkillEntry } from "@/lib/agents/skillCatalog";

/**
 * LinkedIn-style skill picker: suggestions appear as you type letter by
 * letter, ranked to the candidate's own career field. If a skill is not in
 * the catalogue, the user can still add it as free text.
 */
export default function SkillAutocomplete({
  selected,
  fields,
  onAdd,
  placeholder = "Type a skill, e.g. Pharmacology",
}: {
  selected: string[];
  fields: string[];
  onAdd: (skill: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SkillEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const exactExists = useMemo(
    () =>
      suggestions.some((s) => s.key === trimmed.toLowerCase()) ||
      selected.some((s) => s.toLowerCase() === trimmed.toLowerCase()),
    [suggestions, selected, trimmed],
  );
  const canCreate = trimmed.length >= 2 && !exactExists;
  const optionCount = suggestions.length + (canCreate ? 1 : 0);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: query,
          fields: fields.join(","),
          exclude: selected.join(","),
          limit: "8",
        });
        const res = await fetch(`/api/skills/suggest?${params}`);
        const data = await res.json();
        if (!cancelled) {
          setSuggestions(data.suggestions ?? []);
          setActive(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 140);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, fields, selected]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function commit(value: string) {
    const clean = value.trim();
    if (!clean) return;
    if (!selected.some((s) => s.toLowerCase() === clean.toLowerCase())) onAdd(clean);
    setQuery("");
    setOpen(false);
    setActive(0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % Math.max(optionCount, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + Math.max(optionCount, 1)) % Math.max(optionCount, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active < suggestions.length) commit(suggestions[active].value);
      else if (canCreate) commit(trimmed);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function highlight(text: string) {
    if (!trimmed) return text;
    const idx = text.toLowerCase().indexOf(trimmed.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-indigo-100 font-bold text-indigo-800">{text.slice(idx, idx + trimmed.length)}</mark>
        {text.slice(idx + trimmed.length)}
      </>
    );
  }

  return (
    <div ref={boxRef} className="relative max-w-xl">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input
          className="input pl-9"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">…</span>}
      </div>

      {open && (suggestions.length > 0 || canCreate) && (
        <ul
          role="listbox"
          className="absolute z-40 mt-1.5 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-[0_16px_40px_rgba(15,23,42,0.14)]"
        >
          {!trimmed && (
            <li className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Suggested for your field
            </li>
          )}
          {suggestions.map((s, i) => (
            <li key={s.key}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(s.value)}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${
                  i === active ? "bg-indigo-50 text-indigo-900" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="font-medium">{highlight(s.value)}</span>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {s.categories[0] ?? ""}
                </span>
              </button>
            </li>
          ))}
          {canCreate && (
            <li className="border-t border-slate-100">
              <button
                type="button"
                role="option"
                aria-selected={active === suggestions.length}
                onMouseEnter={() => setActive(suggestions.length)}
                onClick={() => commit(trimmed)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                  active === suggestions.length ? "bg-indigo-50 text-indigo-900" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="grid h-5 w-5 place-items-center rounded bg-indigo-600 text-xs font-bold text-white">+</span>
                Add <span className="font-bold">&ldquo;{trimmed}&rdquo;</span>
                <span className="ml-auto text-[10px] uppercase tracking-wide text-slate-400">Custom skill</span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
