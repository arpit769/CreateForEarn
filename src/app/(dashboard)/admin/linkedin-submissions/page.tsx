import { getAllSubmissions } from '@/actions/tasks';
import SubmissionsTable from '@/components/dashboard/SubmissionsTable';

export const metadata = {
  title: 'LinkedIn Submissions | CreateForEarn',
};

export default async function AdminLinkedInSubmissionsPage() {
  const { submissions, totalCounts, error } = await getAllSubmissions('linkedin');
  
  if (error) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Failed to load LinkedIn submissions: {error}</p>
      </div>
    );
  }
  
  return <SubmissionsTable initialSubmissions={submissions || []} initialCounts={totalCounts} />;
}
