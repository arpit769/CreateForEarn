import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getCurrentUserProfileSlim, getAdminHeaderStats } from "@/actions/users";
import { getMaintenanceModeStatus } from "@/actions/maintenance";
import MaintenanceScreen from "@/components/dashboard/MaintenanceScreen";
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

  const isAdmin = profile.role === 'admin';
  const maintenanceStatus = await getMaintenanceModeStatus();

  // If Maintenance Mode is active and the user is NOT an admin, show Under Maintenance screen
  if (maintenanceStatus.enabled && !isAdmin) {
    return (
      <MaintenanceScreen 
        message={maintenanceStatus.message}
        estimatedEndTime={maintenanceStatus.estimatedEndTime}
      />
    );
  }

  const adminStats = isAdmin ? await getAdminHeaderStats(profile) : null;
  const headerStats = isAdmin && adminStats
    ? { activeUsers: adminStats.activeUsers, pendingCount: adminStats.pendingCount }
    : null;

  return (
    <>
      <DashboardSessionCheck />
      <Sidebar role={profile.role} profile={profile} />
      <Header 
        adminStats={headerStats} 
        profile={profile} 
        initialMaintenanceStatus={maintenanceStatus}
      />
      <main className="main-content">
        <div className="dashboard-content-container">
          {children}
        </div>
      </main>
    </>
  );
}
