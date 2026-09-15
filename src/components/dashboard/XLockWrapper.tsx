'use client';

import XOnboardingScreen from "@/components/dashboard/XOnboardingScreen";
import PendingApprovalScreen from "@/components/dashboard/PendingApprovalScreen";
import RejectedScreen from "@/components/dashboard/RejectedScreen";
import BannedScreen from "@/components/dashboard/BannedScreen";

export default function XLockWrapper({ profile, children }: { profile: any, children: React.ReactNode }) {

  if (profile?.role === 'worker') {
    const activeAccount = profile.x_accounts?.find((a: any) => a.id === profile.active_x_account_id) || profile.x_accounts?.[0];

    if (!activeAccount || !profile.x_accounts || profile.x_accounts.length === 0) {
      return <XOnboardingScreen />;
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
