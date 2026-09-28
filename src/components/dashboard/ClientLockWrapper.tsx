'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import ClientPendingApprovalScreen from '@/components/dashboard/ClientPendingApprovalScreen';
import ClientRejectedScreen from '@/components/dashboard/ClientRejectedScreen';
import BannedScreen from '@/components/dashboard/BannedScreen';

export default function ClientLockWrapper({ 
  profile, 
  children 
}: { 
  profile: any; 
  children: React.ReactNode; 
}) {
  const pathname = usePathname();

  // If user is client role, enforce verification check
  if (profile?.role === 'client') {
    // If client is on support page, allow them through so they can ask questions
    if (pathname === '/client/support') {
      return <>{children}</>;
    }

    if (profile.status === 'pending_approval' || profile.status === 'pending_details' || !profile.status) {
      return <ClientPendingApprovalScreen profile={profile} />;
    }

    if (profile.status === 'rejected') {
      return <ClientRejectedScreen reason={profile.rejection_reason} profile={profile} />;
    }

    if (profile.status === 'banned') {
      return <BannedScreen reason={profile.ban_reason} />;
    }
  }

  return <>{children}</>;
}
