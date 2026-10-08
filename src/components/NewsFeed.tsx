"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { NewsArticle, SavedArticle } from "@/lib/agents/types";
import { TOPICS } from "@/lib/news";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "";
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

export default function NewsFeed() {
  const [topic, setTopic] = useState(TOPICS[0].key);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [saved, setSaved] = useState<SavedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [showSaved, setShowSaved] = useState(false);

  const loadSaved = useCallback(async () => {
    const res = await fetch("/api/saved");
    const data = await res.json();
    setSaved(data.saved ?? []);
  }, []);

  const loadNews = useCallback(async (key: string, refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/news?topic=${key}${refresh ? "&refresh=1" : ""}`);
      const data = await res.json();
      setArticles(data.articles ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNews(topic);
  }, [topic, loadNews]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const savedIds = useMemo(() => new Set(saved.map((s) => s.id)), [saved]);

  async function toggleSave(article: NewsArticle) {
    const existing = saved.find((s) => s.id === article.id);
    if (existing) {
      setSaved((prev) => prev.filter((s) => s.id !== article.id));
      await fetch(`/api/saved/${existing.savedId}`, { method: "DELETE" });
    } else {
      await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(article),
      });
    }
    await loadSaved();
  }

  const list: NewsArticle[] = showSaved ? saved : articles;
  const filtered = query.trim()
    ? list.filter((a) => `${a.title} ${a.source} ${a.summary}`.toLowerCase().includes(query.toLowerCase()))
    : list;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-slate-300 bg-white p-1">
          <button
            onClick={() => setShowSaved(false)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${!showSaved ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Latest
          </button>
          <button
            onClick={() => setShowSaved(true)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${showSaved ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Saved ({saved.length})
          </button>
        </div>
        <input
          className="input max-w-xs flex-1"
          placeholder="Search headlines…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {!showSaved && (
          <button onClick={() => loadNews(topic, true)} disabled={refreshing} className="btn-secondary">
            {refreshing ? "Refreshing…" : "↻ Refresh"}
          </button>
        )}
      </div>

      {/* Topics */}
      {!showSaved && (
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTopic(t.key)}
              title={t.blurb}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                topic === t.key
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
              }`}
            >
              <span className="mr-1.5">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading && !showSaved ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-full rounded bg-slate-200" />
              <div className="mt-2 h-4 w-3/4 rounded bg-slate-200" />
              <div className="mt-4 h-3 w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center">
          <p className="text-3xl">{showSaved ? "🔖" : "📭"}</p>
          <p className="mt-3 font-semibold text-slate-900">
            {showSaved ? "Nothing saved yet" : "No stories found"}
          </p>
          <p className="prose-muted mt-1 text-sm">
            {showSaved
              ? "Tap Save on any update to keep it here for later."
              : "Try another topic or refresh the feed."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((a) => {
            const isSaved = savedIds.has(a.id);
            return (
              <article key={a.id} className="card card-hover flex flex-col">
                <div className="flex items-center gap-2 text-xs">
                  <span className="badge bg-indigo-50 text-indigo-700">{a.source || "News"}</span>
                  {a.publishedAt && <span className="text-slate-500">{timeAgo(a.publishedAt)}</span>}
                </div>
                <h3 className="mt-3 font-bold leading-snug text-slate-900">{a.title}</h3>
                {a.summary && <p className="prose-muted mt-2 line-clamp-3 flex-1 text-sm">{a.summary}</p>}
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                  <a href={a.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-600 hover:underline">
                    Read ↗
                  </a>
                  <button
                    onClick={() => toggleSave(a)}
                    className={`ml-auto rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      isSaved ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {isSaved ? "✓ Saved" : "🔖 Save"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
