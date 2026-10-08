import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import { getUserFromToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Control Room — AutoApply",
  description: "Protected creator dashboard for AutoApply platform operations.",
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("autoapply_session")?.value;
  const user = token ? await getUserFromToken(token) : null;

  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/dashboard?forbidden=admin");

  return <AdminDashboard admin={user} />;
}
