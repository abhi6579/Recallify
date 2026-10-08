import Link from "next/link";
import Image from "next/image";
import { ROLE_CATEGORIES, ROLE_LIBRARY } from "@/lib/agents/roleLibrary";
import { CAREER_FIELDS } from "@/lib/agents/careerFields";
import { DEFAULT_PROFILE } from "@/lib/agents/defaultProfile";
import { SAMPLE_JDS } from "@/lib/agents/sampleJds";
import { runResumeAgent } from "@/lib/agents/resumeAgent";

export const metadata = {
  title: "AutoApply — Find the right job, apply with evidence",
};

const AGENTS = [
  {
    icon: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12zm0 4a2 2 0 100 4 2 2 0 000-4z",
    name: "Role Recommender",
    line: "Tells you which jobs you can realistically get right now",
    points: ["Matches your evidence to 170+ roles", "Shows exact missing skills", "Gives a learning roadmap for each gap"],
  },
  {
    icon: "M6 2h7l5 5v15a0 0 0 010 0H6a2 2 0 01-2-2V4a2 2 0 012-2zm7 1.5V8h4.5M8 13h8M8 17h5",
    name: "Resume Agent",
    line: "Writes a tailored resume, cover letter and interview brief",
    points: ["ATS keyword scoring", "Fact-checks every claim", "Revises itself until it passes"],
  },
  {
    icon: "M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3zm-1 13l6-6-1.4-1.4L11 12.2 8.4 9.6 7 11l4 4z",
    name: "Job Intelligence",
    line: "Decides whether a listing actually deserves your time",
    points: ["Ghost-job and scam detection", "Salary transparency check", "Apply / verify / upskill verdict"],
  },
  {
    icon: "M3 5h18v14H3V5zm0 0l9 7 9-7",
    name: "Follow-up Agent",
    line: "Makes sure silence never ends your application",
    points: ["Schedules polite reminders", "Tracks your pipeline stages", "Stops the moment they reply"],
  },
];

const STEPS = [
  { n: "01", t: "Tell us your field", d: "Choose your career field first — pharmacy, management, healthcare, trades — so you only ever see roles you can actually apply for." },
  { n: "02", t: "Add your skills", d: "Type and pick from suggestions ranked for your field, or add your own. Then get ranked roles with match scores and salary bands." },
  { n: "03", t: "Apply with evidence", d: "Paste a job description and receive a tailored resume, cover letter, interview prep and a trust verdict." },
  { n: "04", t: "Track and follow up", d: "Log the application, move it through your pipeline, and let the agent send reminders on schedule." },
];

export default async function HomePage() {
  const roleCount = ROLE_LIBRARY.length;
  const categoryCount = ROLE_CATEGORIES.length;

  // The hero preview runs the real Resume Agent against a real sample job
  // description. Nothing here is hardcoded — if the agent changes, these
  // numbers change with it. Showing invented metrics would contradict the
  // honesty policy the product is built on.
  const demoJd = SAMPLE_JDS[0];
  const demo = await runResumeAgent(
    DEFAULT_PROFILE,
    demoJd.text,
    demoJd.company,
    demoJd.role,
    2,
    { source: "Company careers page", postedDate: new Date().toISOString().slice(0, 10), salaryText: "Disclosed in posting", workMode: "hybrid" },
  );
  const grounded = demo.matchedEvidence.filter((e) => e.score > 0).length;
  const demoTrace = demo.trace.filter((t) =>
    ["parse_jd", "match_evidence", "check_facts", "job_quality_gate"].includes(t.node),
  );

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-grid opacity-70" />
        <div className="absolute -left-32 top-[-10rem] h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute -right-24 top-20 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="section relative grid gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div className="animate-rise">
            <span className="badge border border-indigo-200 bg-indigo-50 text-indigo-700">
              For every industry · {roleCount} roles · {categoryCount} sectors
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Stop guessing.
              <br />
              Apply where you <span className="text-gradient">actually stand a chance</span>.
            </h1>
            <p className="prose-muted mt-6 max-w-xl text-base">
              AutoApply is an evidence-first job search assistant. It finds roles that match your real background,
              writes truthful applications that pass screening, warns you about ghost jobs and scams, and follows up
              so employers never quietly forget you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/onboarding" className="btn-primary px-6 py-3 text-base">Start free — pick your field</Link>
              <Link href="/news" className="btn-secondary px-6 py-3 text-base">See what&apos;s new in tech &amp; AI</Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              No credit card. No fees, ever — a real employer never asks you to pay.
            </p>
          </div>

          <div className="animate-rise lg:pl-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">Live agent run</p>
                  <p className="text-[11px] text-slate-500">{demoJd.role} @ {demoJd.company}</p>
                </div>
                <span className={`badge ${demo.jobIntelligence.recommendation === "apply_now" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {demo.jobIntelligence.recommendation.replaceAll("_", " ")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 py-4">
                <Stat label="Apply priority" value={`${demo.jobIntelligence.applicationPriority}/100`} />
                <Stat label="Listing trust" value={`${demo.jobIntelligence.trustScore}/100`} />
                <Stat label="ATS score" value={`${Math.round(demo.atsScore * 100)}%`} />
                <Stat label="Claims verified" value={`${Math.round(demo.factualScore * 100)}%`} />
              </div>
              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                {demo.jobIntelligence.positiveSignals.slice(0, 2).map((sig) => (
                  <p key={sig} className="flex gap-2 text-slate-700">
                    <span className="font-bold text-emerald-600">✓</span> {sig}
                  </p>
                ))}
                {demo.atsMissingKeywords.slice(0, 1).map((gap) => (
                  <p key={gap} className="flex gap-2 text-slate-700">
                    <span className="font-bold text-amber-600">⚠</span> {gap} not found in the profile&apos;s evidence
                  </p>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-slate-950 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Agent trace</p>
                  <p className="text-[10px] text-slate-500">{demo.trace.length} nodes · {demo.revisionCount} revision(s)</p>
                </div>
                <div className="mt-2 space-y-1 font-mono text-[10px] text-slate-300">
                  <p><span className="text-indigo-300">parse_jd</span> → {demo.jdRequirements.length} requirements</p>
                  <p><span className="text-indigo-300">match_evidence</span> → {grounded}/{demo.jdRequirements.length} grounded</p>
                  <p><span className="text-indigo-300">check_facts</span> → {demo.factualIssues.length} unsupported claims</p>
                  <p>
                    <span className={demoTrace.some((t) => t.node === "job_quality_gate" && t.status === "ok") ? "text-emerald-300" : "text-amber-300"}>
                      job_quality_gate
                    </span>{" "}
                    → {demo.jobIntelligence.recommendation}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-center text-[10px] text-slate-400">
                Computed live by the real agent — not a mock-up.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Style Mirror vertical slice */}
      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <div className="section grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">New · Style Mirror</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Your experience is personal. Your application should sound personal too.
            </h2>
            <p className="prose-muted mt-4">
              Add two or three pieces of writing you created yourself. AutoApply learns your rhythm, directness, formality, and phrasing—then mirrors that voice across summaries, cover letters, recruiter messages, and follow-ups.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/style" className="btn-primary px-5 py-2.5">Create my Style Mirror</Link>
              <Link href="/about#truth" className="btn-secondary px-5 py-2.5">Read the privacy promise</Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["1", "Sanitize", "High-risk PII is removed locally before any model request."],
              ["2", "Fingerprint", "Only tone and writing patterns survive; raw examples are discarded."],
              ["3", "Mirror", "Facts stay fixed while professional writing adopts your voice."],
            ].map(([number, title, detail]) => (
              <article key={number} className="card card-hover p-5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-100 text-sm font-black text-violet-700">{number}</span>
                <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Problem strip */}
      <section className="border-b border-slate-200 bg-slate-900 py-12 text-white">
        <div className="section">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">The job search is broken</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["59%", "of job seekers say hearing nothing back is their top challenge", "iHire 2025"],
              ["39%", "name fake, fraudulent or ghost postings as a major problem", "iHire 2025"],
              ["36%", "struggle to find roles that meet their salary needs", "iHire 2025"],
              ["28%", "cannot tell which jobs they are actually qualified for", "iHire 2025"],
            ].map(([stat, text, src]) => (
              <div key={stat} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-3xl font-black text-white">{stat}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{text}</p>
                <p className="mt-2 text-[11px] text-slate-500">{src}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-slate-400">
            AutoApply is built to answer each of these problems directly —{" "}
            <Link href="/about#research" className="font-semibold text-indigo-300 hover:underline">see the research and our solutions</Link>.
          </p>
        </div>
      </section>

      {/* Agents */}
      <section className="py-20">
        <div className="section">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Four agents, one workflow</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Everything a job search actually needs</h2>
            <p className="prose-muted mt-4">
              Most tools only rewrite your resume. AutoApply also decides where to apply, whether the listing is real,
              and what to do after you hit submit.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {AGENTS.map((a) => (
              <article key={a.name} className="card card-hover">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={a.icon} />
                  </svg>
                </span>
                <h3 className="mt-4 font-bold text-slate-900">{a.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{a.line}</p>
                <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-xs text-slate-600">
                  {a.points.map((p) => (
                    <li key={p} className="flex gap-2"><span className="text-indigo-500">→</span>{p}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="overflow-hidden border-y border-slate-200 bg-white py-20">
        <div className="section">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow">Your next chapter starts here</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Join us. Build your plan. <span className="text-gradient">Land your next job.</span>
              </h2>
              <p className="prose-muted mt-5 max-w-xl text-base">
                You bring the ambition and the real experience. AutoApply brings the focus, evidence, strategy and
                follow-through. Together, we turn a confusing search into clear daily progress—from the right opportunity
                to a confident interview.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/onboarding" className="btn-primary px-6 py-3 text-base">
                  Start my job journey →
                </Link>
                <Link href="/about" className="btn-secondary px-6 py-3 text-base">
                  Meet AutoApply
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3 border-t border-slate-100 pt-6">
                <div>
                  <p className="text-lg font-black text-slate-900">Be seen</p>
                  <p className="mt-1 text-xs text-slate-500">Applications built around your strongest evidence</p>
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900">Be ready</p>
                  <p className="mt-1 text-xs text-slate-500">Interview guidance grounded in your own story</p>
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900">Keep moving</p>
                  <p className="mt-1 text-xs text-slate-500">A clear plan even when employers go quiet</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CAREER_FIELDS.slice(0, 4).map((field, index) => (
                <div
                  key={field.key}
                  className={`group relative overflow-hidden rounded-2xl bg-slate-100 ${index === 0 || index === 3 ? "h-64" : "h-52"}`}
                >
                  <Image
                    src={field.image}
                    alt={field.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 30vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <p className="absolute bottom-3 left-3 right-3 text-sm font-bold text-white">{field.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="section">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">From profile to interview in four steps</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-slate-200 bg-white p-6">
                <span className="text-4xl font-black text-slate-100">{s.n}</span>
                <h3 className="mt-2 font-bold text-slate-900">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="section">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-8 py-14 text-center text-white shadow-xl">
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Your next application should be your best one</h2>
              <p className="mx-auto mt-4 max-w-xl text-indigo-100">
                Build your profile once, then let the agents handle targeting, tailoring, verification and follow-up.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/dashboard" className="rounded-lg bg-white px-6 py-3 text-base font-bold text-indigo-700 shadow hover:bg-indigo-50">
                  Open the dashboard
                </Link>
                <Link href="/about" className="rounded-lg border border-white/40 px-6 py-3 text-base font-bold text-white hover:bg-white/10">
                  Why we built this
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
