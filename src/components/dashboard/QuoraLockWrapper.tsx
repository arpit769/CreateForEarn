'use client';

import QuoraOnboardingScreen from "@/components/dashboard/QuoraOnboardingScreen";
import PendingApprovalScreen from "@/components/dashboard/PendingApprovalScreen";
import RejectedScreen from "@/components/dashboard/RejectedScreen";
import BannedScreen from "@/components/dashboard/BannedScreen";

export default function QuoraLockWrapper({ profile, children }: { profile: any, children: React.ReactNode }) {

  if (profile?.role === 'worker') {
    const activeAccount = profile.quora_accounts?.find((a: any) => a.id === profile.active_quora_account_id) || profile.quora_accounts?.[0];

    if (!activeAccount || !profile.quora_accounts || profile.quora_accounts.length === 0) {
      return <QuoraOnboardingScreen />;
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
