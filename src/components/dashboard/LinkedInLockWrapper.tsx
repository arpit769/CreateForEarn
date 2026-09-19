'use client';

import LinkedInOnboardingScreen from "@/components/dashboard/LinkedInOnboardingScreen";
import PendingApprovalScreen from "@/components/dashboard/PendingApprovalScreen";
import RejectedScreen from "@/components/dashboard/RejectedScreen";
import BannedScreen from "@/components/dashboard/BannedScreen";

export default function LinkedInLockWrapper({ profile, children }: { profile: any, children: React.ReactNode }) {

  if (profile?.role === 'worker') {
    const activeAccount = profile.linkedin_accounts?.find((a: any) => a.id === profile.active_linkedin_account_id) || profile.linkedin_accounts?.[0];

    if (!activeAccount || !profile.linkedin_accounts || profile.linkedin_accounts.length === 0) {
      return <LinkedInOnboardingScreen />;
    }

    if (activeAccount.status === "pending_approval") {
      return <PendingApprovalScreen />;
    }

    if (activeAccount.status === "rejected") {
      return <RejectedScreen reason={activeAccount.rejection_reason} />;
    }

    if (activeAccount.status === "banned") {
      return <BannedScreen reason={activeAccount.ban_reason} />;
    }
  }

  return <>{children}</>;
}
