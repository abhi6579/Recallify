"use client";

import { useEffect, useState } from "react";
import type {
  PiiSanitizationReport,
  StyleProfile,
  StyleRewriteKind,
} from "@/lib/agents/types";

type StyleResponse = {
  profile: StyleProfile;
  piiReport: PiiSanitizationReport;
  persisted: boolean;
  authenticated: boolean;
  provider: string;
  updatedAt: string;
  privacy: {
    rawSamplesStored: false;
    externalModelReceivedRawSamples: false;
    storedArtifact: string;
  };
};

const SAMPLE_LABELS = [
  ["A professional message", "Paste an email, cover note, or message you wrote naturally."],
  ["A longer explanation", "Paste a paragraph where you explained a project, decision, or idea."],
  ["A casual but work-safe sample", "Paste a LinkedIn post, update, or message that sounds distinctly like you."],
] as const;

const KIND_LABELS: { value: StyleRewriteKind; label: string }[] = [
  { value: "summary", label: "Resume summary" },
  { value: "cover_letter", label: "Cover letter" },
  { value: "recruiter_message", label: "Recruiter message" },
  { value: "follow_up", label: "Follow-up email" },
  { value: "freeform", label: "Other professional text" },
];

export default function StyleMirrorTab() {
  const [samples, setSamples] = useState(["", "", ""]);
  const [result, setResult] = useState<StyleResponse | null>(null);
  const [style, setStyle] = useState<StyleProfile | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<StyleRewriteKind>("cover_letter");
  const [draft, setDraft] = useState(
    "I am writing to express my strong interest in this position. I believe that my experience and skills make me a strong candidate, and I would welcome the opportunity to discuss the role further.",
  );
  const [rewritten, setRewritten] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [rewriteMeta, setRewriteMeta] = useState<{ provider: string; modelUsed: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/style")
      .then((response) => response.json())
      .then((data) => {
        setAuthenticated(Boolean(data.authenticated));
        if (data.profile) {
          setStyle(data.profile);
          window.sessionStorage.setItem("autoapply:style-profile", JSON.stringify(data.profile));
          setResult({
            profile: data.profile,
            piiReport: {
              totalDetected: Object.values(data.piiSummary ?? {}).reduce(
                (sum: number, count) => sum + Number(count),
                0,
              ),
              byType: data.piiSummary ?? {},
              processingMs: 0,
              rawStored: false,
            },
            persisted: true,
            authenticated: true,
            provider: data.provider,
            updatedAt: data.updatedAt,
            privacy: {
              rawSamplesStored: false,
              externalModelReceivedRawSamples: false,
              storedArtifact: "AES-256-GCM encrypted style fingerprint",
            },
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  function updateSample(index: number, value: string) {
    setSamples((current) => current.map((sample, i) => (i === index ? value : sample)));
  }

  async function analyze() {
    setAnalyzing(true);
    setError(null);
    setRewritten("");
    try {
      const response = await fetch("/api/style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ samples }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Style analysis failed.");
      setResult(data);
      setStyle(data.profile);
      window.sessionStorage.setItem("autoapply:style-profile", JSON.stringify(data.profile));
      setAuthenticated(Boolean(data.authenticated));
      // Raw samples are deliberately cleared as soon as analysis completes.
      setSamples(["", "", ""]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Style analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function rewrite() {
    if (!style || draft.trim().length < 20) return;
    setRewriting(true);
    setError(null);
    try {
      const response = await fetch("/api/style/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft, kind, style: authenticated ? undefined : style }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Rewrite failed.");
      setRewritten(data.text);
      setRewriteMeta({ provider: data.provider, modelUsed: data.modelUsed });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Rewrite failed.");
    } finally {
      setRewriting(false);
    }
  }

  async function deleteProfile() {
    const response = await fetch("/api/style", { method: "DELETE" });
    if (!response.ok) return;
    setStyle(null);
    setResult(null);
    setRewritten("");
    window.sessionStorage.removeItem("autoapply:style-profile");
  }

  const validSampleCount = samples.filter((sample) => sample.trim().length >= 60).length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-xl">
        <div className="grid gap-6 px-6 py-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Style Mirror</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Stop sounding like AI. Start sounding like you.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Teach AutoApply your rhythm, tone, and word choices once. It mirrors that voice across application writing—without fine-tuning and without storing your raw examples.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <TrustItem label="Raw samples" value="Never stored" />
            <TrustItem label="Before model" value="PII removed" />
            <TrustItem label="At rest" value="AES-256" />
          </div>
        </div>
      </section>

      {loadingProfile ? (
        <div className="card animate-pulse text-sm text-slate-500">Checking for your encrypted style profile…</div>
      ) : !style ? (
        <section className="card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">Create your voice fingerprint</h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Use writing you created yourself. Two samples are required; three gives a better signal. Remove client secrets before pasting even though the privacy gateway will redact high-risk PII.
              </p>
            </div>
            <span className={`badge ${authenticated ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {authenticated ? "Encrypted save enabled" : "Guest mode · ephemeral"}
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {SAMPLE_LABELS.map(([label, hint], index) => (
              <label key={label} className="block">
                <span className="text-xs font-bold text-slate-800">{index + 1}. {label}</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">{hint}</span>
                <textarea
                  value={samples[index]}
                  onChange={(event) => updateSample(index, event.target.value)}
                  className="input mt-2 min-h-44 text-sm leading-relaxed"
                  placeholder="Paste your writing here…"
                />
                <span className={`mt-1 block text-[10px] ${samples[index].length >= 60 ? "text-emerald-600" : "text-slate-400"}`}>
                  {samples[index].length} characters {samples[index].length >= 60 ? "· ready" : "· 60 minimum"}
                </span>
              </label>
            ))}
          </div>

          {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">{validSampleCount}/2 required samples ready</p>
            <button onClick={analyze} disabled={analyzing || validSampleCount < 2} className="btn-primary">
              {analyzing ? "Sanitizing & analyzing…" : "Create my Style Mirror"}
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StyleMetric label="Voice" value={style.tone.join(" · ")} />
            <StyleMetric label="Sentence rhythm" value={`${style.sentenceLength} · ${style.averageWordsPerSentence} words avg`} />
            <StyleMetric label="Formality" value={`${style.formality} · ${style.contractions} contractions`} />
            <StyleMetric label="Structure" value={`${style.directness} · ${style.paragraphLength} paragraphs`} />
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Your voice fingerprint</p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">{style.voiceSignature}</h3>
                </div>
                <button onClick={deleteProfile} className="text-xs font-bold text-rose-600 hover:underline">
                  Delete fingerprint
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Do this</p>
                  <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-700">
                    {style.dos.map((item) => <li key={item}>✓ {item}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-rose-800">Avoid this</p>
                  <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-700">
                    {style.donts.map((item) => <li key={item}>× {item}</li>)}
                  </ul>
                </div>
              </div>

              {(style.preferredPhrases.length > 0 || style.transitionWords.length > 0) && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Language patterns</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[...style.preferredPhrases, ...style.transitionWords].map((phrase) => (
                      <span key={phrase} className="badge bg-white text-slate-700">{phrase}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <p className="eyebrow">Privacy receipt</p>
              <div className="mt-3 space-y-3 text-sm">
                <ReceiptRow label="Raw writing samples stored" value="No" ok />
                <ReceiptRow label="Raw samples sent to a model" value="No" ok />
                <ReceiptRow label="Fingerprint encrypted at rest" value={result?.persisted ? "Yes · AES-256-GCM" : "Not stored (guest)"} ok />
                <ReceiptRow label="PII entities removed" value={String(result?.piiReport.totalDetected ?? 0)} ok />
                <ReceiptRow label="Rewrite provider" value={result?.provider ?? "deterministic"} ok />
              </div>
              {result && Object.keys(result.piiReport.byType).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                  {Object.entries(result.piiReport.byType).map(([type, count]) => (
                    <span key={type} className="badge bg-slate-100 text-slate-700">{type}: {count}</span>
                  ))}
                </div>
              )}
              <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                The privacy receipt stores counts only—not detected values. Reversible redaction maps are discarded after processing.
              </p>
            </div>
          </section>

          <section className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Try the mirror</p>
                <h3 className="mt-1 font-bold text-slate-900">Rewrite professional text in your voice</h3>
              </div>
              {rewriteMeta && (
                <span className="badge bg-violet-100 text-violet-700">
                  {rewriteMeta.modelUsed ? `${rewriteMeta.provider} open-weight model` : "Deterministic fallback"}
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-600">
                  Output type
                  <select value={kind} onChange={(event) => setKind(event.target.value as StyleRewriteKind)} className="input mt-1">
                    {KIND_LABELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <textarea value={draft} onChange={(event) => setDraft(event.target.value)} className="input mt-3 min-h-52 text-sm leading-relaxed" />
                <button onClick={rewrite} disabled={rewriting || draft.trim().length < 20} className="btn-primary mt-3">
                  {rewriting ? "Mirroring your style…" : "Rewrite in my voice"}
                </button>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600">Style-matched result</p>
                <div className="mt-1 min-h-52 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
                  {rewritten || "Your rewritten text will appear here. Facts and numeric claims are preserved."}
                </div>
                {rewritten && (
                  <button onClick={() => navigator.clipboard.writeText(rewritten)} className="btn-secondary mt-3 text-xs">Copy result</button>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function TrustItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[9px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 font-bold text-emerald-300">{value}</p>
    </div>
  );
}

function StyleMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold capitalize text-slate-900">{value}</p>
    </div>
  );
}

function ReceiptRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-slate-600">{label}</span>
      <span className={`text-xs font-bold ${ok ? "text-emerald-700" : "text-slate-700"}`}>{value}</span>
    </div>
  );
}
