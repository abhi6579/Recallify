import OnboardingWizard from "@/components/OnboardingWizard";

export const metadata = {
  title: "Get started — AutoApply",
  description: "Tell us your field and skills so we match you to the right careers.",
};

export default function OnboardingPage() {
  return (
    <main className="py-10">
      <div className="section">
        <div className="mx-auto mb-8 max-w-4xl">
          <p className="eyebrow">Set up in 60 seconds</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Let&apos;s find your kind of work</h1>
        </div>
        <OnboardingWizard />
      </div>
    </main>
  );
}
