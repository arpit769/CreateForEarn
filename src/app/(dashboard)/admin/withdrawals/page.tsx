import { getAllWithdrawals } from '@/actions/wallet';
import WithdrawalsTable from '@/components/dashboard/WithdrawalsTable';
import { redirect } from 'next/navigation';

export default async function WithdrawalsPage() {
  const res = await getAllWithdrawals();

  if ('error' in res) {
    if (res.error === 'Unauthorized') {
      redirect('/signup');
    }
    return (
      <div style={{ padding: '32px', color: 'var(--accent-red)' }}>
        Error: {res.error}
      </div>
    );
  }

  return <WithdrawalsTable initialWithdrawals={res.withdrawals || []} />;
}
