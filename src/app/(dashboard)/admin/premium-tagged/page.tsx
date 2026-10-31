import { Metadata } from 'next';
import { getPremiumTaggedAccounts } from '@/actions/premium-tags';
import PremiumTaggedManager from '@/components/dashboard/PremiumTaggedManager';

export const metadata: Metadata = {
  title: 'Premium Tagged Accounts | CreateForEarn Management',
  description: 'Manage premium tier tags for worker Reddit accounts to grant extra task completion bonuses and expedited payout times.',
};

export default async function PremiumTaggedPage() {
  const data = await getPremiumTaggedAccounts();
  return <PremiumTaggedManager initialData={data} />;
}

