import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white print:hidden">
      <div className="section grid gap-8 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-black text-white">A</span>
            <span className="font-bold text-slate-900">AutoApply</span>
          </div>
          <p className="prose-muted mt-3 max-w-sm">
            An evidence-first job search assistant. It recommends roles you can actually get, tailors truthful
            applications, checks whether a listing deserves your time, and follows up so you are never forgotten.
          </p>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link></li>
            <li><Link href="/dashboard" className="hover:text-indigo-600">Role recommender</Link></li>
            <li><Link href="/dashboard" className="hover:text-indigo-600">Resume agent</Link></li>
            <li><Link href="/news" className="hover:text-indigo-600">Industry updates</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href="/about" className="hover:text-indigo-600">About us</Link></li>
            <li><Link href="/about#how-we-built-it" className="hover:text-indigo-600">How we built it</Link></li>
            <li><Link href="/about#truth" className="hover:text-indigo-600">Our honesty policy</Link></li>
            <li><Link href="/about#research" className="hover:text-indigo-600">Market research</Link></li>
            <li><Link href="/about" className="text-indigo-600 font-semibold hover:underline">💬 Candidate Reviews &amp; Feedback</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="section flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} AutoApply. Built for job seekers in every industry.</p>
          <p>Never pay a fee to get a job. Verify every employer.</p>
        </div>
      </div>
    </footer>
  );
}
