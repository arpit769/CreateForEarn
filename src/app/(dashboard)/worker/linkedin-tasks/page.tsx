import { getAvailableTasks } from '@/actions/tasks';
import WorkerLinkedInTasks from '@/components/dashboard/WorkerLinkedInTasks';
import { getCurrentUserProfileSlim } from '@/actions/users';
import LinkedInLockWrapper from '@/components/dashboard/LinkedInLockWrapper';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'LinkedIn Tasks | CreateForEarn',
};

export default async function Page() {
  const profile = await getCurrentUserProfileSlim();
  if (!profile) redirect('/login');

  const { 
    tasks, 
    error 
  } = await getAvailableTasks();
  
  const activeLinkedInAccount = profile.linkedin_accounts?.find((a: any) => a.id === profile.active_linkedin_account_id) || profile.linkedin_accounts?.[0];

  return (
    <LinkedInLockWrapper profile={profile}>
      {error ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Failed to load tasks: {error}</p>
        </div>
      ) : (
        <WorkerLinkedInTasks 
          initialTasks={(tasks || []).filter((t: any) => t.platform === 'linkedin')} 
          activeAccountId={activeLinkedInAccount?.id}
        />
      )}
    </LinkedInLockWrapper>
  );
}
