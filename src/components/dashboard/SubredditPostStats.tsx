'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ExternalLink, Filter, Download, RefreshCw, ChevronDown, ChevronRight,
  TrendingUp, Users, FileText, CheckCircle2, Clock, XCircle, DollarSign,
  Layers, ArrowUpDown, ShieldCheck, Sparkles, AlertCircle, Eye, CornerDownRight,
  Image as ImageIcon, Tag, Plus, Check, X, Loader2
} from 'lucide-react';
import {
  SubredditPostStatsResponse,
  SubredditAggregatedStat,
  SubredditAccountStat,
  SubredditPostClaim,
  getSubredditPostStats,
  updateAccountTags,
  createSubredditTag
} from '@/actions/subreddit-posts';

interface Props {
  initialData: SubredditPostStatsResponse;
}

export default function SubredditPostStats({ initialData }: Props) {
  const [data, setData] = useState<SubredditPostStatsResponse>(initialData);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [selectedSubreddit, setSelectedSubreddit] = useState<string>('all');
  const [searchSubreddit, setSearchSubreddit] = useState<string>('');
  const [accountQuery, setAccountQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'submitted' | 'rejected'>('all');
  const [taskTypeFilter, setTaskTypeFilter] = useState<'post' | 'all' | 'comment' | 'crosspost'>('post');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [sortBy, setSortBy] = useState<'posts' | 'approved' | 'recent' | 'earnings' | 'name'>('posts');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'account' | 'subreddit' | 'feed'>('account');

  // Expanded state for account post drawer
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});

  // Tag editing modal state
  const [tagModalAccount, setTagModalAccount] = useState<{
    reddit_account_id: string;
    reddit_username: string;
    user_name: string;
    user_email: string;
    assigned_tags?: { id: string; name: string }[];
  } | null>(null);
  const [customAccountTags, setCustomAccountTags] = useState<Record<string, { id: string; name: string }[]>>({});
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [isSavingTags, setIsSavingTags] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleOpenTagModal = (acc: {
    reddit_account_id: string;
    reddit_username: string;
    user_name: string;
    user_email: string;
    assigned_tags?: { id: string; name: string }[];
  }) => {
    setTagModalAccount(acc);
    const existing = customAccountTags[acc.reddit_account_id] || acc.assigned_tags || [];
    setSelectedTagIds(existing.map(t => t.id));
    setTagSearch('');
    setNewTagName('');
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateNewTag = async () => {
    const clean = newTagName.replace(/^r\//i, '').trim();
    if (!clean) return;

    setIsCreatingTag(true);
    const res = await createSubredditTag(clean);
    if ('error' in res && res.error) {
      showToast(res.error, 'error');
    } else if ('subreddit' in res && res.subreddit) {
      const created = res.subreddit;
      setData(prev => {
        const exists = prev.allKnownSubreddits.some(s => s.id === created.id);
        if (exists) return prev;
        return {
          ...prev,
          allKnownSubreddits: [...prev.allKnownSubreddits, { id: created.id, name: created.name }]
        };
      });
      if (!selectedTagIds.includes(created.id)) {
        setSelectedTagIds(prev => [...prev, created.id]);
      }
      setNewTagName('');
      showToast(`Created tag r/${created.name}`);
    } else {
      showToast('Failed to create tag', 'error');
    }
    setIsCreatingTag(false);
  };

  const handleSaveTags = async () => {
    if (!tagModalAccount) return;
    setIsSavingTags(true);

    const res = await updateAccountTags(tagModalAccount.reddit_account_id, selectedTagIds);
    if (res?.error) {
      showToast(`Failed to update tags: ${res.error}`, 'error');
      setIsSavingTags(false);
      return;
    }

    const newAssignedTags = selectedTagIds.map(id => {
      const found = data.allKnownSubreddits.find(k => k.id === id);
      return { id, name: found?.name || id };
    });

    setCustomAccountTags(prev => ({
      ...prev,
      [tagModalAccount.reddit_account_id]: newAssignedTags
    }));

    // Update local state in data so the changes reflect instantly across all views
    setData(prev => {
      const updatedSubreddits = prev.aggregatedSubreddits.map(sub => ({
        ...sub,
        accounts: sub.accounts.map(acc => {
          if (acc.reddit_account_id === tagModalAccount.reddit_account_id) {
            return {
              ...acc,
              assigned_tags: newAssignedTags
            };
          }
          return acc;
        })
      }));

      return {
        ...prev,
        aggregatedSubreddits: updatedSubreddits
      };
    });

    showToast(`Updated tags for u/${tagModalAccount.reddit_username}`);
    setIsSavingTags(false);
    setTagModalAccount(null);
  };

  const toggleAccountExpand = (key: string) => {
    setExpandedAccounts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRefresh = () => {
    startTransition(async () => {
      const refreshed = await getSubredditPostStats();
      setData(refreshed);
    });
  };

  // Reddit Nav Icon
  const RedditIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#ff4500" style={{ display: 'inline-block', flexShrink: 0 }}>
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );

  // Filter individual claims according to current filters
  const filteredClaims = useMemo(() => {
    return data.allClaims.filter((claim) => {
      // Subreddit Filter
      if (selectedSubreddit !== 'all') {
        if (claim.effective_subreddit.toLowerCase() !== selectedSubreddit.toLowerCase()) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter !== 'all' && claim.status !== statusFilter) {
        return false;
      }

      // Task Type Filter
      if (taskTypeFilter === 'post') {
        if (claim.task_type !== 'post' && claim.task_type !== 'crosspost') return false;
      } else if (taskTypeFilter !== 'all') {
        if (claim.task_type !== taskTypeFilter) return false;
      }

      // Account Query (username or user email/name)
      if (accountQuery.trim()) {
        const q = accountQuery.trim().toLowerCase();
        const matchesUsername = claim.reddit_username.toLowerCase().includes(q);
        const matchesEmail = claim.user_email.toLowerCase().includes(q);
        const matchesName = claim.user_name.toLowerCase().includes(q);
        if (!matchesUsername && !matchesEmail && !matchesName) return false;
      }

      // Date Filter
      if (dateFilter !== 'all') {
        const postTime = new Date(claim.submitted_at || claim.claimed_at).getTime();
        const now = Date.now();
        if (dateFilter === 'today' && now - postTime > 24 * 60 * 60 * 1000) return false;
        if (dateFilter === '7d' && now - postTime > 7 * 24 * 60 * 60 * 1000) return false;
        if (dateFilter === '30d' && now - postTime > 30 * 24 * 60 * 60 * 1000) return false;
      }

      return true;
    });
  }, [data.allClaims, selectedSubreddit, statusFilter, taskTypeFilter, accountQuery, dateFilter]);

  // Global map of account tags from data
  const accountTagsGlobalMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string }[]>();
    data.aggregatedSubreddits.forEach(sub => {
      sub.accounts.forEach(acc => {
        if (acc.reddit_account_id && acc.assigned_tags) {
          map.set(acc.reddit_account_id, acc.assigned_tags);
        }
      });
    });
    Object.entries(customAccountTags).forEach(([accId, tags]) => {
      map.set(accId, tags);
    });
    return map;
  }, [data.aggregatedSubreddits, customAccountTags]);

  // Re-aggregate filtered claims by Subreddit -> Reddit Account
  const filteredSubredditStats = useMemo(() => {
    const map = new Map<string, Map<string, SubredditAccountStat>>();

    for (const claim of filteredClaims) {
      const sub = claim.effective_subreddit;
      if (!map.has(sub)) {
        map.set(sub, new Map());
      }
      const accMap = map.get(sub)!;
      const accKey = claim.reddit_account_id || claim.reddit_username;

      if (!accMap.has(accKey)) {
        const assigned = accountTagsGlobalMap.get(claim.reddit_account_id || '') || [];

        accMap.set(accKey, {
          reddit_account_id: claim.reddit_account_id || accKey,
          reddit_username: claim.reddit_username,
          reddit_profile_link: claim.reddit_profile_link,
          reddit_karma: claim.reddit_karma,
          reddit_account_status: claim.reddit_account_status,
          user_id: claim.user_id,
          user_name: claim.user_name,
          user_email: claim.user_email,
          total_posts: 0,
          approved_posts: 0,
          submitted_posts: 0,
          rejected_posts: 0,
          total_earned: 0,
          last_post_date: null,
          assigned_tags: assigned,
          claims: [],
        });
      }

      const accStat = accMap.get(accKey)!;
      accStat.total_posts += 1;
      if (claim.status === 'approved') {
        accStat.approved_posts += 1;
        accStat.total_earned += claim.payment_amount + claim.bonus_amount;
      } else if (claim.status === 'submitted') {
        accStat.submitted_posts += 1;
      } else if (claim.status === 'rejected') {
        accStat.rejected_posts += 1;
      }

      const postDate = claim.submitted_at || claim.claimed_at;
      if (postDate) {
        if (!accStat.last_post_date || new Date(postDate) > new Date(accStat.last_post_date)) {
          accStat.last_post_date = postDate;
        }
      }

      accStat.claims.push(claim);
    }

    const list: SubredditAggregatedStat[] = [];
    for (const [subName, accMap] of map.entries()) {
      const accounts = Array.from(accMap.values());

      // Sort accounts inside each subreddit
      accounts.sort((a, b) => {
        let diff = 0;
        if (sortBy === 'posts') diff = b.total_posts - a.total_posts;
        else if (sortBy === 'approved') diff = b.approved_posts - a.approved_posts;
        else if (sortBy === 'earnings') diff = b.total_earned - a.total_earned;
        else if (sortBy === 'recent') {
          const tA = a.last_post_date ? new Date(a.last_post_date).getTime() : 0;
          const tB = b.last_post_date ? new Date(b.last_post_date).getTime() : 0;
          diff = tB - tA;
        } else if (sortBy === 'name') {
          diff = a.reddit_username.localeCompare(b.reddit_username);
        }
        return sortOrder === 'desc' ? diff : -diff;
      });

      const totalPosts = accounts.reduce((acc, curr) => acc + curr.total_posts, 0);
      const approvedPosts = accounts.reduce((acc, curr) => acc + curr.approved_posts, 0);
      const submittedPosts = accounts.reduce((acc, curr) => acc + curr.submitted_posts, 0);
      const rejectedPosts = accounts.reduce((acc, curr) => acc + curr.rejected_posts, 0);

      list.push({
        subreddit_name: subName,
        is_custom_tag: data.allKnownSubreddits.some(k => k.name.toLowerCase() === subName.toLowerCase()),
        total_posts: totalPosts,
        approved_posts: approvedPosts,
        submitted_posts: submittedPosts,
        rejected_posts: rejectedPosts,
        unique_accounts_count: accounts.length,
        accounts,
      });
    }

    // Sort subreddits list
    list.sort((a, b) => {
      let diff = b.total_posts - a.total_posts;
      if (sortBy === 'name') {
        diff = a.subreddit_name.localeCompare(b.subreddit_name);
      }
      return sortOrder === 'desc' ? diff : -diff;
    });

    return list;
  }, [filteredClaims, data.allKnownSubreddits, sortBy, sortOrder]);

  // Re-aggregate filtered claims by Reddit Account -> Subreddits & All Posts
  const filteredAccountStats = useMemo(() => {
    const map = new Map<string, {
      reddit_account_id: string;
      reddit_username: string;
      reddit_profile_link: string | null;
      reddit_karma: number | null;
      reddit_account_status: string | null;
      user_name: string;
      user_email: string;
      total_posts: number;
      approved_posts: number;
      submitted_posts: number;
      rejected_posts: number;
      total_earned: number;
      last_post_date: string | null;
      user_id: string;
      assigned_tags: { id: string; name: string }[];
      all_claims: SubredditPostClaim[];
      subreddits: {
        subreddit_name: string;
        total_posts: number;
        approved_posts: number;
        submitted_posts: number;
        rejected_posts: number;
        claims: SubredditPostClaim[];
      }[];
    }>();

    // 1. Seed with all known registered Reddit accounts
    for (const acc of (data.allAccounts || [])) {
      const assigned = customAccountTags[acc.reddit_account_id] || accountTagsGlobalMap.get(acc.reddit_account_id) || acc.assigned_tags || [];
      map.set(acc.reddit_account_id, {
        reddit_account_id: acc.reddit_account_id,
        reddit_username: acc.reddit_username,
        reddit_profile_link: acc.reddit_profile_link,
        reddit_karma: acc.reddit_karma,
        reddit_account_status: acc.reddit_account_status,
        user_id: acc.user_id,
        user_name: acc.user_name,
        user_email: acc.user_email,
        total_posts: 0,
        approved_posts: 0,
        submitted_posts: 0,
        rejected_posts: 0,
        total_earned: 0,
        last_post_date: null,
        assigned_tags: assigned,
        all_claims: [],
        subreddits: [],
      });
    }

    // 2. Attach filtered claims to corresponding account
    for (const claim of filteredClaims) {
      const accKey = claim.reddit_account_id || claim.reddit_username;
      if (!map.has(accKey)) {
        map.set(accKey, {
          reddit_account_id: claim.reddit_account_id || accKey,
          reddit_username: claim.reddit_username,
          reddit_profile_link: claim.reddit_profile_link,
          reddit_karma: claim.reddit_karma,
          reddit_account_status: claim.reddit_account_status,
          user_id: claim.user_id,
          user_name: claim.user_name,
          user_email: claim.user_email,
          total_posts: 0,
          approved_posts: 0,
          submitted_posts: 0,
          rejected_posts: 0,
          total_earned: 0,
          last_post_date: null,
          assigned_tags: customAccountTags[claim.reddit_account_id || ''] || accountTagsGlobalMap.get(claim.reddit_account_id || '') || [],
          all_claims: [],
          subreddits: [],
        });
      }

      const accEntry = map.get(accKey)!;
      accEntry.total_posts += 1;
      if (claim.status === 'approved') {
        accEntry.approved_posts += 1;
        accEntry.total_earned += claim.payment_amount + claim.bonus_amount;
      } else if (claim.status === 'submitted') {
        accEntry.submitted_posts += 1;
      } else if (claim.status === 'rejected') {
        accEntry.rejected_posts += 1;
      }

      const postDate = claim.submitted_at || claim.claimed_at;
      if (postDate) {
        if (!accEntry.last_post_date || new Date(postDate) > new Date(accEntry.last_post_date)) {
          accEntry.last_post_date = postDate;
        }
      }

      accEntry.all_claims.push(claim);

      let subObj = accEntry.subreddits.find(s => s.subreddit_name === claim.effective_subreddit);
      if (!subObj) {
        subObj = {
          subreddit_name: claim.effective_subreddit,
          total_posts: 0,
          approved_posts: 0,
          submitted_posts: 0,
          rejected_posts: 0,
          claims: [],
        };
        accEntry.subreddits.push(subObj);
      }

      subObj.total_posts += 1;
      if (claim.status === 'approved') subObj.approved_posts += 1;
      else if (claim.status === 'submitted') subObj.submitted_posts += 1;
      else if (claim.status === 'rejected') subObj.rejected_posts += 1;
      subObj.claims.push(claim);
    }

    let list = Array.from(map.values());

    // Search filter: worker name, worker email, or reddit username
    if (accountQuery.trim()) {
      const q = accountQuery.trim().toLowerCase();
      list = list.filter(acc => 
        acc.reddit_username.toLowerCase().includes(q) ||
        acc.user_name.toLowerCase().includes(q) ||
        acc.user_email.toLowerCase().includes(q)
      );
    }

    // Subreddit filter: if a specific subreddit is selected, only show accounts with posts in that subreddit
    if (selectedSubreddit !== 'all') {
      list = list.filter(acc => acc.subreddits.some(s => s.subreddit_name.toLowerCase() === selectedSubreddit.toLowerCase()));
    }

    for (const item of list) {
      item.subreddits.sort((a, b) => b.total_posts - a.total_posts);
      item.all_claims.sort((a, b) => {
        const tA = a.submitted_at || a.claimed_at ? new Date(a.submitted_at || a.claimed_at).getTime() : 0;
        const tB = b.submitted_at || b.claimed_at ? new Date(b.submitted_at || b.claimed_at).getTime() : 0;
        return tB - tA;
      });
    }

    list.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'posts') diff = b.total_posts - a.total_posts;
      else if (sortBy === 'approved') diff = b.approved_posts - a.approved_posts;
      else if (sortBy === 'earnings') diff = b.total_earned - a.total_earned;
      else if (sortBy === 'name') diff = a.reddit_username.localeCompare(b.reddit_username);
      else if (sortBy === 'recent') {
        const tA = a.last_post_date ? new Date(a.last_post_date).getTime() : 0;
        const tB = b.last_post_date ? new Date(b.last_post_date).getTime() : 0;
        diff = tB - tA;
      }
      return sortOrder === 'desc' ? diff : -diff;
    });

    return list;
  }, [data.allAccounts, filteredClaims, accountTagsGlobalMap, customAccountTags, accountQuery, selectedSubreddit, sortBy, sortOrder]);

  // List of all unique subreddits with total post count for quick chips
  const subredditChips = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of data.allClaims) {
      counts[c.effective_subreddit] = (counts[c.effective_subreddit] || 0) + 1;
    }

    // Combine with known subreddits so all registered tags appear
    for (const k of data.allKnownSubreddits) {
      if (!counts[k.name]) counts[k.name] = 0;
    }

    return Object.entries(counts)
      .filter(([sub]) => {
        if (!searchSubreddit.trim()) return true;
        return sub.toLowerCase().includes(searchSubreddit.trim().toLowerCase());
      })
      .sort((a, b) => b[1] - a[1]);
  }, [data.allClaims, data.allKnownSubreddits, searchSubreddit]);

  // Export to CSV
  const exportToCsv = () => {
    const rows = [
      ['Subreddit', 'Reddit Username', 'Reddit Profile URL', 'Worker Name', 'Worker Email', 'Task Title', 'Task Type', 'Claim Status', 'Reddit Post URL', 'Submitted Date', 'Payment ($)']
    ];

    for (const c of filteredClaims) {
      rows.push([
        `r/${c.effective_subreddit}`,
        `u/${c.reddit_username}`,
        c.reddit_profile_link || '',
        c.user_name,
        c.user_email,
        `"${(c.task_title || '').replace(/"/g, '""')}"`,
        c.task_type,
        c.status,
        c.reddit_url || '',
        c.submitted_at || c.claimed_at || '',
        (c.payment_amount + c.bonus_amount).toFixed(2)
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reddit_subreddit_posts_${selectedSubreddit}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner / Header Actions */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '24px',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(255, 69, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 69, 0, 0.3)'
          }}>
            <RedditIcon size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              Subreddit Post Tracker
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '999px',
                background: 'rgba(255,69,0,0.15)',
                color: '#ff4500',
                border: '1px solid rgba(255,69,0,0.3)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                Reddit Analytics
              </span>
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Inspect which Reddit account made how many posts on each specific subreddit.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={exportToCsv}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-medium)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Download CSV export"
          >
            <Download size={14} />
            Export CSV
          </button>

          <button
            onClick={handleRefresh}
            disabled={isPending}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 69, 0, 0.12)',
              color: '#ff4500',
              border: '1px solid rgba(255, 69, 0, 0.3)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isPending ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={14} className={isPending ? 'animate-spin' : ''} />
            {isPending ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Subreddits Tracked */}
        <div style={{
          padding: '18px',
          background: 'var(--bg-card)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Subreddits Active</span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <Layers size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {data.totalStats.uniqueSubreddits}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Across {data.allKnownSubreddits.length} configured tags
          </span>
        </div>

        {/* Card 2: Unique Reddit Accounts */}
        <div style={{
          padding: '18px',
          background: 'var(--bg-card)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Reddit Accounts</span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {data.totalStats.uniqueRedditAccounts}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Active posters in tracked subreddits
          </span>
        </div>

        {/* Card 3: Total Posts */}
        <div style={{
          padding: '18px',
          background: 'var(--bg-card)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Submissions</span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255, 69, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4500' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {data.totalStats.totalPosts}
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>{data.totalStats.approvedPosts} Approved</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>{data.totalStats.submittedPosts} Pending</span>
          </div>
        </div>

        {/* Card 4: Total Money Given */}
        <div style={{
          padding: '18px',
          background: 'var(--bg-card)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Paid Out</span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#10b981' }}>
            ${data.totalStats.totalEarnings.toFixed(2)}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Paid to workers for approved Reddit tasks
          </span>
        </div>
      </div>

      {/* Subreddit Quick-Selector & Filter Bar */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Row 1: Search Subreddit & Quick Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RedditIcon size={16} />
              Filter by Subreddit
            </div>
            
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Find subreddit..."
                value={searchSubreddit}
                onChange={(e) => setSearchSubreddit(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  borderRadius: '8px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Subreddit Horizontal Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}>
            <button
              onClick={() => setSelectedSubreddit('all')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: selectedSubreddit === 'all' ? 700 : 500,
                background: selectedSubreddit === 'all' ? '#ff4500' : 'var(--bg-elevated)',
                color: selectedSubreddit === 'all' ? '#ffffff' : 'var(--text-secondary)',
                border: selectedSubreddit === 'all' ? '1px solid #ff4500' : '1px solid var(--border-medium)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              🌐 All Subreddits
              <span style={{
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '999px',
                background: selectedSubreddit === 'all' ? 'rgba(255,255,255,0.25)' : 'var(--bg-card)',
                color: selectedSubreddit === 'all' ? '#ffffff' : 'var(--text-muted)'
              }}>
                {data.totalStats.totalPosts}
              </span>
            </button>

            {subredditChips.slice(0, 20).map(([sub, count]) => {
              const isSelected = selectedSubreddit.toLowerCase() === sub.toLowerCase();
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubreddit(sub)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    background: isSelected ? '#ff4500' : 'var(--bg-elevated)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    border: isSelected ? '1px solid #ff4500' : '1px solid var(--border-medium)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  r/{sub}
                  <span style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    borderRadius: '999px',
                    background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-card)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)'
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Secondary Controls (Search account, status, type, view mode) */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          paddingTop: '14px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          {/* Account search */}
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search Reddit user (u/)..."
              value={accountQuery}
              onChange={(e) => setAccountQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '8px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>

          {/* Filters: Task Type, Status, Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Task Type Filter */}
            <select
              value={taskTypeFilter}
              onChange={(e) => setTaskTypeFilter(e.target.value as any)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <option value="post">Type: Posts & Crossposts</option>
              <option value="all">Type: All Task Types</option>
              <option value="comment">Type: Comments Only</option>
              <option value="crosspost">Type: Crossposts Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <option value="all">Status: All Statuses</option>
              <option value="approved">Status: Approved Only</option>
              <option value="submitted">Status: Pending Review</option>
              <option value="rejected">Status: Rejected</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <option value="all">Date: All Time</option>
              <option value="today">Date: Past 24 Hours</option>
              <option value="7d">Date: Past 7 Days</option>
              <option value="30d">Date: Past 30 Days</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <option value="posts">Sort: Most Posts</option>
              <option value="approved">Sort: Most Approved</option>
              <option value="recent">Sort: Most Recent</option>
              <option value="earnings">Sort: Highest Earnings</option>
              <option value="name">Sort: Username (A-Z)</option>
            </select>

            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Toggle sort direction"
            >
              <ArrowUpDown size={12} />
              {sortOrder.toUpperCase()}
            </button>
          </div>

          {/* View Mode Toggle Buttons */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-elevated)',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid var(--border-medium)'
          }}>
            <button
              onClick={() => setViewMode('account')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                background: viewMode === 'account' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'account' ? '#ff4500' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Users size={13} />
              All Users & Posts
            </button>
            <button
              onClick={() => setViewMode('subreddit')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                background: viewMode === 'subreddit' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'subreddit' ? '#ff4500' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Layers size={13} />
              By Subreddit
            </button>
            <button
              onClick={() => setViewMode('feed')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                background: viewMode === 'feed' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'feed' ? '#ff4500' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FileText size={13} />
              Submissions Feed
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'subreddit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredSubredditStats.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)'
            }}>
              <AlertCircle size={36} style={{ margin: '0 auto 12px auto', opacity: 0.6 }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                No Reddit posts found matching criteria
              </h3>
              <p style={{ fontSize: '13px', margin: '6px 0 0 0' }}>
                Try clearing search terms or selecting another subreddit tag.
              </p>
            </div>
          ) : (
            filteredSubredditStats.map((subStat) => (
              <div
                key={subStat.subreddit_name}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
                }}
              >
                {/* Subreddit Header */}
                <div style={{
                  padding: '16px 20px',
                  background: 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'rgba(255,69,0,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ff4500'
                    }}>
                      <RedditIcon size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          r/{subStat.subreddit_name}
                        </span>
                        {subStat.subreddit_name !== 'Open / Unassigned' && (
                          <a
                            href={`https://reddit.com/r/${subStat.subreddit_name}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#ff4500', display: 'flex', alignItems: 'center' }}
                            title="Open subreddit in Reddit"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                        {subStat.is_custom_tag && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59, 130, 246, 0.3)'
                          }}>
                            Tag Configured
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {subStat.unique_accounts_count} Reddit {subStat.unique_accounts_count === 1 ? 'account' : 'accounts'} active on this subreddit
                      </span>
                    </div>
                  </div>

                  {/* Counters */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '12px'
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total Posts:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{subStat.total_posts}</strong>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      fontSize: '12px'
                    }}>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>{subStat.approved_posts} Approved</span>
                    </div>

                    {subStat.submitted_posts > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        fontSize: '12px'
                      }}>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>{subStat.submitted_posts} Pending</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Table of Accounts */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px 18px', fontWeight: 600 }}>Reddit Account</th>
                        <th style={{ padding: '12px 18px', fontWeight: 600 }}>Worker / Owner</th>
                        <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'center' }}>Total Posts</th>
                        <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'center' }}>Approved</th>
                        <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'center' }}>Pending</th>
                        <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'center' }}>Rejected</th>
                        <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Total Earned</th>
                        <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Last Activity</th>
                        <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subStat.accounts.map((acc) => {
                        const rowKey = `${subStat.subreddit_name}_${acc.reddit_account_id}`;
                        const isExpanded = Boolean(expandedAccounts[rowKey]);

                        return (
                          <React.Fragment key={rowKey}>
                            <tr
                              style={{
                                borderBottom: '1px solid var(--border-subtle)',
                                background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                                transition: 'background 0.15s'
                              }}
                            >
                              {/* Reddit Account */}
                              <td style={{ padding: '14px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,69,0,0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ff4500'
                                  }}>
                                    <RedditIcon size={14} />
                                  </div>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        u/{acc.reddit_username}
                                      </span>
                                      {acc.reddit_profile_link && (
                                        <a
                                          href={acc.reddit_profile_link}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{ color: '#ff4500', display: 'flex', alignItems: 'center' }}
                                          title="Open Reddit profile"
                                        >
                                          <ExternalLink size={12} />
                                        </a>
                                      )}
                                    </div>
                                    {acc.reddit_karma !== null && (
                                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        Karma: {acc.reddit_karma}
                                      </span>
                                    )}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '4px', maxWidth: '240px' }}>
                                      {acc.assigned_tags && acc.assigned_tags.length > 0 ? (
                                        <>
                                          {acc.assigned_tags.slice(0, 2).map((t) => (
                                            <span
                                              key={t.id}
                                              style={{
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                padding: '1px 5px',
                                                borderRadius: '4px',
                                                background: 'rgba(255, 69, 0, 0.1)',
                                                color: '#ff4500',
                                                border: '1px solid rgba(255, 69, 0, 0.25)'
                                              }}
                                            >
                                              r/{t.name}
                                            </span>
                                          ))}
                                          {acc.assigned_tags.length > 2 && (
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                              +{acc.assigned_tags.length - 2}
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                          No tags assigned
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Worker Details */}
                              <td style={{ padding: '14px 18px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                    {acc.user_name}
                                  </span>
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    {acc.user_email}
                                  </span>
                                </div>
                              </td>

                              {/* Total Posts */}
                              <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  borderRadius: '999px',
                                  background: 'rgba(255, 69, 0, 0.15)',
                                  color: '#ff4500',
                                  fontWeight: 700,
                                  fontSize: '13px'
                                }}>
                                  {acc.total_posts}
                                </span>
                              </td>

                              {/* Approved */}
                              <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                                <span style={{ color: acc.approved_posts > 0 ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                                  {acc.approved_posts}
                                </span>
                              </td>

                              {/* Pending */}
                              <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                                <span style={{ color: acc.submitted_posts > 0 ? '#f59e0b' : 'var(--text-muted)', fontWeight: 600 }}>
                                  {acc.submitted_posts}
                                </span>
                              </td>

                              {/* Rejected */}
                              <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                                <span style={{ color: acc.rejected_posts > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                                  {acc.rejected_posts}
                                </span>
                              </td>

                              {/* Total Earned */}
                              <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                                ${acc.total_earned.toFixed(2)}
                              </td>

                              {/* Last Activity */}
                              <td style={{ padding: '14px 18px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}>
                                {acc.last_post_date ? new Date(acc.last_post_date).toLocaleDateString() : 'N/A'}
                              </td>

                              {/* Actions: Change Tags & Expand Posts */}
                              <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                  <button
                                    onClick={() => handleOpenTagModal(acc)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '5px 9px',
                                      borderRadius: '6px',
                                      background: 'rgba(255, 69, 0, 0.1)',
                                      color: '#ff4500',
                                      border: '1px solid rgba(255, 69, 0, 0.3)',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                    title="Change assigned subreddit tags"
                                  >
                                    <Tag size={12} />
                                    <span>Tags ({acc.assigned_tags?.length || 0})</span>
                                  </button>

                                  <button
                                    onClick={() => toggleAccountExpand(rowKey)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '5px 9px',
                                      borderRadius: '6px',
                                      background: isExpanded ? 'rgba(255, 255, 255, 0.15)' : 'var(--bg-elevated)',
                                      color: isExpanded ? '#ffffff' : 'var(--text-primary)',
                                      border: '1px solid var(--border-medium)',
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                    <span>{acc.claims.length} {acc.claims.length === 1 ? 'Post' : 'Posts'}</span>
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Nested Expandable Post Details Drawer */}
                            {isExpanded && (
                              <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                                <td colSpan={9} style={{ padding: '14px 20px 20px 20px' }}>
                                  <div style={{
                                    background: 'var(--bg-elevated)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-medium)',
                                    padding: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        Posts by u/{acc.reddit_username} on r/{subStat.subreddit_name}
                                      </span>
                                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        Showing {acc.claims.length} total entries
                                      </span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {acc.claims.map((claim) => (
                                        <div
                                          key={claim.id}
                                          style={{
                                            padding: '12px 14px',
                                            borderRadius: '8px',
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-subtle)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            flexWrap: 'wrap',
                                            gap: '10px'
                                          }}
                                        >
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '60%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <span style={{
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                padding: '1px 6px',
                                                borderRadius: '4px',
                                                background: 'rgba(255,255,255,0.08)',
                                                color: 'var(--text-secondary)',
                                                textTransform: 'uppercase'
                                              }}>
                                                {claim.task_type}
                                              </span>
                                              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {claim.task_title}
                                              </span>
                                            </div>

                                            {claim.reddit_url && (
                                              <a
                                                href={claim.reddit_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                  fontSize: '12px',
                                                  color: '#ff4500',
                                                  textDecoration: 'none',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '4px',
                                                  wordBreak: 'break-all'
                                                }}
                                              >
                                                <ExternalLink size={11} />
                                                {claim.reddit_url}
                                              </a>
                                            )}

                                            {claim.admin_notes && (
                                              <span style={{ fontSize: '11px', color: '#ef4444' }}>
                                                Note: {claim.admin_notes}
                                              </span>
                                            )}
                                          </div>

                                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                              {claim.submitted_at ? new Date(claim.submitted_at).toLocaleString() : 'Claimed'}
                                            </span>

                                            <span style={{
                                              fontSize: '11px',
                                              fontWeight: 600,
                                              padding: '3px 8px',
                                              borderRadius: '6px',
                                              background:
                                                claim.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' :
                                                claim.status === 'submitted' ? 'rgba(245, 158, 11, 0.15)' :
                                                claim.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.08)',
                                              color:
                                                claim.status === 'approved' ? '#10b981' :
                                                claim.status === 'submitted' ? '#f59e0b' :
                                                claim.status === 'rejected' ? '#ef4444' : 'var(--text-muted)',
                                              textTransform: 'capitalize'
                                            }}>
                                              {claim.status}
                                            </span>

                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>
                                              ${(claim.payment_amount + claim.bonus_amount).toFixed(2)}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* View Mode: Unified All Users & Posts Tracker */}
      {viewMode === 'account' && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          {/* Header */}
          <div style={{
            padding: '18px 24px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} style={{ color: '#ff4500' }} />
                All Users & Reddit Accounts Post Tracker
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Listing all users and their completed post tasks across every subreddit since starting ({filteredAccountStats.length} accounts found)
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(255,69,0,0.1)',
                color: '#ff4500',
                border: '1px solid rgba(255,69,0,0.25)'
              }}>
                {filteredAccountStats.reduce((sum, a) => sum + a.total_posts, 0)} Total Posts Done
              </span>
            </div>
          </div>

          {filteredAccountStats.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              <AlertCircle size={36} style={{ margin: '0 auto 12px auto', opacity: 0.6 }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                No users or Reddit accounts found matching criteria
              </h3>
              <p style={{ fontSize: '13px', margin: '6px 0 0 0' }}>
                Try adjusting your search query, status, or subreddit filter above.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '14px 16px', fontWeight: 600, minWidth: '170px' }}>Reddit Account</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600, minWidth: '150px' }}>Worker / Owner</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600, minWidth: '190px' }}>Current Subreddit(s)</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600, minWidth: '220px' }}>Past Subreddits</th>
                    <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'center', minWidth: '85px' }}>Total Posts</th>
                    <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'center', minWidth: '75px' }}>Approved</th>
                    <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'center', minWidth: '75px' }}>Pending</th>
                    <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'center', minWidth: '75px' }}>Rejected</th>
                    <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'right', minWidth: '85px' }}>Earned</th>
                    <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'right', minWidth: '95px' }}>Last Activity</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'center', minWidth: '110px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccountStats.map((acc) => {
                    const isExpanded = !!expandedAccounts[acc.reddit_account_id];
                    const assignedTags = customAccountTags[acc.reddit_account_id] || accountTagsGlobalMap.get(acc.reddit_account_id) || acc.assigned_tags || [];
                    const currentTagNamesSet = new Set(assignedTags.map(t => t.name.toLowerCase().replace(/^r\//i, '').trim()));

                    // Current subreddits (currently assigned tags)
                    const currentSubs = assignedTags.map(t => {
                      const cleanName = t.name.replace(/^r\//i, '').trim();
                      const stat = acc.subreddits.find(s => s.subreddit_name.toLowerCase() === cleanName.toLowerCase());
                      return {
                        id: t.id,
                        name: cleanName,
                        total_posts: stat ? stat.total_posts : 0
                      };
                    });

                    // Past subreddits (subreddits posted in that are NOT in current assigned tags)
                    const pastSubs = acc.subreddits.filter(s => {
                      const cleanName = s.subreddit_name.replace(/^r\//i, '').trim().toLowerCase();
                      return !currentTagNamesSet.has(cleanName);
                    });

                    return (
                      <React.Fragment key={acc.reddit_account_id}>
                        <tr style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: isExpanded ? 'rgba(255, 69, 0, 0.04)' : 'transparent',
                          transition: 'background 0.15s ease'
                        }}>
                          {/* 1. Reddit Account */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: 'rgba(255, 69, 0, 0.12)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ff4500',
                                flexShrink: 0
                              }}>
                                <RedditIcon size={16} />
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                    u/{acc.reddit_username}
                                  </span>

                                  {acc.reddit_profile_link && (
                                    <a
                                      href={acc.reddit_profile_link}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ color: '#ff4500', display: 'flex', alignItems: 'center' }}
                                      title="Open Reddit Profile"
                                    >
                                      <ExternalLink size={11} />
                                    </a>
                                  )}
                                </div>

                                {acc.reddit_karma !== null && (
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    {acc.reddit_karma} Karma
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 2. Worker / Owner */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {acc.user_name}
                              </span>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {acc.user_email}
                              </span>
                            </div>
                          </td>

                          {/* 3. Current Subreddit(s) */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              {currentSubs.length === 0 ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    None assigned
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenTagModal({
                                      reddit_account_id: acc.reddit_account_id,
                                      reddit_username: acc.reddit_username,
                                      user_name: acc.user_name,
                                      user_email: acc.user_email,
                                      assigned_tags: assignedTags
                                    })}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: 'rgba(255, 69, 0, 0.1)',
                                      color: '#ff4500',
                                      border: '1px solid rgba(255, 69, 0, 0.25)',
                                      fontSize: '10px',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Plus size={10} /> Assign
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                  {currentSubs.map(t => (
                                    <span
                                      key={t.id}
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        padding: '2px 7px',
                                        borderRadius: '6px',
                                        background: 'rgba(16, 185, 129, 0.12)',
                                        color: '#10b981',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                                      <span>r/{t.name}</span>
                                      <strong style={{ opacity: 0.9 }}>({t.total_posts})</strong>
                                    </span>
                                  ))}

                                  <button
                                    type="button"
                                    onClick={() => handleOpenTagModal({
                                      reddit_account_id: acc.reddit_account_id,
                                      reddit_username: acc.reddit_username,
                                      user_name: acc.user_name,
                                      user_email: acc.user_email,
                                      assigned_tags: assignedTags
                                    })}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: 'var(--bg-elevated)',
                                      color: 'var(--text-secondary)',
                                      border: '1px solid var(--border-medium)',
                                      fontSize: '10px',
                                      fontWeight: 500,
                                      cursor: 'pointer'
                                    }}
                                    title="Change currently assigned subreddit tag"
                                  >
                                    <Tag size={10} />
                                    <span>Edit</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 4. Past Subreddits */}
                          <td style={{ padding: '14px 16px', maxWidth: '280px' }}>
                            {pastSubs.length === 0 ? (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                None
                              </span>
                            ) : (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {pastSubs.map(sub => (
                                  <span
                                    key={sub.subreddit_name}
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 500,
                                      padding: '2px 7px',
                                      borderRadius: '6px',
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      border: '1px solid var(--border-subtle)',
                                      color: 'var(--text-secondary)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}
                                    title={`Past tasks posted in r/${sub.subreddit_name}`}
                                  >
                                    <span>r/{sub.subreddit_name}</span>
                                    <strong style={{ opacity: 0.85, color: '#ff4500' }}>({sub.total_posts})</strong>
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* 5. Total Posts */}
                          <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 9px',
                              borderRadius: '8px',
                              background: acc.total_posts > 0 ? 'rgba(255, 69, 0, 0.12)' : 'var(--bg-elevated)',
                              color: acc.total_posts > 0 ? '#ff4500' : 'var(--text-muted)',
                              fontWeight: 700,
                              fontSize: '13px'
                            }}>
                              {acc.total_posts}
                            </span>
                          </td>

                          {/* 6. Approved */}
                          <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                            <span style={{ color: acc.approved_posts > 0 ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                              {acc.approved_posts}
                            </span>
                          </td>

                          {/* 7. Pending */}
                          <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                            <span style={{ color: acc.submitted_posts > 0 ? '#f59e0b' : 'var(--text-muted)', fontWeight: 600 }}>
                              {acc.submitted_posts}
                            </span>
                          </td>

                          {/* 8. Rejected */}
                          <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                            <span style={{ color: acc.rejected_posts > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                              {acc.rejected_posts}
                            </span>
                          </td>

                          {/* 9. Total Earned */}
                          <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                            <span style={{ color: '#10b981', fontWeight: 700 }}>
                              ${acc.total_earned.toFixed(2)}
                            </span>
                          </td>

                          {/* 10. Last Activity */}
                          <td style={{ padding: '14px 12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}>
                            {acc.last_post_date ? new Date(acc.last_post_date).toLocaleDateString() : 'N/A'}
                          </td>

                          {/* 11. Action */}
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <button
                              onClick={() => toggleAccountExpand(acc.reddit_account_id)}
                              disabled={acc.all_claims.length === 0}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                background: isExpanded ? 'rgba(255, 69, 0, 0.15)' : 'var(--bg-elevated)',
                                color: isExpanded ? '#ff4500' : acc.all_claims.length === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                                border: '1px solid var(--border-medium)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: acc.all_claims.length === 0 ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                                opacity: acc.all_claims.length === 0 ? 0.5 : 1
                              }}
                            >
                              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                              <span>{acc.all_claims.length} {acc.all_claims.length === 1 ? 'Post' : 'Posts'}</span>
                            </button>
                          </td>
                        </tr>

                        {/* Nested Drawer for this Account showing all posts and in which subreddit they were posted */}
                        {isExpanded && (
                          <tr style={{ background: 'rgba(0,0,0,0.25)' }}>
                            <td colSpan={11} style={{ padding: '16px 22px 24px 22px' }}>
                              <div style={{
                                background: 'var(--bg-elevated)',
                                borderRadius: '14px',
                                border: '1px solid var(--border-medium)',
                                padding: '18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '14px'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                      All Post Tasks by u/{acc.reddit_username}
                                    </span>
                                    <span style={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      background: 'rgba(255,69,0,0.12)',
                                      color: '#ff4500'
                                    }}>
                                      {acc.all_claims.length} total tasks since starting
                                    </span>
                                  </div>

                                  {/* Subreddit breakdown chips in drawer */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    {currentSubs.length > 0 && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Current:</span>
                                        {currentSubs.map(s => (
                                          <span
                                            key={s.id}
                                            style={{
                                              fontSize: '11px',
                                              fontWeight: 600,
                                              padding: '2px 7px',
                                              borderRadius: '6px',
                                              background: 'rgba(16, 185, 129, 0.12)',
                                              color: '#10b981',
                                              border: '1px solid rgba(16, 185, 129, 0.25)'
                                            }}
                                          >
                                            r/{s.name} ({s.total_posts})
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {pastSubs.length > 0 && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: currentSubs.length > 0 ? '8px' : '0' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Past:</span>
                                        {pastSubs.map(s => (
                                          <span
                                            key={s.subreddit_name}
                                            style={{
                                              fontSize: '11px',
                                              fontWeight: 500,
                                              padding: '2px 7px',
                                              borderRadius: '6px',
                                              background: 'rgba(255,255,255,0.06)',
                                              color: 'var(--text-secondary)'
                                            }}
                                          >
                                            r/{s.subreddit_name} ({s.total_posts})
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {acc.all_claims.map((claim) => {
                                    const isCurrent = currentTagNamesSet.has(claim.effective_subreddit.toLowerCase().replace(/^r\//i, '').trim());

                                    return (
                                      <div
                                        key={claim.id}
                                        style={{
                                          padding: '12px 16px',
                                          borderRadius: '10px',
                                          background: 'var(--bg-card)',
                                          border: isCurrent ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          flexWrap: 'wrap',
                                          gap: '12px'
                                        }}
                                      >
                                        {/* Subreddit badge & Task details */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxWidth: '65%' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{
                                              fontSize: '11px',
                                              fontWeight: 700,
                                              padding: '2px 8px',
                                              borderRadius: '6px',
                                              background: isCurrent ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 69, 0, 0.15)',
                                              color: isCurrent ? '#10b981' : '#ff4500',
                                              border: isCurrent ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 69, 0, 0.3)',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px'
                                            }} title={isCurrent ? 'Current active subreddit' : 'Past subreddit'}>
                                              <span>r/{claim.effective_subreddit}</span>
                                              <span style={{ fontSize: '9px', opacity: 0.8, textTransform: 'uppercase' }}>
                                                {isCurrent ? 'Current' : 'Past'}
                                              </span>
                                            </span>

                                            <span style={{
                                              fontSize: '10px',
                                              fontWeight: 600,
                                              padding: '2px 6px',
                                              borderRadius: '4px',
                                              background: 'rgba(255,255,255,0.08)',
                                              color: 'var(--text-secondary)',
                                              textTransform: 'uppercase'
                                            }}>
                                              {claim.task_type}
                                            </span>

                                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                              {claim.task_title}
                                            </span>
                                          </div>

                                          {claim.reddit_url && (
                                            <a
                                              href={claim.reddit_url}
                                              target="_blank"
                                              rel="noreferrer"
                                              style={{
                                                fontSize: '12px',
                                                color: '#ff4500',
                                                textDecoration: 'none',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                wordBreak: 'break-all'
                                              }}
                                            >
                                              <ExternalLink size={11} />
                                              View on Reddit ↗
                                            </a>
                                          )}

                                          {claim.admin_notes && (
                                            <span style={{ fontSize: '11px', color: '#ef4444' }}>
                                              Note: {claim.admin_notes}
                                            </span>
                                          )}
                                        </div>

                                        {/* Date, Status, Payout */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {claim.submitted_at ? new Date(claim.submitted_at).toLocaleString() : 'Claimed'}
                                          </span>

                                          <span style={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            background:
                                              claim.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' :
                                              claim.status === 'submitted' ? 'rgba(245, 158, 11, 0.15)' :
                                              claim.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.08)',
                                            color:
                                              claim.status === 'approved' ? '#10b981' :
                                              claim.status === 'submitted' ? '#f59e0b' :
                                              claim.status === 'rejected' ? '#ef4444' : 'var(--text-muted)',
                                            textTransform: 'capitalize'
                                          }}>
                                            {claim.status}
                                          </span>

                                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                                            ${(claim.payment_amount + claim.bonus_amount).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* View Mode: Dense Submissions Feed */}
      {viewMode === 'feed' && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              All Reddit Submissions Feed ({filteredClaims.length} records)
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Subreddit</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Reddit Account</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Worker</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Task Title & Link</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Payout</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 600, color: '#ff4500' }}>
                        r/{c.effective_subreddit}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>u/{c.reddit_username}</span>
                        {c.reddit_profile_link && (
                          <a href={c.reddit_profile_link} target="_blank" rel="noreferrer" style={{ color: '#ff4500' }}>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{c.user_name}</span>
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: '300px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.task_title}
                        </span>
                        {c.reddit_url && (
                          <a
                            href={c.reddit_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#ff4500', fontSize: '11px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            <ExternalLink size={10} />
                            View on Reddit ↗
                          </a>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background:
                          c.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' :
                          c.status === 'submitted' ? 'rgba(245, 158, 11, 0.15)' :
                          c.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.08)',
                        color:
                          c.status === 'approved' ? '#10b981' :
                          c.status === 'submitted' ? '#f59e0b' :
                          c.status === 'rejected' ? '#ef4444' : 'var(--text-muted)'
                      }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                      ${(c.payment_amount + c.bonus_amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {c.submitted_at ? new Date(c.submitted_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Account Tags Modal */}
      <AnimatePresence>
        {tagModalAccount && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSavingTags && setTagModalAccount(null)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(6px)',
                cursor: isSavingTags ? 'default' : 'pointer'
              }}
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 360 }}
              onClick={(e) => e.stopPropagation()}
              className="admin-modal-box"
              style={{
                maxWidth: '620px',
                width: '100%',
                maxHeight: '90vh',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 1001,
                border: '1px solid var(--border-medium)',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)'
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
                background: 'var(--bg-elevated)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(255, 69, 0, 0.12)',
                    border: '1px solid rgba(255, 69, 0, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ff4500',
                    flexShrink: 0
                  }}>
                    <Tag size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.25 }}>
                      Manage Subreddit Tags
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#ff4500' }}>
                        u/{tagModalAccount.reddit_username}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>•</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {tagModalAccount.user_name} ({tagModalAccount.user_email})
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => !isSavingTags && setTagModalAccount(null)}
                  disabled={isSavingTags}
                  style={{
                    padding: '6px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: isSavingTags ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{
                padding: '20px 24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}>
                {/* Section: Currently Assigned Tags */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Assigned Tags ({selectedTagIds.length})
                    </span>
                    {selectedTagIds.length > 0 && (
                      <button
                        onClick={() => setSelectedTagIds([])}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          transition: 'color 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div style={{
                    minHeight: '50px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {selectedTagIds.length === 0 ? (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No subreddit tags currently assigned. Select or add tags below.
                      </span>
                    ) : (
                      selectedTagIds.map(id => {
                        const tag = data.allKnownSubreddits.find(t => t.id === id);
                        const name = tag ? tag.name : id;
                        return (
                          <span
                            key={id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 10px',
                              borderRadius: '20px',
                              background: 'rgba(255, 69, 0, 0.12)',
                              border: '1px solid rgba(255, 69, 0, 0.35)',
                              color: '#ff4500',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          >
                            <span>r/{name}</span>
                            <button
                              onClick={() => handleToggleTag(id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                color: '#ff4500',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: 0.8
                              }}
                              title={`Remove r/${name}`}
                            >
                              <X size={12} strokeWidth={2.5} />
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Section: Search & Create New Tag */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Search Tags Input */}
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search existing tags..."
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 34px 10px 36px',
                        borderRadius: '10px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    {tagSearch && (
                      <button
                        onClick={() => setTagSearch('')}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Quick Create New Tag */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Create new subreddit tag (e.g. AskReddit)..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateNewTag();
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      onClick={handleCreateNewTag}
                      disabled={isCreatingTag || !newTagName.trim()}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #ff4500, #ff5722)',
                        color: '#fff',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: isCreatingTag || !newTagName.trim() ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: isCreatingTag || !newTagName.trim() ? 0.6 : 1,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(255, 69, 0, 0.25)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isCreatingTag ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      <span>Add Tag</span>
                    </button>
                  </div>
                </div>

                {/* Section: Available Tags List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Available Tags ({data.allKnownSubreddits.length})
                  </span>

                  <div style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignContent: 'flex-start'
                  }}>
                    {data.allKnownSubreddits
                      .filter(t => !tagSearch.trim() || t.name.toLowerCase().includes(tagSearch.trim().toLowerCase().replace(/^r\//i, '')))
                      .map(tag => {
                        const isSelected = selectedTagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleToggleTag(tag.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 12px',
                              borderRadius: '20px',
                              background: isSelected ? 'rgba(255, 69, 0, 0.14)' : 'var(--bg-card)',
                              border: isSelected ? '1.5px solid #ff4500' : '1px solid var(--border-medium)',
                              color: isSelected ? '#ff4500' : 'var(--text-primary)',
                              fontSize: '12.5px',
                              fontWeight: isSelected ? 600 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>r/{tag.name}</span>
                            {isSelected && (
                              <Check size={13} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                            )}
                          </button>
                        );
                      })}
                    {data.allKnownSubreddits.filter(t => !tagSearch.trim() || t.name.toLowerCase().includes(tagSearch.trim().toLowerCase().replace(/^r\//i, ''))).length === 0 && (
                      <div style={{ width: '100%', padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No tags found matching &ldquo;{tagSearch}&rdquo;. Type it above to create it.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {selectedTagIds.length} tag{selectedTagIds.length === 1 ? '' : 's'} selected
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => !isSavingTags && setTagModalAccount(null)}
                    disabled={isSavingTags}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '10px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: isSavingTags ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveTags}
                    disabled={isSavingTags}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 20px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #ff4500, #ff5722)',
                      color: '#fff',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: isSavingTags ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(255, 69, 0, 0.35)',
                      opacity: isSavingTags ? 0.7 : 1,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSavingTags ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>{isSavingTags ? 'Saving...' : 'Save Tags'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 1100,
              padding: '12px 18px',
              borderRadius: '10px',
              background: toastMsg.type === 'error' ? '#ef4444' : '#10b981',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {toastMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{toastMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
