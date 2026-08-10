import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getCurrentUserProfileSlim, getAdminHeaderStats } from "@/actions/users";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import WorkerLockWrapper from "@/components/dashboard/WorkerLockWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Run both fetches in parallel — profile check and admin stats
  const [profile, adminStats] = await Promise.all([
    getCurrentUserProfileSlim(),
    getAdminHeaderStats(),
  ]);

  if (!profile) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/signup?error=profile_not_found");
  }


  const isAdminRoute = profile.role === 'admin';
  const headerStats = isAdminRoute
    ? { activeUsers: adminStats.activeUsers, pendingCount: adminStats.pendingCount }
    : null;

  return (
    <>
      <Sidebar role={profile.role} profile={profile} />
      <Header adminStats={headerStats} />
      <main className="main-content">
        <div className="dashboard-content-container">
          <WorkerLockWrapper profile={profile}>
            {children}
          </WorkerLockWrapper>
        </div>
      </main>
    </>
  );
}
