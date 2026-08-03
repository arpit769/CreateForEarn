import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getCurrentUserProfile } from "@/actions/users";
import { redirect } from "next/navigation";
import WorkerLockWrapper from "@/components/dashboard/WorkerLockWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/signup");
  }

  return (
    <>
      <Sidebar role={profile.role} />
      <Header />
      <main className="main-content">
        <div style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto' }}>
          <WorkerLockWrapper profile={profile}>
            {children}
          </WorkerLockWrapper>
        </div>
      </main>
    </>
  );
}
