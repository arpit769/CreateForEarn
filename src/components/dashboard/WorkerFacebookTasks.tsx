'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { claimTask } from '@/actions/tasks';
import { 
  PlusCircle, Search, Clock, DollarSign,
  MessageSquare, AlertCircle, Link as LinkIcon, X, Eye, 
  Copy, Check, ExternalLink, UserPlus, ThumbsUp, Share2,
  Users, CheckCircle2, ArrowRight, Image as ImageIcon, Type
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FacebookIcon } from '@/utils/facebook';

const getFacebookTypeIcon = (type: string) => {
  switch (type) {
    case 'post': return <Type size={14} style={{ color: '#1877F2' }} />;
    case 'comment': return <MessageSquare size={14} style={{ color: '#3b82f6' }} />;
    case 'like': return <ThumbsUp size={14} style={{ color: '#1877F2' }} />;
    case 'share': return <Share2 size={14} style={{ color: '#10b981' }} />;
    case 'follow': return <UserPlus size={14} style={{ color: '#8b5cf6' }} />;
    case 'join_group': return <Users size={14} style={{ color: '#f59e0b' }} />;
    case 'story_view': return <Eye size={14} style={{ color: '#06b6d4' }} />;
    default: return <FacebookIcon size={14} color="#1877F2" />;
  }
};

const getFacebookTypeLabel = (type: string) => {
  switch (type) {
    case 'post': return 'Facebook Post';
    case 'comment': return 'Comment on Post';
    case 'like': return 'React to Post';
    case 'share': return 'Share Post';
    case 'follow': return 'Follow / Like Page';
    case 'join_group': return 'Join Facebook Group';
    case 'story_view': return 'View Facebook Story';
    default: return 'Facebook Task';
  }
};

export default function WorkerFacebookTasks({ 
  initialTasks
}: { 
  initialTasks: any[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearch(query);
    }
  }, [searchParams]);

  const handleClaim = async (taskId: string) => {
    if (!confirm('Are you sure you want to claim this Facebook task? You will have 1 hour to complete and submit proof.')) return;
    setClaimingId(taskId);
    
    const res = await claimTask(taskId);
    if (res.error) {
      alert("Failed to claim task: " + res.error);
      setClaimingId(null);
    } else {
      setTasks(tasks.filter(t => t.id !== taskId));
      setClaimingId(null);
      router.push('/worker/my-tasks');
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (t.platform !== 'facebook') return false;

    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.instructions?.toLowerCase().includes(search.toLowerCase()) ||
      (t.task_seq_id && `task id: ${t.task_seq_id}`.toLowerCase().includes(search.toLowerCase())) ||
      (t.task_seq_id && String(t.task_seq_id).includes(search.toLowerCase()));

    const matchesType = typeFilter === 'all' || t.task_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getCategoryCount = (typeId: string) => {
    const fbTasks = tasks.filter(t => t.platform === 'facebook');
    if (typeId === 'all') return fbTasks.length;
    return fbTasks.filter(t => t.task_type === typeId).length;
  };

  return (
    <div className="dashboard-content-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              width: '36px', height: '36px', borderRadius: '10px', 
              background: '#1877F2',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(24, 119, 242, 0.3)'
            }}>
              <FacebookIcon size={20} color="#ffffff" />
            </span>
            Available Facebook Tasks
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            Browse and claim tasks to earn money with your verified Facebook account.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%' }}>
            {[
              { id: 'all', label: 'All Tasks' },
              { id: 'post', label: 'Post' },
              { id: 'comment', label: 'Comment' },
              { id: 'like', label: 'Like / React' },
              { id: 'share', label: 'Share' },
              { id: 'follow', label: 'Follow / Like Page' },
              { id: 'join_group', label: 'Join Group' },
              { id: 'story_view', label: 'Story View' },
            ].map(tab => {
              const count = getCategoryCount(tab.id);
              const isSelected = typeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTypeFilter(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: isSelected ? 600 : 500,
                    background: isSelected ? 'rgba(24, 119, 242, 0.12)' : 'var(--bg-elevated)',
                    color: isSelected ? '#1877F2' : 'var(--text-secondary)',
                    border: isSelected ? '1px solid rgba(24, 119, 242, 0.3)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: '11px',
                    background: isSelected ? '#1877F2' : 'var(--bg-card)',
                    color: isSelected ? '#fff' : 'var(--text-muted)',
                    padding: '1px 6px',
                    borderRadius: '10px'
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px', flexShrink: 0 }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search Facebook tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '10px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          background: 'var(--bg-card)', 
          borderRadius: '16px', 
          border: '1px solid var(--border-subtle)' 
        }}>
          <FacebookIcon size={44} color="#1877F2" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Facebook Tasks Available
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '420px', margin: '0 auto' }}>
            There are currently no available Facebook tasks matching your filter. Check back soon for new campaigns!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                position: 'relative'
              }}
            >
              <div>
                {/* Header: ID, Type badge, and Reward */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '11px', fontWeight: 700, 
                      background: 'rgba(24, 119, 242, 0.08)', 
                      color: '#1877F2',
                      padding: '3px 8px', borderRadius: '6px'
                    }}>
                      {task.task_seq_id ? `#${task.task_seq_id}` : 'TASK'}
                    </span>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)'
                    }}>
                      {getFacebookTypeIcon(task.task_type)}
                      {getFacebookTypeLabel(task.task_type)}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '16px', fontWeight: 800, color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '8px'
                  }}>
                    ${Number(task.payment_amount).toFixed(2)}
                  </div>
                </div>

                {/* Task Title */}
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.3 }}>
                  {task.title}
                </h3>

                {/* Instructions preview */}
                {task.instructions && (
                  <p style={{ 
                    fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4,
                    marginBottom: '16px',
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {task.instructions}
                  </p>
                )}
              </div>

              {/* Card Footer: Slots remaining & Claim Button */}
              <div style={{ 
                borderTop: '1px solid var(--border-subtle)', 
                paddingTop: '14px',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Slots Remaining</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {task.slots_remaining !== undefined ? task.slots_remaining : task.max_claims} slots
                  </span>
                </div>

                <button
                  onClick={() => handleClaim(task.id)}
                  disabled={claimingId === task.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#1877F2',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: claimingId === task.id ? 'not-allowed' : 'pointer',
                    opacity: claimingId === task.id ? 0.7 : 1,
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(24, 119, 242, 0.25)'
                  }}
                >
                  {claimingId === task.id ? (
                    'Claiming...'
                  ) : (
                    <>
                      Claim Task <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
