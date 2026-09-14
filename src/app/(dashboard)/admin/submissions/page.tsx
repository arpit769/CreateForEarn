import { getAllSubmissions } from '@/actions/tasks';
import SubmissionsTable from '@/components/dashboard/SubmissionsTable';

export default async function Page() {
  const { submissions, totalCounts, error } = await getAllSubmissions('reddit');
  
  if (error) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Failed to load submissions: {error}</p>
      </div>
    );
  }
  
  return <SubmissionsTable initialSubmissions={submissions || []} initialCounts={totalCounts} />;
}
