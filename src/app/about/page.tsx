import Link from "next/link";
import { MARKET_REALITY } from "@/lib/marketReality";
import { ROLE_CATEGORIES, ROLE_LIBRARY } from "@/lib/agents/roleLibrary";

export const metadata = {
  title: "About us — AutoApply",
  description: "Why AutoApply exists, how we built it, what it will never do, and the research behind every feature.",
};

const TIMELINE = [
  { phase: "The frustration", body: "It started as a personal problem: hundreds of applications, almost no replies. The advice everywhere was \"apply more\". The data said the opposite — volume was the problem, not the cure." },
  { phase: "The research", body: "We read the 2025–2026 candidate surveys. Ghosting, ghost jobs, hidden salaries and unclear qualification signals were the top complaints. None of the popular resume tools addressed those." },
  { phase: "The first agent", body: "We built the Resume Agent: parse a job description, retrieve evidence from a structured profile, draft, score against ATS keywords, fact-check, and revise in a loop until it passes or honestly reports the gap." },
  { phase: "The missing half", body: "A perfect resume sent to a fake or stale listing is still wasted. So we added Job Intelligence — trust, ghost-job and scam scoring — and the Follow-up Agent to break the silence cycle." },
  { phase: "Beyond tech roles", body: "Early versions only understood software jobs. We expanded the library to " + ROLE_LIBRARY.length + " occupations across " + ROLE_CATEGORIES.length + " sectors so nurses, teachers, electricians and chefs get the same quality of help." },
];

const PROMISES = [
  { t: "We never invent experience", d: "The generator can only use evidence that exists in your profile. If a requirement is not backed by your history, it is reported as a gap — not written in as a fake skill." },
  { t: "Every claim is re-checked", d: "A fact checker scans the finished document and flags anything it cannot trace back to your profile. If the optional AI polish adds an unsupported claim, that output is rejected automatically." },
  { t: "Scores are honest, not flattering", d: "Match is shown as a confidence range rather than a single inflated number, and a low score is reported plainly so you can fix it instead of being misled." },
  { t: "You stay in control", d: "If the agent flags a gap you genuinely have, you challenge it with real evidence. That evidence is stored in your profile — the human is always the source of truth." },
  { t: "We will never ask you to pay an employer", d: "AutoApply actively warns against fee requests, fake cheques, and identity-data harvesting. A real employer never asks you to pay to get hired." },
];

const BENEFITS = [
  ["Apply to fewer, better jobs", "Priority scoring tells you which listings deserve real effort, so you stop burning hours on dead ends."],
  ["Get past screening honestly", "Keyword coverage and evidence mapping raise your pass rate without fabricating a single line."],
  ["Avoid scams and ghost jobs", "Freshness, transparency and fraud-pattern checks run before you invest your time."],
  ["Never be forgotten", "Scheduled, polite follow-ups continue until you get an answer — and stop the moment you do."],
  ["Know exactly what to learn", "Every missing skill comes with a resource, a realistic time estimate and a portfolio project."],
  ["Walk in prepared", "Each run produces likely interview questions with hints grounded in your own projects."],
];

export default function AboutPage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="section relative py-16 lg:py-24">
          <p className="eyebrow">About us</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            An AI-powered job consultant — what placement firms charge lakhs for, in seconds
          </h1>
          <p className="prose-muted mt-6 max-w-2xl text-base">
            AutoApply is a digital job consultant. Just like a traditional consultant does — analysing your profile,
            recommending roles, rewriting your resume, and following up with companies — but as a multi-agent AI system
            that works 24/7, is honest about limits, and costs a fraction of what placement firms charge for weeks of work.
          </p>
        </div>
      </section>

      {/* Consultant comparison */}
      <section className="border-b border-slate-200 bg-white py-12">
        <div className="section">
          <div className="max-w-3xl">
            <p className="eyebrow">What's in the market</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">How AutoApply compares with top career services &amp; agencies</h2>
            <p className="prose-muted mt-4">
              Prices and turnarounds below are from each provider&apos;s public 2026 pricing — TopResume, ZipJob,
              The Muse, Jobscan, Teal, ResumeSpice, and India&apos;s major recruitment agencies (Randstad, Adecco,
              TeamLease, Michael Page) — so you can compare fairly instead of trusting our marketing.
            </p>
          </div>

          {/* Agencies — traditional people */}
          <h3 className="mt-10 text-sm font-bold text-slate-800">Traditional placement consultants &amp; agencies</h3>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Their service</th><th className="px-4 py-3">Typical cost (2026)</th><th className="px-4 py-3">Turnaround</th><th className="px-4 py-3">What they charge</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["TopResume","Professional resume rewrite","$149–$599","1–2 weeks","60-day interview guarantee"],
                  ["ZipJob","ATS resume + cover letter + LinkedIn","$139–$299","3–7 days","60-day interview guarantee"],
                  ["The Muse","State-approved coach + edits","$139–$549","Varies","No formal guarantee"],
                  ["ResumeSpice","Executive + personalized rewrite","$449–$689","2–3 days","60-day interview guarantee"],
                  ["Jobscan","ATS keyword scan","Free / $49.95/mo","Minutes","—"],
                  ["Teal","Resume builder + job tracker","Free / $29/mo","Minutes","—"],
                  ["India: Randstad / Adecco / TeamLease","Staffing, RPO, payroll, contract & permanent","Custom employer fee","Days–weeks","Usually employer-paid (never candidate fees)"],
                  ["India: Michael Page / ABC Consultants","Leadership & executive search","Custom (retainer)","Days–weeks","Retained search fee from employers"],
                ].map(([a,b,c,d,e]) => (
                  <tr key={a}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{a}</td>
                    <td className="px-4 py-3 text-slate-600">{b}</td>
                    <td className="px-4 py-3 text-slate-900">{c}</td>
                    <td className="px-4 py-3 text-slate-600">{d}</td>
                    <td className="px-4 py-3 text-slate-600">{e}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AutoApply column */}
          <div className="mt-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow text-indigo-200">AutoApply</p>
                <h3 className="mt-2 text-2xl font-bold">Everything above — plus what none of them offer</h3>
              </div>
              <span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold">Free / low-cost SaaS</span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Per-job tailoring","TopResume/ZipJob charge $150–$300 for one rewrite. AutoApply rewrites and verifies per JD in one run, free."],
                ["Real salary research","No other popular service gives you live pay bands. AutoApply pulls them from current postings."],
                ["Ghost-job & scam checks","No major agency or builder screens a listing for being fake or stale. AutoApply does."],
                ["Follow-up automation","Traditional consultants make you chase manually. AutoApply schedules and sends the reminder."],
                ["Cover letter + interview brief in one","A $200 bundle at most services. AutoApply includes both in the same run."],
                ["Instant, not days","TopResume=7–14 days, ZipJob=3–7, ResumeSpice=2–3. AutoApply is seconds."],
              ].map(([a,b]) => (
                <li key={a} className="rounded-xl bg-white/10 p-4">
                  <p className="font-bold">{a}</p>
                  <p className="mt-1 text-sm text-indigo-100">{b}</p>
                </li>
              ))}
            </div>
          </div>

          {/* Guarantee */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
            <div className="grid gap-6 p-6 md:grid-cols-3">
              <div>
                <p className="text-2xl font-black text-emerald-800">60-day interview guarantee</p>
                <p className="mt-1 text-sm text-emerald-700">
                  If a tailored, verified resume (ATS ≥ 85 and factual ≥ 95) receives no employer response within 60 days across a focused batch of 10+ applications, you can use the entire suite free until you do.
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">What we can&#39;t guarantee</p>
                <ul className="prose-muted mt-1 list-disc space-y-1 pl-5 text-sm">
                  <li>Outcomes we don&#39;t control (recruiter decisions, hiring freezes, internal referrals)</li>
                  <li>Salary offers — we give market bands, not actual compensation</li>
                  <li>Jobs that require interviews, tests or licences we can&#39;t check remotely</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Our honesty policy in one line</p>
                <p className="prose-muted mt-1 text-sm">
                  When data is missing, we say so. When we give a number, we show where it came from. When a profile is a bad fit, we tell you plainly — not after you&#39;ve paid.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section id="how-we-built-it" className="py-16">
        <div className="section grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Our history</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">How this was made</h2>
            <p className="prose-muted mt-4">
              AutoApply grew from one painful job hunt into a four-agent system. Each stage was added because something
              measurable was still failing — not because it looked impressive in a demo.
            </p>
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-bold text-slate-900">How it is engineered</p>
              <ul className="prose-muted mt-3 space-y-2 text-sm">
                <li>• Eight cooperating agents (recommender, resume, follow-up, job intelligence, discovery, salary, diagnosis, and Alex, the consultant) — each with a clear job and a typed contract between them.</li>
                <li>• A PostgreSQL profile memory that acts as the single source of truth for every claim.</li>
                <li>• Deterministic scoring first; the optional AI layer can only polish wording and is re-verified by the fact checker.</li>
                <li>• Live market data wherever possible (current job postings for salaries, fresh listings for targeting) rather than static numbers.</li>
                <li>• A visible execution trace so you can audit exactly what each agent did and why.</li>
              </ul>
            </div>
          </div>
          <ol className="relative space-y-6 border-l-2 border-slate-200 pl-6">
            {TIMELINE.map((item, i) => (
              <li key={item.phase} className="relative">
                <span className="absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">{i + 1}</span>
                <h3 className="font-bold text-slate-900">{item.phase}</h3>
                <p className="prose-muted mt-1 text-sm">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Truth */}
      <section id="truth" className="border-y border-slate-200 bg-white py-16">
        <div className="section">
          <div className="max-w-2xl">
            <p className="eyebrow">The truth policy</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">What AutoApply will never do</h2>
            <p className="prose-muted mt-4">
              Surveys show a third of candidates have considered adding skills they do not have. That is exactly what
              most AI writing tools quietly encourage. We took the opposite position — and enforced it in code.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {PROMISES.map((p) => (
              <div key={p.t} className="card card-hover">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600">✓</span>
                <h3 className="mt-4 font-bold text-slate-900">{p.t}</h3>
                <p className="prose-muted mt-2 text-sm">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research */}
      <section id="research" className="py-16">
        <div className="section">
          <div className="max-w-2xl">
            <p className="eyebrow">The research</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Why this product exists</h2>
            <p className="prose-muted mt-4">
              Every feature maps to a documented, linkable problem in the current job market. These are the studies we
              designed against — check them yourself.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MARKET_REALITY.map((item) => (
              <article key={`${item.stat}-${item.problem}`} className="card card-hover flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-3xl font-black text-gradient">{item.stat}</span>
                  <span className="badge bg-indigo-50 text-indigo-700">{item.agent}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{item.problem}</p>
                <p className="prose-muted mt-2 flex-1 text-sm">→ {item.solution}</p>
                <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 text-xs font-bold text-indigo-600 hover:underline">
                  Source: {item.source} ↗
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Verdicts & Reviews */}
      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="section">
          <div className="max-w-2xl">
            <p className="eyebrow">Candidate Community &amp; Feedback</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">What job seekers say &amp; what they want next</h2>
            <p className="prose-muted mt-2 text-sm">
              We publish real candidate reviews, what they understood about the AI consultant, and feature requests.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-amber-500 font-bold text-sm">★★★★★ 5.0</span>
                <span className="badge bg-indigo-50 text-indigo-700">Pharma &amp; QC</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">Dr. Sunita Patel (M.Pharm)</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                &ldquo;AutoApply is not just a resume tool; it&apos;s an end-to-end digital job consultant. I loved that it refused to show me tech jobs and found Clinical Trial Manager roles matching my HPLC &amp; GMP background.&rdquo;
              </p>
              <p className="text-[11px] text-indigo-700 font-semibold border-t border-slate-100 pt-2">
                💡 Requested: Direct Indian hospital board indexing.
              </p>
            </div>

            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-amber-500 font-bold text-sm">★★★★★ 5.0</span>
                <span className="badge bg-indigo-50 text-indigo-700">AI / Tech</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">Ananya Iyer (AI Engineer)</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                &ldquo;The fact-checker and ATS revision loop caught unsupported skills in my draft and revised it automatically without hallucinating. The Mock Interview simulator is incredible.&rdquo;
              </p>
              <p className="text-[11px] text-indigo-700 font-semibold border-t border-slate-100 pt-2">
                💡 Requested: Instant alert webhook when high-fit Greenhouse roles open.
              </p>
            </div>

            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-amber-500 font-bold text-sm">★★★★★ 5.0</span>
                <span className="badge bg-indigo-50 text-indigo-700">MBA Management</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">Rohit Verma (Consultant)</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                &ldquo;Salary Coach gave me real USD and INR market bands from actual postings, plus the exact script to quote in negotiations. Replaces what placement agencies charge lakhs for.&rdquo;
              </p>
              <p className="text-[11px] text-indigo-700 font-semibold border-t border-slate-100 pt-2">
                💡 Requested: 1-click Google Calendar sync for the coaching checklist.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="section">
          <div className="max-w-2xl">
            <p className="eyebrow">The benefits</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">What you actually get</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="font-bold text-slate-900">{t}</h3>
                <p className="prose-muted mt-2 text-sm">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="btn-primary px-6 py-3 text-base">Try the dashboard</Link>
            <Link href="/news" className="btn-secondary px-6 py-3 text-base">Follow industry updates</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
