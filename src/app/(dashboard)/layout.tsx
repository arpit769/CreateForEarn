import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getCurrentUserProfileSlim, getAdminHeaderStats } from "@/actions/users";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

import { DashboardSessionCheck } from "@/components/DashboardSessionCheck";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfileSlim();

  if (!profile) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/signup?error=profile_not_found");
  }

  const isAdminRoute = profile.role === 'admin';
  const adminStats = isAdminRoute ? await getAdminHeaderStats(profile) : null;
  const headerStats = isAdminRoute && adminStats
    ? { activeUsers: adminStats.activeUsers, pendingCount: adminStats.pendingCount }
    : null;

  return (
    <>
      <DashboardSessionCheck />
      <Sidebar role={profile.role} profile={profile} />
      <Header adminStats={headerStats} />
      <main className="main-content">
        <div className="dashboard-content-container">
          {children}
        </div>
      </main>
    </>
  );
}
