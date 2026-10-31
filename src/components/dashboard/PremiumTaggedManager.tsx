'use client';

import React, { useState, useMemo, useTransition, useEffect } from 'react';
import {
  Sparkles, Search, Filter, RefreshCw, CheckCircle2, AlertTriangle,
  ExternalLink, ChevronDown, Check, X, Shield, ArrowUpDown,
  Tag, Clock, Zap, DollarSign, Users, Award, Sliders, CheckSquare, Square,
  MoreHorizontal, Copy
} from 'lucide-react';
import {
  PremiumTierKey,
  PremiumTaggedAccount,
  PremiumTaggedResponse,
  PREMIUM_TIERS
} from '@/types/premium-tags';
import {
  getPremiumTaggedAccounts,
  updateAccountPremiumTag,
  bulkUpdateAccountPremiumTags
} from '@/actions/premium-tags';

interface Props {
  initialData: PremiumTaggedResponse;
}

export default function PremiumTaggedManager({ initialData }: Props) {
  const [data, setData] = useState<PremiumTaggedResponse>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<'all' | PremiumTierKey>('all');
  const [selectedSubreddit, setSelectedSubreddit] = useState('all');
  const [sortBy, setSortBy] = useState<'posts' | 'karma' | 'earnings' | 'recent' | 'username'>('posts');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Bulk Selection
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Single Account Modal State
  const [modalAccount, setModalAccount] = useState<PremiumTaggedAccount | null>(null);
  const [modalTier, setModalTier] = useState<PremiumTierKey>('none');
  const [modalCustomBonus, setModalCustomBonus] = useState<string>('');
  const [isSavingTag, setIsSavingTag] = useState(false);

  // In-row updating tracker
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 3-dots active menu tracker
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.premium-row-menu-container')) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuId]);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Refresh data from server
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await getPremiumTaggedAccounts();
      if (!fresh.error) {
        setData(fresh);
        showToast('Account data refreshed successfully.');
      } else {
        showToast(fresh.error, 'error');
      }
    } catch {
      showToast('Failed to refresh accounts.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter & Sort
  const filteredAccounts = useMemo(() => {
    return data.accounts
      .filter((acc) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesUser = acc.reddit_username.toLowerCase().includes(q);
          const matchesName = acc.user_name.toLowerCase().includes(q);
          const matchesEmail = acc.user_email.toLowerCase().includes(q);
          if (!matchesUser && !matchesName && !matchesEmail) return false;
        }

        // Tier filter
        if (selectedTier !== 'all') {
          if (acc.premium_tag !== selectedTier) return false;
        }

        // Subreddit filter
        if (selectedSubreddit !== 'all') {
          const hasSub = acc.assigned_tags?.some(
            (t) => t.id === selectedSubreddit || t.name.toLowerCase() === selectedSubreddit.toLowerCase()
          );
          if (!hasSub) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;

        if (sortBy === 'posts') {
          valA = a.approved_posts;
          valB = b.approved_posts;
        } else if (sortBy === 'karma') {
          valA = a.reddit_karma || 0;
          valB = b.reddit_karma || 0;
        } else if (sortBy === 'earnings') {
          valA = a.total_earned;
          valB = b.total_earned;
        } else if (sortBy === 'username') {
          const comp = a.reddit_username.localeCompare(b.reddit_username);
          return sortOrder === 'asc' ? comp : -comp;
        } else if (sortBy === 'recent') {
          valA = a.last_activity ? new Date(a.last_activity).getTime() : 0;
          valB = b.last_activity ? new Date(b.last_activity).getTime() : 0;
        }

        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [data.accounts, searchQuery, selectedTier, selectedSubreddit, sortBy, sortOrder]);

  // Bulk Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAccountIds(filteredAccounts.map((a) => a.id));
    } else {
      setSelectedAccountIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Instant in-row tag change
  const handleQuickTagChange = async (account: PremiumTaggedAccount, newTag: PremiumTierKey) => {
    setUpdatingId(account.id);
    try {
      const res = await updateAccountPremiumTag(account.id, newTag);
      if (res.error) {
        showToast(`Failed to update: ${res.error}`, 'error');
      } else {
        setData((prev) => {
          const oldTag = account.premium_tag;
          const updatedCounts = { ...prev.tierCounts };
          updatedCounts[oldTag] = Math.max(0, (updatedCounts[oldTag] || 0) - 1);
          updatedCounts[newTag] = (updatedCounts[newTag] || 0) + 1;

          return {
            ...prev,
            tierCounts: updatedCounts,
            accounts: prev.accounts.map((a) =>
              a.id === account.id ? { ...a, premium_tag: newTag } : a
            )
          };
        });
        showToast(`Assigned ${PREMIUM_TIERS[newTag].badgeText} to ${account.reddit_username}!`);
      }
    } catch {
      showToast('Error updating account tag.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Bulk tag change
  const handleBulkTagChange = async (newTag: PremiumTierKey) => {
    if (selectedAccountIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const res = await bulkUpdateAccountPremiumTags(selectedAccountIds, newTag);
      if (res.error) {
        showToast(`Bulk update failed: ${res.error}`, 'error');
      } else {
        setData((prev) => {
          const updatedAccounts = prev.accounts.map((acc) =>
            selectedAccountIds.includes(acc.id) ? { ...acc, premium_tag: newTag } : acc
          );
          const newCounts: Record<PremiumTierKey, number> = {
            elite: 0,
            high: 0,
            moderate: 0,
            low: 0,
            none: 0
          };
          updatedAccounts.forEach((acc) => {
            newCounts[acc.premium_tag] = (newCounts[acc.premium_tag] || 0) + 1;
          });

          return {
            ...prev,
            tierCounts: newCounts,
            accounts: updatedAccounts
          };
        });
        showToast(`Updated ${selectedAccountIds.length} accounts to ${PREMIUM_TIERS[newTag].badgeText}!`);
        setSelectedAccountIds([]);
      }
    } catch {
      showToast('Bulk update failed.', 'error');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Open detailed modal
  const openModal = (account: PremiumTaggedAccount) => {
    setModalAccount(account);
    setModalTier(account.premium_tag);
    setModalCustomBonus(account.custom_bonus_rate ? String(account.custom_bonus_rate) : '');
  };

  // Save from modal
  const handleSaveModal = async () => {
    if (!modalAccount) return;
    setIsSavingTag(true);
    try {
      const parsedBonus = modalCustomBonus ? parseFloat(modalCustomBonus) : null;
      const res = await updateAccountPremiumTag(modalAccount.id, modalTier, parsedBonus);
      if (res.error) {
        showToast(`Update failed: ${res.error}`, 'error');
      } else {
        setData((prev) => {
          const oldTag = modalAccount.premium_tag;
          const updatedCounts = { ...prev.tierCounts };
          updatedCounts[oldTag] = Math.max(0, (updatedCounts[oldTag] || 0) - 1);
          updatedCounts[modalTier] = (updatedCounts[modalTier] || 0) + 1;

          return {
            ...prev,
            tierCounts: updatedCounts,
            accounts: prev.accounts.map((a) =>
              a.id === modalAccount.id
                ? { ...a, premium_tag: modalTier, custom_bonus_rate: parsedBonus }
                : a
            )
          };
        });
        showToast(`Saved settings for ${modalAccount.reddit_username}!`);
        setModalAccount(null);
      }
    } catch {
      showToast('Error saving account tag.', 'error');
    } finally {
      setIsSavingTag(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: '12px',
          background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '13.5px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(59, 130, 246, 0.08) 50%, var(--bg-surface) 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(168, 85, 247, 0.25)',
        padding: '28px 32px',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ maxWidth: '780px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)'
            }}>
              <Sparkles size={20} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Premium Tagged Reddit Accounts
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Assign performance-based premium tiers (<strong>Elite</strong>, <strong>High</strong>, <strong>Moderate</strong>, <strong>Low</strong>) to Reddit worker accounts. These tags automatically boost extra bonus rewards on task reviews and give priority queuing for withdrawal payouts.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-primary)',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Accounts'}
        </button>
      </div>

      {/* Tier Overview Cards (Clickable Quick Filters) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* All Accounts Card */}
        <div
          onClick={() => setSelectedTier('all')}
          style={{
            background: selectedTier === 'all' ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-surface)',
            border: selectedTier === 'all' ? '1.5px solid #3b82f6' : '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>All Accounts</span>
            <Users size={16} color="var(--text-muted)" />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {data.totalAccounts}
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              Total registered Reddit accounts
            </span>
          </div>
        </div>

        {/* Elite Tier Card */}
        <div
          onClick={() => setSelectedTier('elite')}
          style={{
            background: selectedTier === 'elite' ? PREMIUM_TIERS.elite.bg : 'var(--bg-surface)',
            border: selectedTier === 'elite' ? `2px solid ${PREMIUM_TIERS.elite.color}` : '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: PREMIUM_TIERS.elite.color }}>
              {PREMIUM_TIERS.elite.badgeText}
            </span>
            <Sparkles size={16} color={PREMIUM_TIERS.elite.color} />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: PREMIUM_TIERS.elite.color }}>
              {data.tierCounts.elite || 0}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, background: PREMIUM_TIERS.elite.bg, color: PREMIUM_TIERS.elite.color, padding: '2px 6px', borderRadius: '4px' }}>
                +${PREMIUM_TIERS.elite.bonusAmount.toFixed(2)} Bonus
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                ⚡ Fast-Track
              </span>
            </div>
          </div>
        </div>

        {/* High Tier Card */}
        <div
          onClick={() => setSelectedTier('high')}
          style={{
            background: selectedTier === 'high' ? PREMIUM_TIERS.high.bg : 'var(--bg-surface)',
            border: selectedTier === 'high' ? `2px solid ${PREMIUM_TIERS.high.color}` : '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: PREMIUM_TIERS.high.color }}>
              {PREMIUM_TIERS.high.badgeText}
            </span>
            <Award size={16} color={PREMIUM_TIERS.high.color} />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: PREMIUM_TIERS.high.color }}>
              {data.tierCounts.high || 0}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, background: PREMIUM_TIERS.high.bg, color: PREMIUM_TIERS.high.color, padding: '2px 6px', borderRadius: '4px' }}>
                +${PREMIUM_TIERS.high.bonusAmount.toFixed(2)} Bonus
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                🚀 Priority
              </span>
            </div>
          </div>
        </div>

        {/* Moderate Tier Card */}
        <div
          onClick={() => setSelectedTier('moderate')}
          style={{
            background: selectedTier === 'moderate' ? PREMIUM_TIERS.moderate.bg : 'var(--bg-surface)',
            border: selectedTier === 'moderate' ? `2px solid ${PREMIUM_TIERS.moderate.color}` : '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: PREMIUM_TIERS.moderate.color }}>
              {PREMIUM_TIERS.moderate.badgeText}
            </span>
            <Shield size={16} color={PREMIUM_TIERS.moderate.color} />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: PREMIUM_TIERS.moderate.color }}>
              {data.tierCounts.moderate || 0}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, background: PREMIUM_TIERS.moderate.bg, color: PREMIUM_TIERS.moderate.color, padding: '2px 6px', borderRadius: '4px' }}>
                +${PREMIUM_TIERS.moderate.bonusAmount.toFixed(2)} Bonus
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                ⏱️ Expedited
              </span>
            </div>
          </div>
        </div>

        {/* Low Tier Card */}
        <div
          onClick={() => setSelectedTier('low')}
          style={{
            background: selectedTier === 'low' ? PREMIUM_TIERS.low.bg : 'var(--bg-surface)',
            border: selectedTier === 'low' ? `2px solid ${PREMIUM_TIERS.low.color}` : '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: PREMIUM_TIERS.low.color }}>
              {PREMIUM_TIERS.low.badgeText}
            </span>
            <Clock size={16} color={PREMIUM_TIERS.low.color} />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: PREMIUM_TIERS.low.color }}>
              {data.tierCounts.low || 0}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, background: PREMIUM_TIERS.low.bg, color: PREMIUM_TIERS.low.color, padding: '2px 6px', borderRadius: '4px' }}>
                +${PREMIUM_TIERS.low.bonusAmount.toFixed(2)} Bonus
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                📅 Standard
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Card: Controls & Table */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: '20px',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Controls Toolbar */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Search Input */}
            <div style={{
              position: 'relative',
              flex: '1 1 300px',
              maxWidth: '450px'
            }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                placeholder="Search Reddit username (u/...), worker name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Subreddit Filter & Sorting */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={selectedSubreddit}
                onChange={(e) => setSelectedSubreddit(e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Subreddits</option>
                {data.allSubredditTags.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="posts">Sort: Most Approved Posts</option>
                <option value="karma">Sort: Highest Karma</option>
                <option value="earnings">Sort: Highest Earnings</option>
                <option value="recent">Sort: Recent Activity</option>
                <option value="username">Sort: Reddit Username</option>
              </select>

              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Toggle Sort Order"
              >
                <ArrowUpDown size={14} />
                {sortOrder.toUpperCase()}
              </button>
            </div>
          </div>

          {/* Tier Filter Pills */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginRight: '4px' }}>
              Tier Filter:
            </span>
            {(['all', 'elite', 'high', 'moderate', 'low', 'none'] as const).map((tierKey) => {
              const isSelected = selectedTier === tierKey;
              const conf = tierKey === 'all'
                ? { label: 'All Tiers', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' }
                : PREMIUM_TIERS[tierKey];

              return (
                <button
                  key={tierKey}
                  type="button"
                  onClick={() => setSelectedTier(tierKey)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: isSelected ? `1.5px solid ${conf.color}` : '1px solid var(--border-subtle)',
                    background: isSelected ? conf.bg : 'var(--bg-elevated)',
                    color: isSelected ? conf.color : 'var(--text-secondary)'
                  }}
                >
                  {conf.label}
                  {tierKey !== 'all' && (
                    <span style={{ marginLeft: '6px', opacity: 0.75 }}>
                      ({data.tierCounts[tierKey] || 0})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bulk Selection Action Bar */}
          {selectedAccountIds.length > 0 && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1.5px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={16} color="#3b82f6" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedAccountIds.length} {selectedAccountIds.length === 1 ? 'account' : 'accounts'} selected
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Assign in bulk:
                </span>
                <button
                  onClick={() => handleBulkTagChange('elite')}
                  disabled={isBulkUpdating}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: PREMIUM_TIERS.elite.bg,
                    border: `1px solid ${PREMIUM_TIERS.elite.border}`,
                    color: PREMIUM_TIERS.elite.color,
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {PREMIUM_TIERS.elite.badgeText}
                </button>
                <button
                  onClick={() => handleBulkTagChange('high')}
                  disabled={isBulkUpdating}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: PREMIUM_TIERS.high.bg,
                    border: `1px solid ${PREMIUM_TIERS.high.border}`,
                    color: PREMIUM_TIERS.high.color,
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {PREMIUM_TIERS.high.badgeText}
                </button>
                <button
                  onClick={() => handleBulkTagChange('moderate')}
                  disabled={isBulkUpdating}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: PREMIUM_TIERS.moderate.bg,
                    border: `1px solid ${PREMIUM_TIERS.moderate.border}`,
                    color: PREMIUM_TIERS.moderate.color,
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {PREMIUM_TIERS.moderate.badgeText}
                </button>
                <button
                  onClick={() => handleBulkTagChange('low')}
                  disabled={isBulkUpdating}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: PREMIUM_TIERS.low.bg,
                    border: `1px solid ${PREMIUM_TIERS.low.border}`,
                    color: PREMIUM_TIERS.low.color,
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {PREMIUM_TIERS.low.badgeText}
                </button>
                <button
                  onClick={() => handleBulkTagChange('none')}
                  disabled={isBulkUpdating}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Remove Tag
                </button>
                <button
                  onClick={() => setSelectedAccountIds([])}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table View */}
        {filteredAccounts.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Sparkles size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              No Accounts Match Your Filter
            </h3>
            <p style={{ fontSize: '13px', margin: 0 }}>
              Try adjusting your search query, tier filter, or subreddit selection.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'var(--bg-elevated)',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <th style={{ padding: '14px 16px', width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={
                        filteredAccounts.length > 0 &&
                        selectedAccountIds.length === filteredAccounts.length
                      }
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '14px 16px', minWidth: '220px' }}>Reddit Account</th>
                  <th style={{ padding: '14px 16px', minWidth: '180px' }}>Worker / Owner</th>
                  <th style={{ padding: '14px 16px', minWidth: '170px' }}>Assigned Subreddit(s)</th>
                  <th style={{ padding: '14px 16px', width: '130px', textAlign: 'center' }}>Approved Posts</th>
                  <th style={{ padding: '14px 16px', width: '130px', textAlign: 'center' }}>Total Earned</th>
                  <th style={{ padding: '14px 16px', width: '190px' }}>Premium Tag</th>
                  <th style={{ padding: '14px 16px', width: '60px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => {
                  const isSelected = selectedAccountIds.includes(account.id);
                  const tier = account.premium_tag;
                  const tierConf = PREMIUM_TIERS[tier];
                  const isUpdating = updatingId === account.id;

                  return (
                    <tr
                      key={account.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'var(--bg-elevated)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(account.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>

                      {/* Reddit Account */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'rgba(255, 69, 0, 0.12)',
                            color: '#ff4500',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '15px',
                            flexShrink: 0
                          }}>
                            r/
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                {account.reddit_username}
                              </span>
                              {account.reddit_profile_link && (
                                <a
                                  href={account.reddit_profile_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--text-muted)', display: 'inline-flex' }}
                                  title="Open Reddit Profile"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                {typeof account.reddit_karma === 'number' ? `${account.reddit_karma.toLocaleString()} Karma` : 'No Karma data'}
                              </span>
                              {account.status === 'verified' && (
                                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
                                  ✓ Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Worker / Owner */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {account.user_name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
                          {account.user_email}
                        </div>
                      </td>

                      {/* Assigned Subreddit(s) */}
                      <td style={{ padding: '14px 16px' }}>
                        {account.assigned_tags && account.assigned_tags.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {account.assigned_tags.map((t) => (
                              <span
                                key={t.id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  background: 'rgba(59, 130, 246, 0.1)',
                                  color: '#3b82f6',
                                  border: '1px solid rgba(59, 130, 246, 0.25)'
                                }}
                              >
                                <Tag size={10} /> {t.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            None Assigned
                          </span>
                        )}
                      </td>

                      {/* Approved Posts */}
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {account.approved_posts}
                      </td>

                      {/* Total Earned */}
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#10b981' }}>
                        ${account.total_earned.toFixed(2)}
                      </td>

                      {/* Premium Tag Quick Selector */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <select
                            value={account.premium_tag}
                            disabled={isUpdating}
                            onChange={(e) => handleQuickTagChange(account, e.target.value as PremiumTierKey)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '8px',
                              border: `1.5px solid ${tierConf.border}`,
                              background: tierConf.bg,
                              color: tierConf.color,
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: isUpdating ? 'not-allowed' : 'pointer',
                              outline: 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <option value="elite">💎 Elite Tier</option>
                            <option value="high">🟢 High Tier</option>
                            <option value="moderate">🔵 Moderate Tier</option>
                            <option value="low">🟡 Low Tier</option>
                            <option value="none">⚪ Untagged</option>
                          </select>
                        </div>
                      </td>

                      {/* Actions: 3 Dots Menu */}
                      <td style={{ padding: '14px 16px', textAlign: 'center', position: 'relative' }}>
                        <div className="premium-row-menu-container" style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === account.id ? null : account.id)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: activeMenuId === account.id ? '1.5px solid #3b82f6' : '1px solid var(--border-subtle)',
                              background: activeMenuId === account.id ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-elevated)',
                              color: activeMenuId === account.id ? '#3b82f6' : 'var(--text-secondary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title="More options & details"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {/* 3-Dots Dropdown Popover */}
                          {activeMenuId === account.id && (
                            <div style={{
                              position: 'absolute',
                              right: 0,
                              top: 'calc(100% + 6px)',
                              width: '260px',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-medium)',
                              borderRadius: '14px',
                              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
                              zIndex: 100,
                              padding: '12px',
                              textAlign: 'left'
                            }}>
                              {/* Header info */}
                              <div style={{
                                paddingBottom: '10px',
                                marginBottom: '10px',
                                borderBottom: '1px solid var(--border-subtle)'
                              }}>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {account.reddit_username}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  {account.user_name}
                                </div>
                              </div>

                              {/* 1. Extra Bonus Rate (Consisted here) */}
                              <div style={{
                                background: 'var(--bg-elevated)',
                                borderRadius: '10px',
                                padding: '10px 12px',
                                marginBottom: '8px',
                                border: '1px solid var(--border-subtle)'
                              }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                                  Extra Task Bonus
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    color: tier !== 'none' ? tierConf.color : 'var(--text-secondary)'
                                  }}>
                                    {tier !== 'none'
                                      ? `+$${(account.custom_bonus_rate ?? tierConf.bonusAmount).toFixed(2)} / Task`
                                      : '$0.00 (Standard)'}
                                  </span>
                                  {account.custom_bonus_rate && (
                                    <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                      Custom
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* 2. Payout Speed (Consisted here) */}
                              <div style={{
                                background: 'var(--bg-elevated)',
                                borderRadius: '10px',
                                padding: '10px 12px',
                                marginBottom: '10px',
                                border: '1px solid var(--border-subtle)'
                              }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                                  Payout Processing Speed
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: tier !== 'none' ? tierConf.color : 'var(--text-muted)' }}>
                                  <Clock size={12} />
                                  {tierConf.payoutSpeed}
                                </div>
                              </div>

                              {/* Action Items */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    openModal(account);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    fontSize: '12.5px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.1s ease'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <Sliders size={14} style={{ color: '#3b82f6' }} />
                                  <span>Configure Tier & Bonus</span>
                                </button>

                                {account.reddit_profile_link && (
                                  <a
                                    href={account.reddit_profile_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setActiveMenuId(null)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      width: '100%',
                                      padding: '8px 10px',
                                      borderRadius: '8px',
                                      color: 'var(--text-primary)',
                                      fontSize: '12.5px',
                                      fontWeight: 600,
                                      textDecoration: 'none',
                                      transition: 'all 0.1s ease'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                  >
                                    <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
                                    <span>View Reddit Profile</span>
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(account.reddit_username);
                                    showToast(`Copied ${account.reddit_username} to clipboard!`);
                                    setActiveMenuId(null);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    fontSize: '12.5px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.1s ease'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <Copy size={14} />
                                  <span>Copy Username</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Edit Modal */}
      {modalAccount && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: '24px',
            border: '1px solid var(--border-subtle)',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Configure Premium Tag: {modalAccount.reddit_username}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Owner: {modalAccount.user_name} ({modalAccount.user_email})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalAccount(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Account Quick Stats Box */}
              <div style={{
                background: 'var(--bg-elevated)',
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                textAlign: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Reddit Karma</span>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {typeof modalAccount.reddit_karma === 'number' ? modalAccount.reddit_karma.toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Approved Posts</span>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                    {modalAccount.approved_posts}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Earnings</span>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>
                    ${modalAccount.total_earned.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Tier Cards Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Select Premium Tag Tier:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(['elite', 'high', 'moderate', 'low', 'none'] as const).map((tKey) => {
                    const conf = PREMIUM_TIERS[tKey];
                    const isSelected = modalTier === tKey;

                    return (
                      <div
                        key={tKey}
                        onClick={() => setModalTier(tKey)}
                        style={{
                          borderRadius: '14px',
                          border: isSelected ? `2px solid ${conf.color}` : '1px solid var(--border-subtle)',
                          background: isSelected ? conf.bg : 'var(--bg-card)',
                          padding: '14px 18px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? conf.color : 'var(--border-medium)'}`,
                            background: isSelected ? conf.color : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isSelected && <Check size={12} color="#ffffff" />}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 800, color: conf.color }}>
                                {conf.label}
                              </span>
                              {tKey !== 'none' && (
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  background: 'var(--bg-elevated)',
                                  color: conf.color,
                                  padding: '2px 6px',
                                  borderRadius: '4px'
                                }}>
                                  +${conf.bonusAmount.toFixed(2)} / Task
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0', lineHeight: 1.4 }}>
                              {conf.description}
                            </p>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'var(--bg-elevated)',
                            color: conf.color,
                            border: '1px solid var(--border-subtle)'
                          }}>
                            {conf.payoutSpeed}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Bonus Rate Override */}
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: '14px',
                border: '1px solid var(--border-subtle)',
                padding: '14px 18px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Custom Bonus Rate Override (Optional):
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Leave blank to use tier default
                  </span>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    $
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    placeholder={modalTier !== 'none' ? PREMIUM_TIERS[modalTier].bonusAmount.toFixed(2) : '0.00'}
                    value={modalCustomBonus}
                    onChange={(e) => setModalCustomBonus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 24px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => setModalAccount(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={isSavingTag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isSavingTag ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)'
                }}
              >
                {isSavingTag ? <RefreshCw size={14} className="animate-spin" /> : <Check size={15} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

