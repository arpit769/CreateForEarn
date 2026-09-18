'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { claimTask } from '@/actions/tasks';
import { PlusCircle, Search, Clock, DollarSign, MessageSquare, ThumbsUp, CornerDownRight, Video, PlaySquare, UserPlus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function WorkerYoutubeTasks({ 
  initialTasks
}: { 
  initialTasks: any[]
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState('');
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
    if (!confirm('Are you sure you want to claim this task? You will have 1 hour to complete it.')) return;
    setClaimingId(taskId);
    
    const res = await claimTask(taskId);
    if (res.error) {
      alert("Failed to claim task: " + res.error);
      setClaimingId(null);
    } else {
      setTasks(tasks.filter(t => t.id !== taskId));
      setClaimingId(null);
      alert("Task claimed successfully!");
      router.push('/worker/my-tasks');
    }
  };

  const [selectedType, setSelectedType] = useState<string>('all');

  const YOUTUBE_TYPES = [
    { key: 'all', label: 'All Tasks' },
    { key: 'like', label: 'Likes' },
    { key: 'comment', label: 'Comments' },
    { key: 'comment_reply', label: 'Replies' },
    { key: 'subscribe', label: 'Subscribes' },
    { key: 'post', label: 'Posts' },
  ];

  const filteredTasks = tasks.filter(t => {
    if (t.platform !== 'youtube') return false;
    if (selectedType !== 'all') {
      if (t.task_type !== selectedType) return false;
    }
    return t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.instructions?.toLowerCase().includes(search.toLowerCase()) ||
      (t.task_seq_id && `task id: ${t.task_seq_id}`.toLowerCase().includes(search.toLowerCase())) ||
      (t.task_seq_id && String(t.task_seq_id).includes(search.toLowerCase()));
  });

  const getCategoryCount = (typeKey: string) => {
    const ytTasks = tasks.filter(t => t.platform === 'youtube');
    if (typeKey === 'all') return ytTasks.length;
    return ytTasks.filter(t => t.task_type === typeKey).length;
  };

  return (
    <div className="dashboard-content-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#ff0000', color: '#fff'
            }}>
              <PlaySquare size={18} />
            </span>
            YouTube Tasks
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Browse and claim YouTube tasks (Like, Comment, Reply, Subscribe, Post). Complete tasks within 1 hour.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search YouTube tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '14px 14px 14px 40px', 
              background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', 
              borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' 
            }}
          />
        </div>

        {/* Category Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', alignItems: 'center' }}>
          {YOUTUBE_TYPES.map(cat => {
            const count = getCategoryCount(cat.key);
            const isActive = selectedType === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedType(cat.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isActive ? '1px solid rgba(255, 0, 0, 0.4)' : '1px solid var(--border-subtle)',
                  background: isActive ? 'rgba(255, 0, 0, 0.15)' : 'var(--bg-elevated)',
                  color: isActive ? '#ff0000' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{cat.label}</span>
                <span style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(255, 0, 0, 0.25)' : 'rgba(255,255,255,0.06)',
                  color: isActive ? '#fca5a5' : 'var(--text-muted)'
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
          <PlaySquare size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
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
                      background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
                      display: 'inline-flex', alignItems: 'center', gap: '5px'
                    }}>
                      <PlaySquare size={10} />
                      <span>{task.task_type?.toUpperCase() || 'YOUTUBE'}</span>
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
                      {task.task_type === 'like' ? (
                        <>
                          <ThumbsUp size={12} style={{ color: '#ef4444' }} />
                          <span>Like Task</span>
                        </>
                      ) : task.task_type === 'comment' ? (
                        <>
                          <MessageSquare size={12} style={{ color: '#3b82f6' }} />
                          <span>Comment Task</span>
                        </>
                      ) : task.task_type === 'comment_reply' ? (
                        <>
                          <CornerDownRight size={12} style={{ color: '#a855f7' }} />
                          <span>Reply Task</span>
                        </>
                      ) : task.task_type === 'subscribe' ? (
                        <>
                          <UserPlus size={12} style={{ color: '#ec4899' }} />
                          <span>Subscribe Task</span>
                        </>
                      ) : (
                        <>
                          <Video size={12} style={{ color: '#10b981' }} />
                          <span>Post Task</span>
                        </>
                      )}
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
                    background: '#ef4444', color: '#fff',
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

