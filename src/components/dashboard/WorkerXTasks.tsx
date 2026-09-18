'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { claimTask } from '@/actions/tasks';
import { 
  PlusCircle, Search, Clock, DollarSign, ExternalLink, Heart, Repeat, Quote, 
  UserPlus, Bookmark, MessageSquare
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

const getXTypeIcon = (type: string) => {
  switch (type) {
    case 'like': return <Heart size={14} style={{ color: '#ec4899' }} />;
    case 'repost': return <Repeat size={14} style={{ color: '#10b981' }} />;
    case 'quote_post': return <Quote size={14} style={{ color: '#3b82f6' }} />;
    case 'follow': return <UserPlus size={14} style={{ color: '#8b5cf6' }} />;
    case 'bookmark': return <Bookmark size={14} style={{ color: '#f59e0b' }} />;
    case 'comment': return <MessageSquare size={14} style={{ color: '#06b6d4' }} />;
    default: return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block' }}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    );
  }
};

const getXTypeLabel = (type: string) => {
  switch (type) {
    case 'like': return 'Like Post';
    case 'repost': return 'Repost';
    case 'quote_post': return 'Quote Post';
    case 'follow': return 'Follow Profile';
    case 'bookmark': return 'Bookmark Post';
    case 'comment': return 'Reply / Comment';
    default: return 'Post';
  }
};

export default function WorkerXTasks({ 
  initialTasks,
  postNextAvailableAt,
  otherNextAvailableAt
}: { 
  initialTasks: any[];
  postNextAvailableAt?: string | null;
  otherNextAvailableAt?: string | null;
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
    if (!confirm('Are you sure you want to claim this X task? You will have 1 hour to complete and submit proof.')) return;
    setClaimingId(taskId);
    
    const res = await claimTask(taskId);
    if (res.error) {
      alert("Failed to claim task: " + res.error);
      setClaimingId(null);
    } else {
      setTasks(tasks.filter(t => t.id !== taskId));
      setClaimingId(null);
      // Directly redirect to /worker/my-tasks
      router.push('/worker/my-tasks');
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (t.platform !== 'x') return false;

    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.instructions?.toLowerCase().includes(search.toLowerCase()) ||
      (t.task_seq_id && `task id: ${t.task_seq_id}`.toLowerCase().includes(search.toLowerCase())) ||
      (t.task_seq_id && String(t.task_seq_id).includes(search.toLowerCase()));

    const matchesType = typeFilter === 'all' || t.task_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getCategoryCount = (typeId: string) => {
    const xTasks = tasks.filter(t => t.platform === 'x');
    if (typeId === 'all') return xTasks.length;
    return xTasks.filter(t => t.task_type === typeId).length;
  };

  return (
    <div className="dashboard-content-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#000000', color: '#fff', border: '1px solid #333'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </span>
            X (Twitter) Tasks
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Browse and claim X tasks (Post, Comment, Like, Repost, Quote, Follow, Bookmark). Complete tasks within 1 hour.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search X tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '14px 14px 14px 40px', 
              background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', 
              borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' 
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%', alignItems: 'center' }}>
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'post', label: 'Posts' },
            { id: 'comment', label: 'Comments' },
            { id: 'like', label: 'Likes' },
            { id: 'repost', label: 'Reposts' },
            { id: 'quote_post', label: 'Quotes' },
            { id: 'follow', label: 'Follows' },
            { id: 'bookmark', label: 'Bookmarks' }
          ].map(f => {
            const count = getCategoryCount(f.id);
            const isSelected = typeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'var(--text-primary)' : 'var(--bg-elevated)',
                  color: isSelected ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{f.label}</span>
                <span style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.06)',
                  color: isSelected ? 'inherit' : 'var(--text-muted)'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div style={{ 
          background: 'var(--bg-elevated)', padding: '64px 20px', 
          borderRadius: '16px', border: '1px solid var(--border-subtle)', 
          textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' 
        }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>No tasks found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your search criteria or check back later.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredTasks.map(task => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={task.id}
              style={{
                background: 'var(--bg-elevated)',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                      background: 'var(--text-primary)', color: 'var(--bg-card)',
                      display: 'inline-flex', alignItems: 'center', gap: '5px'
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <span>{task.task_type?.toUpperCase() || 'POST'}</span>
                    </span>
                    {task.task_seq_id && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        #{task.task_seq_id}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 700, fontSize: '16px' }}>
                    <DollarSign size={16} />
                    {task.payment_amount.toFixed(2)}
                  </div>
                </div>

                <div style={{ margin: '12px 0 8px' }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: 700, 
                    color: 'var(--text-primary)', 
                    margin: '0 0 6px 0', 
                  }}>
                    {task.title}
                  </h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {getXTypeIcon(task.task_type)}
                      <span>{getXTypeLabel(task.task_type)}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 500 }}>
                      <Clock size={12} /> 1h window
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ 
                padding: '12px 20px', 
                borderTop: '1px solid var(--border-subtle)', 
                background: 'rgba(0,0,0,0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Slots: <strong style={{ color: 'var(--text-primary)' }}>{task.slots_remaining !== undefined ? task.slots_remaining : task.max_claims} left</strong>
                </span>
                <button
                  onClick={() => handleClaim(task.id)}
                  disabled={claimingId === task.id || (task.slots_remaining !== undefined && task.slots_remaining <= 0)}
                  style={{
                    padding: '8px 16px', borderRadius: '8px',
                    background: 'var(--text-primary)', color: 'var(--bg-primary)',
                    border: 'none', fontSize: '13px', fontWeight: 600,
                    cursor: claimingId === task.id || (task.slots_remaining !== undefined && task.slots_remaining <= 0) ? 'not-allowed' : 'pointer',
                    opacity: claimingId === task.id ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    transition: 'opacity 0.2s'
                  }}
                >
                  <PlusCircle size={14} />
                  {claimingId === task.id ? 'Claiming...' : (task.slots_remaining !== undefined && task.slots_remaining <= 0) ? 'Full' : 'Claim Task'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

