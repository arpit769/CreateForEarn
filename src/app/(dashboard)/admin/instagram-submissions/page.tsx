import { getAllSubmissions } from '@/actions/tasks';
import SubmissionsTable from '@/components/dashboard/SubmissionsTable';

export const metadata = {
  title: 'Instagram Submissions | CreateForEarn',
};

export default async function AdminInstagramSubmissionsPage() {
  const { submissions, totalCounts, error } = await getAllSubmissions('instagram');
  
  if (error) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Failed to load Instagram submissions: {error}</p>
      </div>
    );
  }
  
  return <SubmissionsTable initialSubmissions={submissions || []} initialCounts={totalCounts} />;
}
