'use client';

import React from 'react';
import FacebookOnboardingScreen from "@/components/dashboard/FacebookOnboardingScreen";
import PendingApprovalScreen from "@/components/dashboard/PendingApprovalScreen";
import RejectedScreen from "@/components/dashboard/RejectedScreen";
import BannedScreen from "@/components/dashboard/BannedScreen";

export default function FacebookLockWrapper({ profile, children }: { profile: any, children: React.ReactNode }) {
  if (profile?.role === 'worker') {
    const activeAccount = profile.facebook_accounts?.find((a: any) => a.id === profile.active_facebook_account_id) || profile.facebook_accounts?.[0];

    if (!activeAccount || !profile.facebook_accounts || profile.facebook_accounts.length === 0) {
      return <FacebookOnboardingScreen />;
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
