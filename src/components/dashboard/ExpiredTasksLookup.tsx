'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  EyeOff,
  RotateCcw,
  Search,
  ExternalLink,
  User,
  Filter,
  DollarSign,
  Layers,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
  X
} from 'lucide-react';
import { decideExpiredTaskLookup } from '@/actions/tasks';
import { RedditNavIcon, YouTubeNavIcon, XNavIcon, QuoraNavIcon, InstagramNavIcon, LinkedInNavIcon } from '@/components/PlatformIcons';

interface ExpiredClaim {
  id: string;
  task_id: string;
  user_id: string;
  status: string;
  claimed_at: string;
  submitted_at: string | null;
  reddit_url?: string | null;
  screenshot_url?: string | null;
  users?: { id: string; email: string; full_name?: string };
  reddit_accounts?: { id: string; reddit_profile_link?: string };
  youtube_accounts?: { id: string; channel_name?: string; email_id?: string };
  x_accounts?: { id: string; username?: string; profile_url?: string };
  quora_accounts?: { id: string; username?: string; profile_url?: string };
  instagram_accounts?: { id: string; username?: string; profile_url?: string };
  linkedin_accounts?: { id: string; username?: string; profile_url?: string };
}

interface ExpiredTask {
  id: string;
  title: string;
  platform?: string;
  task_type?: string;
  task_category?: string;
  content_mode?: string;
  post_link?: string;
  instructions?: string;
  content_body?: string;
  payment_amount?: number;
  max_claims?: number;
  status?: string;
  created_at?: string;
  task_seq_id?: number;
  subreddits?: { name: string };
  admin_lookup_status?: 'pending' | 'reflected' | 'hidden';
  lookup_notes?: string | null;
  lookup_resolved_at?: string | null;
  expired_claims?: ExpiredClaim[];
}

export default function ExpiredTasksLookup({
  initialTasks,
  initialCounts
}: {
  initialTasks: ExpiredTask[];
  initialCounts?: {
    total: number;
    pending: number;
    reflected: number;
    hidden: number;
    totalExpiredClaims: number;
  };
}) {
  const [tasks, setTasks] = useState<ExpiredTask[]>(initialTasks);
  const [counts, setCounts] = useState(initialCounts || {
    total: initialTasks.length,
    pending: initialTasks.filter(t => t.admin_lookup_status === 'pending').length,
    reflected: initialTasks.filter(t => t.admin_lookup_status === 'reflected').length,
    hidden: initialTasks.filter(t => t.admin_lookup_status === 'hidden').length,
    totalExpiredClaims: initialTasks.reduce((acc, t) => acc + (t.expired_claims?.length || 0), 0)
  });

  const [activeTab, setActiveTab] = useState<'pending' | 'reflected' | 'hidden' | 'all'>('pending');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Decision Modal State
  const [selectedTask, setSelectedTask] = useState<ExpiredTask | null>(null);
  const [decisionAction, setDecisionAction] = useState<'reflect' | 'hide' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [detailModalTask, setDetailModalTask] = useState<ExpiredTask | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenDecision = (task: ExpiredTask, action: 'reflect' | 'hide') => {
    setSelectedTask(task);
    setDecisionAction(action);
    setAdminNotes(task.lookup_notes || '');
  };

  const handleConfirmDecision = () => {
    if (!selectedTask || !decisionAction) return;

    const taskId = selectedTask.id;
    const action = decisionAction;
    const notes = adminNotes.trim();

    startTransition(async () => {
      const res = await decideExpiredTaskLookup(taskId, action, notes);
      if (res?.success) {
        // Update local state
        setTasks(prev =>
          prev.map(t => {
            if (t.id === taskId) {
              return {
                ...t,
                admin_lookup_status: action === 'reflect' ? 'reflected' : 'hidden',
                lookup_notes: notes || null,
                lookup_resolved_at: new Date().toISOString(),
                status: action === 'reflect' ? 'available' : 'completed'
              };
            }
            return t;
          })
        );

        // Update counts
        setCounts(prev => {
          const oldStatus = selectedTask.admin_lookup_status || 'pending';
          const newStatus = action === 'reflect' ? 'reflected' : 'hidden';
          if (oldStatus === newStatus) return prev;

          return {
            ...prev,
            pending: oldStatus === 'pending' ? Math.max(0, prev.pending - 1) : prev.pending,
            reflected: newStatus === 'reflected' ? prev.reflected + 1 : (oldStatus === 'reflected' ? Math.max(0, prev.reflected - 1) : prev.reflected),
            hidden: newStatus === 'hidden' ? prev.hidden + 1 : (oldStatus === 'hidden' ? Math.max(0, prev.hidden - 1) : prev.hidden)
          };
        });

        showToast(
          action === 'reflect'
            ? 'Task successfully republished and reflected to users!'
            : 'Task has been kept hidden and closed.'
        );
        setSelectedTask(null);
        setDecisionAction(null);
        setAdminNotes('');
      } else {
        showToast('Failed to update task decision.', 'error');
      }
    });
  };

  // Filter tasks based on status tab, platform, and search query
  const filteredTasks = tasks.filter(task => {
    // Status tab filter
    if (activeTab !== 'all') {
      const status = task.admin_lookup_status || 'pending';
      if (status !== activeTab) return false;
    }

    // Platform filter
    if (selectedPlatform !== 'all') {
      const plat = task.platform || 'reddit';
      if (plat !== selectedPlatform) return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = (task.title || '').toLowerCase().includes(q);
      const idMatch = task.task_seq_id ? String(task.task_seq_id).includes(q) : false;
      const subMatch = (task.subreddits?.name || '').toLowerCase().includes(q);
      const workerMatch = task.expired_claims?.some(c =>
        (c.users?.email || '').toLowerCase().includes(q) ||
        (c.users?.full_name || '').toLowerCase().includes(q) ||
        (c.reddit_accounts?.reddit_profile_link || '').toLowerCase().includes(q) ||
        (c.x_accounts?.username || '').toLowerCase().includes(q) ||
        (c.youtube_accounts?.channel_name || '').toLowerCase().includes(q)
      );

      if (!titleMatch && !idMatch && !subMatch && !workerMatch) return false;
    }

    return true;
  });

  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case 'youtube': return <YouTubeNavIcon size={16} />;
      case 'x': return <XNavIcon size={14} />;
      case 'quora': return <QuoraNavIcon size={15} />;
      case 'instagram': return <InstagramNavIcon size={15} />;
      case 'linkedin': return <LinkedInNavIcon size={15} />;
      default: return <RedditNavIcon size={16} />;
    }
  };

  const getPlatformLabel = (platform?: string) => {
    switch (platform) {
      case 'youtube': return 'YouTube';
      case 'x': return 'X (Twitter)';
      case 'quora': return 'Quora';
      case 'instagram': return 'Instagram';
      case 'linkedin': return 'LinkedIn';
      default: return 'Reddit';
    }
  };

  const formatWorkerAccount = (claim: ExpiredClaim) => {
    if (claim.reddit_accounts?.reddit_profile_link) {
      const match = claim.reddit_accounts.reddit_profile_link.match(/\/u(?:ser)?\/([^/?]+)/i);
      return match ? `u/${match[1]}` : 'Reddit Account';
    }
    if (claim.youtube_accounts?.channel_name) {
      return claim.youtube_accounts.channel_name;
    }
    if (claim.x_accounts?.username) {
      return `@${claim.x_accounts.username}`;
    }
    if (claim.quora_accounts?.username) {
      return claim.quora_accounts.username;
    }
    if (claim.instagram_accounts?.username) {
      return `@${claim.instagram_accounts.username}`;
    }
    if (claim.linkedin_accounts?.username) {
      return claim.linkedin_accounts.username;
    }
    return claim.users?.full_name || claim.users?.email || 'Worker';
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px 80px' }}>
      <style>{`
        .lookup-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .lookup-table-wrap {
          display: block;
        }
        .lookup-mobile-cards {
          display: none;
        }
        .action-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: nowrap;
          white-space: nowrap;
        }
        @media (max-width: 900px) {
          .lookup-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .lookup-table-wrap {
            display: none;
          }
          .lookup-mobile-cards {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
        }
        @media (max-width: 540px) {
          .lookup-stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 9999,
              padding: '12px 20px',
              borderRadius: '10px',
              background: toastMessage.type === 'success' ? '#10b981' : '#ef4444',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ maxWidth: '750px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b'
            }}>
              <Clock size={20} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Expired Tasks Admin Lookup
            </h1>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '20px',
              background: counts.pending > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: counts.pending > 0 ? '#f59e0b' : '#10b981',
              border: `1px solid ${counts.pending > 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
            }}>
              {counts.pending} Awaiting Decision
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            When a worker claims a task and fails to submit within the 1-hour window, the claim expires. That task is held in this lookup queue so you can review it and decide whether to reflect it back to users or keep it hidden.
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by Title, ID, Worker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              borderRadius: '10px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="lookup-stats-grid">
        {/* Pending Card */}
        <div
          onClick={() => setActiveTab('pending')}
          style={{
            background: activeTab === 'pending' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-surface)',
            border: activeTab === 'pending' ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'pending' ? '0 4px 16px rgba(245, 158, 11, 0.15)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Awaiting Decision</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <AlertCircle size={15} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b' }}>
            {counts.pending}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Needs admin approval to reflect
          </div>
        </div>

        {/* Reflected Card */}
        <div
          onClick={() => setActiveTab('reflected')}
          style={{
            background: activeTab === 'reflected' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
            border: activeTab === 'reflected' ? '1.5px solid #10b981' : '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'reflected' ? '0 4px 16px rgba(16, 185, 129, 0.15)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Reflected to Users</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <RotateCcw size={15} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981' }}>
            {counts.reflected}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Republished back into worker feeds
          </div>
        </div>

        {/* Kept Hidden Card */}
        <div
          onClick={() => setActiveTab('hidden')}
          style={{
            background: activeTab === 'hidden' ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-surface)',
            border: activeTab === 'hidden' ? '1.5px solid #ef4444' : '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'hidden' ? '0 4px 16px rgba(239, 68, 68, 0.15)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Kept Hidden</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <EyeOff size={15} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#ef4444' }}>
            {counts.hidden}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Permanently closed from workers
          </div>
        </div>

        {/* Total Expired Claims */}
        <div
          onClick={() => setActiveTab('all')}
          style={{
            background: activeTab === 'all' ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)',
            border: activeTab === 'all' ? '1.5px solid #3b82f6' : '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'all' ? '0 4px 16px rgba(59, 130, 246, 0.15)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Expired Tasks</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <Layers size={15} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {counts.total}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {counts.totalExpiredClaims} total expired claim records
          </div>
        </div>
      </div>

      {/* Filter Tabs & Platform Chips */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-surface)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          {[
            { key: 'pending', label: 'Awaiting Decision', count: counts.pending, color: '#f59e0b' },
            { key: 'reflected', label: 'Reflected', count: counts.reflected, color: '#10b981' },
            { key: 'hidden', label: 'Kept Hidden', count: counts.hidden, color: '#ef4444' },
            { key: 'all', label: 'All Tasks', count: counts.total, color: 'var(--text-primary)' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.key ? 'var(--bg-card)' : 'transparent',
                color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.key ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '12px',
                background: activeTab === tab.key ? 'rgba(255,255,255,0.08)' : 'var(--bg-secondary)',
                color: tab.color
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Platform Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All Platforms' },
            { key: 'reddit', label: 'Reddit' },
            { key: 'youtube', label: 'YouTube' },
            { key: 'x', label: 'X' },
            { key: 'quora', label: 'Quora' },
            { key: 'instagram', label: 'Instagram' },
            { key: 'linkedin', label: 'LinkedIn' }
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setSelectedPlatform(p.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: selectedPlatform === p.key ? '1px solid var(--accent-color, #ff4500)' : '1px solid var(--border-color)',
                background: selectedPlatform === p.key ? 'rgba(255, 69, 0, 0.1)' : 'var(--bg-surface)',
                color: selectedPlatform === p.key ? 'var(--accent-color, #ff4500)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: selectedPlatform === p.key ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {p.key !== 'all' && getPlatformIcon(p.key)}
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '60px 24px',
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#10b981'
          }}>
            <CheckCircle2 size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            No Expired Tasks Found
          </h3>
          <p style={{ margin: 0, fontSize: '14px', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.5' }}>
            {activeTab === 'pending'
              ? 'Great news! There are currently no expired tasks awaiting admin decision.'
              : 'No tasks match the selected status or platform filter.'}
          </p>
        </div>
      )}

      {/* Desktop Table View */}
      {filteredTasks.length > 0 && (
        <div className="lookup-table-wrap">
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>TASK INFO</th>
                    <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>PLATFORM & TYPE</th>
                    <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>EXPIRED WORKER</th>
                    <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>STATUS</th>
                    <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>DECISION ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => {
                    const status = task.admin_lookup_status || 'pending';
                    const lastClaim = task.expired_claims?.[0];
                    const expiredAtStr = lastClaim?.claimed_at
                      ? new Date(new Date(lastClaim.claimed_at).getTime() + 60 * 60 * 1000).toLocaleString()
                      : '1-Hour Exceeded';

                    return (
                      <tr
                        key={task.id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {/* Task Info */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle', maxWidth: '300px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                              #{task.task_seq_id || task.id.substring(0, 6)}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: 'rgba(255,255,255,0.06)',
                              color: '#10b981'
                            }}>
                              ${Number(task.payment_amount || 0).toFixed(2)}
                            </span>
                          </div>
                          <div style={{
                            fontWeight: 600,
                            fontSize: '13.5px',
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {task.title}
                          </div>
                          {task.post_link && (
                            <a
                              href={task.post_link}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11.5px',
                                color: '#3b82f6',
                                textDecoration: 'none',
                                marginTop: '4px'
                              }}
                            >
                              Post Target <ExternalLink size={11} />
                            </a>
                          )}
                        </td>

                        {/* Platform & Type */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                            {getPlatformIcon(task.platform)}
                            {getPlatformLabel(task.platform)}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                            {task.task_type || 'task'} {task.subreddits?.name ? `in r/${task.subreddits.name}` : ''}
                          </div>
                        </td>

                        {/* Expired Worker */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle', maxWidth: '240px' }}>
                          {lastClaim ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                                <User size={13} style={{ color: 'var(--text-muted)' }} />
                                {formatWorkerAccount(lastClaim)}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {lastClaim.users?.email}
                              </div>
                              <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={11} /> Expired: {expiredAtStr}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No claim records</span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                          {status === 'pending' && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 10px',
                              borderRadius: '20px',
                              background: 'rgba(245, 158, 11, 0.12)',
                              color: '#f59e0b',
                              border: '1px solid rgba(245, 158, 11, 0.25)',
                              fontSize: '11.5px',
                              fontWeight: 700
                            }}>
                              <Clock size={12} /> Awaiting Decision
                            </span>
                          )}
                          {status === 'reflected' && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 10px',
                              borderRadius: '20px',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              fontSize: '11.5px',
                              fontWeight: 700
                            }}>
                              <CheckCircle2 size={12} /> Reflected to Users
                            </span>
                          )}
                          {status === 'hidden' && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 10px',
                              borderRadius: '20px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              fontSize: '11.5px',
                              fontWeight: 700
                            }}>
                              <EyeOff size={12} /> Kept Hidden
                            </span>
                          )}

                          {task.lookup_notes && (
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                              &ldquo;{task.lookup_notes}&rdquo;
                            </div>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <div className="action-row" style={{ justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => setDetailModalTask(task)}
                              style={{
                                padding: '7px 12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Details
                            </button>

                            {/* Decision: Reflect to Users */}
                            <button
                              onClick={() => handleOpenDecision(task, 'reflect')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '7px 13px',
                                borderRadius: '8px',
                                border: '1px solid #10b981',
                                background: status === 'reflected' ? 'rgba(16, 185, 129, 0.2)' : '#10b981',
                                color: status === 'reflected' ? '#10b981' : '#fff',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'opacity 0.2s'
                              }}
                            >
                              <RotateCcw size={13} />
                              {status === 'reflected' ? 'Reflected' : 'Reflect to Users'}
                            </button>

                            {/* Decision: Keep Hidden */}
                            <button
                              onClick={() => handleOpenDecision(task, 'hide')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '7px 13px',
                                borderRadius: '8px',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                background: status === 'hidden' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.08)',
                                color: '#ef4444',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'opacity 0.2s'
                              }}
                            >
                              <EyeOff size={13} />
                              {status === 'hidden' ? 'Hidden' : 'Keep Hidden'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Cards View */}
      {filteredTasks.length > 0 && (
        <div className="lookup-mobile-cards">
          {filteredTasks.map((task) => {
            const status = task.admin_lookup_status || 'pending';
            const lastClaim = task.expired_claims?.[0];

            return (
              <div
                key={task.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Mobile Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        #{task.task_seq_id || task.id.substring(0, 6)}
                      </span>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-secondary)', fontSize: '11px', fontWeight: 600 }}>
                        {getPlatformIcon(task.platform)}
                        {getPlatformLabel(task.platform)}
                      </div>
                    </div>
                    <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {task.title}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    whiteSpace: 'nowrap'
                  }}>
                    ${Number(task.payment_amount || 0).toFixed(2)}
                  </span>
                </div>

                {/* Worker Info Block */}
                {lastClaim && (
                  <div style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    fontSize: '12px'
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={13} style={{ color: 'var(--text-muted)' }} />
                      Worker: {formatWorkerAccount(lastClaim)} ({lastClaim.users?.email})
                    </div>
                    <div style={{ color: '#ef4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px' }}>
                      <Clock size={12} /> Claim Expired (1-Hour Limit Exceeded)
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {status === 'pending' && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 9px',
                      borderRadius: '16px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      fontSize: '11.5px',
                      fontWeight: 700
                    }}>
                      <Clock size={12} /> Awaiting Decision
                    </span>
                  )}
                  {status === 'reflected' && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 9px',
                      borderRadius: '16px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      fontSize: '11.5px',
                      fontWeight: 700
                    }}>
                      <CheckCircle2 size={12} /> Reflected to Users
                    </span>
                  )}
                  {status === 'hidden' && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 9px',
                      borderRadius: '16px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      fontSize: '11.5px',
                      fontWeight: 700
                    }}>
                      <EyeOff size={12} /> Kept Hidden
                    </span>
                  )}

                  <button
                    onClick={() => setDetailModalTask(task)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3b82f6',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    View Details
                  </button>
                </div>

                {/* Mobile Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                  <button
                    onClick={() => handleOpenDecision(task, 'reflect')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '9px',
                      borderRadius: '8px',
                      border: '1px solid #10b981',
                      background: '#10b981',
                      color: '#fff',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={14} /> Reflect to Users
                  </button>
                  <button
                    onClick={() => handleOpenDecision(task, 'hide')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '9px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#ef4444',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <EyeOff size={14} /> Keep Hidden
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {selectedTask && decisionAction && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '18px',
                width: '100%',
                maxWidth: '480px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                position: 'relative'
              }}
            >
              <button
                onClick={() => { setSelectedTask(null); setDecisionAction(null); }}
                style={{
                  position: 'absolute',
                  top: '18px',
                  right: '18px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: decisionAction === 'reflect' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: decisionAction === 'reflect' ? '#10b981' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {decisionAction === 'reflect' ? <RotateCcw size={22} /> : <EyeOff size={22} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 2px 0', color: 'var(--text-primary)' }}>
                    {decisionAction === 'reflect' ? 'Reflect Task to Users?' : 'Keep Task Hidden?'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    Task: #{selectedTask.task_seq_id || selectedTask.id.substring(0, 6)} - {selectedTask.title}
                  </p>
                </div>
              </div>

              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: '10px',
                padding: '12px 14px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: '1.5',
                marginBottom: '18px'
              }}>
                {decisionAction === 'reflect' ? (
                  <p style={{ margin: 0 }}>
                    <strong style={{ color: '#10b981' }}>Republish to available tasks:</strong> This task will immediately be made available again so other users can see and claim it on their dashboard.
                  </p>
                ) : (
                  <p style={{ margin: 0 }}>
                    <strong style={{ color: '#ef4444' }}>Keep permanently hidden:</strong> This task will be closed and will NOT be reflected or shown to users on any platform.
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Admin Notes (Optional)
                </label>
                <textarea
                  placeholder="e.g. Worker timed out, post still active, reopening for another worker..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setSelectedTask(null); setDecisionAction(null); }}
                  disabled={isPending}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDecision}
                  disabled={isPending}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: decisionAction === 'reflect' ? '#10b981' : '#ef4444',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    opacity: isPending ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isPending ? 'Saving...' : decisionAction === 'reflect' ? 'Confirm & Reflect' : 'Confirm & Hide'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Details Modal */}
      <AnimatePresence>
        {detailModalTask && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '18px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                position: 'relative'
              }}
            >
              <button
                onClick={() => setDetailModalTask(null)}
                style={{
                  position: 'absolute',
                  top: '18px',
                  right: '18px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Task #{detailModalTask.task_seq_id || detailModalTask.id.substring(0, 6)}
                </span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-secondary)', fontSize: '11px', fontWeight: 600 }}>
                  {getPlatformIcon(detailModalTask.platform)}
                  {getPlatformLabel(detailModalTask.platform)}
                </div>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
                {detailModalTask.title}
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Payment Reward</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>${Number(detailModalTask.payment_amount || 0).toFixed(2)}</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max Claims</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{detailModalTask.max_claims || 1}</div>
                </div>
              </div>

              {detailModalTask.post_link && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Target Link</div>
                  <a
                    href={detailModalTask.post_link}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '13px', color: '#3b82f6', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {detailModalTask.post_link} <ExternalLink size={13} />
                  </a>
                </div>
              )}

              {detailModalTask.instructions && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Instructions</div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                    {detailModalTask.instructions}
                  </div>
                </div>
              )}

              {detailModalTask.content_body && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Content Body</div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                    {detailModalTask.content_body}
                  </div>
                </div>
              )}

              {/* Expired Claims History */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Expired Claims History ({detailModalTask.expired_claims?.length || 0})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {detailModalTask.expired_claims?.map((claim) => (
                    <div
                      key={claim.id}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {formatWorkerAccount(claim)} ({claim.users?.email})
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Claimed: {new Date(claim.claimed_at).toLocaleString()}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '3px 7px', borderRadius: '4px' }}>
                        1-Hr Expired
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => {
                    const t = detailModalTask;
                    setDetailModalTask(null);
                    handleOpenDecision(t, 'reflect');
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Reflect to Users
                </button>
                <button
                  onClick={() => {
                    const t = detailModalTask;
                    setDetailModalTask(null);
                    handleOpenDecision(t, 'hide');
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Keep Hidden
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
