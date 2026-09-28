import { getCurrentUserProfileSlim } from '@/actions/users';
import ClientLockWrapper from '@/components/dashboard/ClientLockWrapper';
import { redirect } from 'next/navigation';

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfileSlim();

  if (!profile) {
    redirect('/signup?role=client');
  }

  return (
    <ClientLockWrapper profile={profile}>
      {children}
    </ClientLockWrapper>
  );
}
