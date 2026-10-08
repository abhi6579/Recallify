import { getResumeRun } from "@/db/queries";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

function renderResume(text: string) {
  const lines = text.split("\n");
  const headings = new Set(["SUMMARY", "CORE SKILLS", "EXPERIENCE", "PROJECTS", "EDUCATION", "CERTIFICATIONS", "PUBLICATIONS"]);
  return lines.map((line, i) => {
    if (i === 0) return <h1 key={i} className="text-3xl font-bold tracking-tight text-slate-900">{line}</h1>;
    if (i === 1) return <p key={i} className="mb-4 text-xs text-slate-600">{line.replace(/\s+\|\s+/g, "  ·  ")}</p>;
    if (headings.has(line.trim())) {
      return (
        <h2 key={i} className="mt-5 mb-1 border-b border-slate-300 pb-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">
          {line}
        </h2>
      );
    }
    if (line.trim().startsWith("•")) {
      return <li key={i} className="ml-5 list-disc text-[13px] leading-relaxed text-slate-800">{line.replace(/^\s*•\s*/, "")}</li>;
    }
    if (line.trim() === "") return <div key={i} className="h-1" />;
    const isTitle = /—|\(/.test(line) && !line.startsWith(" ");
    return (
      <p key={i} className={`text-[13px] leading-relaxed ${isTitle ? "mt-2 font-semibold text-slate-900" : "text-slate-800"}`}>
        {line}
      </p>
    );
  });
}

export default async function ResumePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getResumeRun(Number(id));
  if (!run) notFound();

  return (
    <main className="min-h-screen bg-slate-200 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[820px] items-center justify-between px-4 print:hidden">
        <div className="text-sm text-slate-600">
          Tailored for <strong>{run.roleTitle || "role"}</strong> @ <strong>{run.companyName || "company"}</strong> · ATS{" "}
          {Math.round(run.atsScore * 100)}% · match {run.matchRangeLow}–{run.matchRangeHigh}%
        </div>
        <PrintButton />
      </div>
      <article className="mx-auto max-w-[820px] bg-white px-12 py-10 shadow-xl print:max-w-none print:shadow-none">
        {renderResume(run.resumeText)}
      </article>

      {run.coverLetter && (
        <article className="mx-auto mt-8 max-w-[820px] bg-white px-12 py-10 shadow-xl print:mt-0 print:max-w-none print:shadow-none print:break-before-page">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">Cover Letter</h2>
          <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-slate-800">{run.coverLetter}</pre>
        </article>
      )}
    </main>
  );
}
