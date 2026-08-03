import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getCurrentUserProfile } from "@/actions/users";
import { redirect } from "next/navigation";
import OnboardingScreen from "@/components/dashboard/OnboardingScreen";
import PendingApprovalScreen from "@/components/dashboard/PendingApprovalScreen";
import RejectedScreen from "@/components/dashboard/RejectedScreen";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/signup");
  }

  // Handle Onboarding Locks for Workers
  if (profile.role === 'worker') {
    if (profile.status === "pending_details") {
      return <OnboardingScreen />;
    }

    if (profile.status === "pending_approval") {
      return <PendingApprovalScreen />;
    }

    if (profile.status === "rejected") {
      return <RejectedScreen reason={profile.rejection_reason} />;
    }
  }

  return (
    <>
      <Sidebar role={profile.role} />
      <Header profile={profile} />
      <main className="main-content">
        <div style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </>
  );
}
