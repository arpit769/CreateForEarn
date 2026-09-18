'use client';

import InstagramOnboardingScreen from "@/components/dashboard/InstagramOnboardingScreen";
import PendingApprovalScreen from "@/components/dashboard/PendingApprovalScreen";
import RejectedScreen from "@/components/dashboard/RejectedScreen";
import BannedScreen from "@/components/dashboard/BannedScreen";

export default function InstagramLockWrapper({ profile, children }: { profile: any, children: React.ReactNode }) {

  if (profile?.role === 'worker') {
    const activeAccount = profile.instagram_accounts?.find((a: any) => a.id === profile.active_instagram_account_id) || profile.instagram_accounts?.[0];

    if (!activeAccount || !profile.instagram_accounts || profile.instagram_accounts.length === 0) {
      return <InstagramOnboardingScreen />;
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
