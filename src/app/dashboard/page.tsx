import Dashboard from "@/components/Dashboard";

export const metadata = {
  title: "Dashboard — AutoApply",
  description: "Run your role recommender, job discovery, resume, salary, and follow-up agents in one workspace.",
};

export default function DashboardPage() {
  return (
    <main className="bg-slate-50 py-2">
      <Dashboard />
    </main>
  );
}
