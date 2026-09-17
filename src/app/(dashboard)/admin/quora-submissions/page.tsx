import { getAllSubmissions } from '@/actions/tasks';
import SubmissionsTable from '@/components/dashboard/SubmissionsTable';

export const metadata = {
  title: 'Quora Submissions | CreateForEarn',
};

export default async function AdminQuoraSubmissionsPage() {
  const { submissions, totalCounts, error } = await getAllSubmissions('quora');
  
  if (error) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Failed to load Quora submissions: {error}</p>
      </div>
    );
  }
  
  return <SubmissionsTable initialSubmissions={submissions || []} initialCounts={totalCounts} />;
}
