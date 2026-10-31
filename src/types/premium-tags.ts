export type PremiumTierKey = 'elite' | 'high' | 'moderate' | 'low' | 'none';

export interface PremiumTierConfig {
  key: PremiumTierKey;
  label: string;
  badgeText: string;
  bonusAmount: number; // in USD (e.g. 0.50)
  payoutSpeed: string; // e.g. "Instant (< 2h)"
  payoutPriorityHours: number;
  color: string;
  bg: string;
  border: string;
  gradient?: string;
  description: string;
}

export const PREMIUM_TIERS: Record<PremiumTierKey, PremiumTierConfig> = {
  elite: {
    key: 'elite',
    label: 'Elite / Diamond',
    badgeText: '💎 Elite',
    bonusAmount: 0.50,
    payoutSpeed: 'Instant Fast-Track (< 2h)',
    payoutPriorityHours: 2,
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.35)',
    gradient: 'linear-gradient(135deg, #a855f7, #6366f1)',
    description: 'Top-tier karma accounts with immaculate track record. Maximum +$0.50 task bonus & instant fast-tracked payouts.'
  },
  high: {
    key: 'high',
    label: 'High Tier',
    badgeText: '🟢 High',
    bonusAmount: 0.30,
    payoutSpeed: 'Priority Queue (< 6h)',
    payoutPriorityHours: 6,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.35)',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    description: 'High engagement & trusted accounts. Receives +$0.30 task bonus & priority same-day payout approval.'
  },
  moderate: {
    key: 'moderate',
    label: 'Moderate Tier',
    badgeText: '🔵 Moderate',
    bonusAmount: 0.15,
    payoutSpeed: 'Expedited (< 24h)',
    payoutPriorityHours: 24,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.35)',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    description: 'Consistent reliable accounts. Receives +$0.15 task bonus & expedited 24-hour payout turnaround.'
  },
  low: {
    key: 'low',
    label: 'Low Tier',
    badgeText: '🟡 Low',
    bonusAmount: 0.05,
    payoutSpeed: 'Standard (< 48h)',
    payoutPriorityHours: 48,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.35)',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    description: 'Active accounts meeting basic criteria. Receives +$0.05 bonus boost & regular payout processing.'
  },
  none: {
    key: 'none',
    label: 'Standard / Untagged',
    badgeText: '⚪ Untagged',
    bonusAmount: 0.00,
    payoutSpeed: 'Standard Queue',
    payoutPriorityHours: 72,
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.08)',
    border: 'rgba(148, 163, 184, 0.25)',
    description: 'Default baseline tier. Regular task earnings without bonus and normal payout queuing.'
  }
};

export interface PremiumTaggedAccount {
  id: string; // reddit_account_id
  user_id: string;
  reddit_username: string;
  reddit_profile_link: string | null;
  reddit_karma: number | null;
  status: string | null;
  premium_tag: PremiumTierKey;
  custom_bonus_rate?: number | null;
  created_at: string;
  user_name: string;
  user_email: string;
  assigned_tags: { id: string; name: string }[];
  total_posts: number;
  approved_posts: number;
  total_earned: number;
  last_activity: string | null;
}

export interface PremiumTaggedResponse {
  accounts: PremiumTaggedAccount[];
  tierCounts: Record<PremiumTierKey, number>;
  totalAccounts: number;
  allSubredditTags: { id: string; name: string }[];
  error?: string;
}

