'use client';

import { usePathname } from 'next/navigation';
import OnboardingScreen from "@/components/dashboard/OnboardingScreen";
import PendingApprovalScreen from "@/components/dashboard/PendingApprovalScreen";
import RejectedScreen from "@/components/dashboard/RejectedScreen";
import BannedScreen from "@/components/dashboard/BannedScreen";

export default function RedditLockWrapper({ profile, children }: { profile: any, children: React.ReactNode }) {

  if (profile.role === 'worker') {
    const activeAccount = profile.reddit_accounts?.find((a: any) => a.id === profile.active_reddit_account_id);

    if (!activeAccount || profile.reddit_accounts?.length === 0) {
      return <OnboardingScreen />;
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
