import StyleMirrorTab from "@/components/StyleMirrorTab";

export const metadata = {
  title: "Style Mirror — Write like yourself with AutoApply",
  description: "Create a privacy-safe writing fingerprint and make resumes, cover letters, recruiter messages, and follow-ups sound like you.",
};

export default function StyleMirrorPage() {
  return (
    <main className="bg-slate-50 py-10">
      <div className="section">
        <StyleMirrorTab />
      </div>
    </main>
  );
}
