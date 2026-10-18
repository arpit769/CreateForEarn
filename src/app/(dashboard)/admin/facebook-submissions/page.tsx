import { getAllSubmissions } from '@/actions/tasks';
import SubmissionsTable from '@/components/dashboard/SubmissionsTable';

export const metadata = {
  title: 'Facebook Submissions | CreateForEarn',
};

export default async function AdminFacebookSubmissionsPage() {
  const { submissions, totalCounts, error } = await getAllSubmissions('facebook');
  
  if (error) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Failed to load Facebook submissions: {error}</p>
      </div>
    );
  }
  
  return <SubmissionsTable initialSubmissions={submissions || []} initialCounts={totalCounts} />;
}
