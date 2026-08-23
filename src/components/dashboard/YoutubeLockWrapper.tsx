'use client';

import { usePathname } from 'next/navigation';
import YoutubeOnboardingScreen from "@/components/dashboard/YoutubeOnboardingScreen";
import PendingApprovalScreen from "@/components/dashboard/PendingApprovalScreen";
import RejectedScreen from "@/components/dashboard/RejectedScreen";
import BannedScreen from "@/components/dashboard/BannedScreen";

export default function YoutubeLockWrapper({ profile, children }: { profile: any, children: React.ReactNode }) {

  if (profile?.role === 'worker') {
    const activeAccount = profile.youtube_accounts?.find((a: any) => a.id === profile.active_youtube_account_id) || profile.youtube_accounts?.[0];

    if (!activeAccount || !profile.youtube_accounts || profile.youtube_accounts.length === 0) {
      return <YoutubeOnboardingScreen />;
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
