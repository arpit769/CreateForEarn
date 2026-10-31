'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { claimTask } from '@/actions/tasks';
import { 
  PlusCircle, Search, Clock, DollarSign,
  MessageSquare, AlertCircle, Link as LinkIcon, X, Eye, 
  Copy, Check, ExternalLink, UserPlus, Hash, HelpCircle,
  Share2, ThumbsUp, CheckCircle2, ArrowRight
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

const getQuoraTypeIcon = (type: string) => {
  switch (type) {
    case 'answer': return <HelpCircle size={14} style={{ color: '#b92b27' }} />;
    case 'upvote': return <ThumbsUp size={14} style={{ color: '#f97316' }} />;
    case 'follow': return <UserPlus size={14} style={{ color: '#8b5cf6' }} />;
    case 'follow_topic': return <Hash size={14} style={{ color: '#06b6d4' }} />;
    case 'comment': return <MessageSquare size={14} style={{ color: '#3b82f6' }} />;
    case 'share': return <Share2 size={14} style={{ color: '#10b981' }} />;
    default: return (
      <span style={{ 
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
        width: '16px', height: '16px', borderRadius: '4px', 
        background: '#b92b27', color: '#fff', fontSize: '10px', fontWeight: 900 
      }}>
        Q
      </span>
    );
  }
};

const getQuoraTypeLabel = (type: string) => {
  switch (type) {
    case 'answer': return 'Answer Question';
    case 'upvote': return 'Upvote Answer';
    case 'follow': return 'Follow Profile';
    case 'follow_topic': return 'Follow Topic';
    case 'comment': return 'Comment on Answer';
    case 'share': return 'Share Question/Answer';
    default: return 'Quora Task';
  }
};

export default function WorkerQuoraTasks({ 
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
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearch(query);
    }
  }, [searchParams]);

  const handleClaim = async (taskId: string) => {
    if (!confirm('Are you sure you want to claim this Quora task? You will have 1 hour to complete and submit proof.')) return;
    setClaimingId(taskId);
    
    const res = await claimTask(taskId);
    if (res.error) {
      alert("Failed to claim task: " + res.error);
      setClaimingId(null);
    } else {
      router.push('/worker/my-tasks');
    }
  };

  const getCategoryCount = (typeKey: string) => {
    const quoraTasks = tasks.filter(t => t.platform?.toLowerCase() === 'quora');
    if (typeKey === 'all') return quoraTasks.length;
    return quoraTasks.filter(t => t.task_type === typeKey).length;
  };

  const filteredTasks = tasks.filter(t => {
    if (t.platform?.toLowerCase() !== 'quora') return false;
    if (typeFilter !== 'all' && t.task_type !== typeFilter) return false;
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      (t.title && t.title.toLowerCase().includes(query)) ||
      (t.instructions && t.instructions.toLowerCase().includes(query)) ||
      (t.task_seq_id && String(t.task_seq_id).includes(query)) ||
      (t.task_seq_id && `task id: ${t.task_seq_id}`.toLowerCase().includes(query))
    );
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
              width: '32px', height: '32px', borderRadius: '8px', 
              background: '#b92b27', color: '#fff', fontSize: '18px', fontWeight: 900, fontFamily: 'serif' 
            }}>
              Q
            </span>
            Quora Tasks
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Browse and claim Quora tasks (Answer, Upvote, Follow, Follow Topic, Comment, Share). Cooldown: 1 answer per 20 hrs, 2 per hr for other tasks.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search Quora tasks..."
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
            { id: 'answer', label: 'Answers' },
            { id: 'upvote', label: 'Upvotes' },
            { id: 'follow', label: 'Follow Profile' },
            { id: 'follow_topic', label: 'Follow Topic' },
            { id: 'comment', label: 'Comments' },
            { id: 'share', label: 'Shares' },
          ].map(f => {
            const count = getCategoryCount(f.id);
            const isSelected = typeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                  whiteSpace: 'nowrap', cursor: 'pointer',
                  background: isSelected ? 'rgba(185, 43, 39, 0.15)' : 'var(--bg-card)',
                  color: isSelected ? '#ef4444' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid rgba(185, 43, 39, 0.3)' : '1px solid var(--border-subtle)',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex', alignItems: 'center', gap: '6px'
                }}
              >
                <span>{f.label}</span>
                <span style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(185, 43, 39, 0.25)' : 'rgba(255,255,255,0.06)',
                  color: isSelected ? '#fca5a5' : 'var(--text-muted)'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div style={{ 
          textAlign: 'center', padding: '64px 20px', background: 'var(--bg-elevated)', 
          borderRadius: '20px', border: '1px solid var(--border-subtle)' 
        }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', 
            background: 'rgba(185, 43, 39, 0.1)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto',
            color: '#b92b27', fontSize: '28px', fontWeight: 900, fontFamily: 'serif'
          }}>
            Q
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Quora Tasks Available
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Check back later for new Quora answers, upvotes, and comments.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredTasks.map(task => {
            const slotsRemaining = (task.max_claims || 1) - (task.active_claims_count || 0);

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'var(--bg-elevated)', borderRadius: '16px',
                  border: '1px solid var(--border-subtle)', padding: '20px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px',
                        background: 'rgba(185, 43, 39, 0.1)', color: '#b92b27',
                        fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        {getQuoraTypeIcon(task.task_type)}
                        {getQuoraTypeLabel(task.task_type)}
                      </span>
                      {task.task_seq_id && (
                        <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', padding: '3px 7px', borderRadius: '6px' }}>
                          #{task.task_seq_id}
                        </span>
                      )}
                    </div>

                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '18px', fontWeight: 800, color: '#10b981'
                    }}>
                      <DollarSign size={16} strokeWidth={3} />
                      {Number(task.payment_amount).toFixed(2)}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.3 }}>
                    {task.title}
                  </h3>

                  {task.instructions && (
                    <p style={{
                      fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5,
                      marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {task.instructions}
                    </p>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Slots: <strong style={{ color: 'var(--text-primary)' }}>{slotsRemaining} left</strong>
                  </div>

                  <button
                    onClick={() => handleClaim(task.id)}
                    disabled={claimingId === task.id || slotsRemaining <= 0}
                    style={{
                      padding: '8px 18px', borderRadius: '8px',
                      background: slotsRemaining <= 0 ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #b92b27, #aa221e)',
                      color: slotsRemaining <= 0 ? 'var(--text-muted)' : '#ffffff',
                      border: 'none', fontSize: '13px', fontWeight: 600,
                      cursor: claimingId === task.id || slotsRemaining <= 0 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      boxShadow: slotsRemaining <= 0 ? 'none' : '0 4px 12px rgba(185, 43, 39, 0.3)'
                    }}
                  >
                    {claimingId === task.id ? 'Claiming...' : (slotsRemaining <= 0 ? 'Full' : 'Claim Task')}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
