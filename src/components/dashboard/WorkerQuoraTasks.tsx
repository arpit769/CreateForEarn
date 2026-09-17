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
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearch(query);
    }
  }, [searchParams]);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleClaim = async (taskId: string) => {
    if (!confirm('Are you sure you want to claim this Quora task? You will have 1 hour to complete and submit proof.')) return;
    setClaimingId(taskId);
    
    const res = await claimTask(taskId);
    if (res.error) {
      alert("Failed to claim task: " + res.error);
      setClaimingId(null);
    } else {
      setTasks(tasks.filter(t => t.id !== taskId));
      setClaimingId(null);
      setSelectedTask(null);
      router.push('/worker/my-tasks');
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.instructions?.toLowerCase().includes(search.toLowerCase()) ||
      (t.task_seq_id && `task id: ${t.task_seq_id}`.toLowerCase().includes(search.toLowerCase())) ||
      (t.task_seq_id && String(t.task_seq_id).includes(search.toLowerCase()));

    const matchesType = typeFilter === 'all' || t.task_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getCategoryCount = (typeId: string) => {
    if (typeId === 'all') return tasks.length;
    return tasks.filter(t => t.task_type === typeId).length;
  };

  return (
    <div className="dashboard-content-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
              width: '32px', height: '32px', borderRadius: '8px', 
              background: '#b92b27', color: '#fff', fontSize: '18px', fontWeight: 900 
            }}>
              Q
            </span>
            Quora Tasks
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Browse and claim Quora tasks (Answer, Upvote, Follow, Topic, Comment, Share). Complete tasks within 1 hour.
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
                  padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                  whiteSpace: 'nowrap', cursor: 'pointer',
                  background: isSelected ? '#b92b27' : 'var(--bg-card)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid #b92b27' : '1px solid var(--border-subtle)',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex', alignItems: 'center', gap: '6px'
                }}
              >
                <span>{f.label}</span>
                <span style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.06)',
                  color: isSelected ? '#fff' : 'var(--text-muted)'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px', background: 'var(--bg-card)',
          borderRadius: '20px', border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', 
            background: 'rgba(185, 43, 39, 0.1)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto',
            color: '#b92b27', fontSize: '24px', fontWeight: 900
          }}>
            Q
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Quora Tasks Available
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Check back later for new Quora answers, comments, upvotes, and follow tasks.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {filteredTasks.map((task) => {
            const isUgc = task.title?.startsWith('User-Generated');
            const slotsRemaining = task.slots_remaining !== undefined ? task.slots_remaining : Math.max(0, (task.max_claims || 1) - (task.active_claims_count || 0));

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'var(--bg-card)', borderRadius: '16px',
                  border: '1px solid var(--border-subtle)', padding: '20px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  gap: '16px', transition: 'all 0.2s ease', position: 'relative'
                }}
              >
                <div>
                  {/* Card Header: Type Badge, Seq ID, and Payment */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 700,
                        background: 'rgba(185, 43, 39, 0.12)', color: '#b92b27',
                        padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {getQuoraTypeIcon(task.task_type)}
                        {task.task_type?.replace('_', ' ')}
                      </span>

                      {task.task_seq_id && (
                        <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '4px 8px', borderRadius: '6px' }}>
                          #{task.task_seq_id}
                        </span>
                      )}

                      {isUgc && (
                        <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', padding: '4px 8px', borderRadius: '6px' }}>
                          UGC
                        </span>
                      )}
                    </div>

                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '2px',
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

                  {task.post_link && (
                    <div style={{ marginBottom: '12px' }}>
                      <a
                        href={task.post_link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none',
                          display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500,
                          wordBreak: 'break-all'
                        }}
                      >
                        <ExternalLink size={12} /> Target URL
                      </a>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Slots: <strong style={{ color: 'var(--text-primary)' }}>{slotsRemaining} left</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedTask(task)}
                      style={{
                        padding: '8px 12px', borderRadius: '8px',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <Eye size={14} /> Preview
                    </button>

                    <button
                      onClick={() => handleClaim(task.id)}
                      disabled={claimingId === task.id || slotsRemaining <= 0}
                      style={{
                        padding: '8px 16px', borderRadius: '8px',
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
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* TASK DETAIL / PREVIEW MODAL */}
      <AnimatePresence>
        {selectedTask && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
                borderRadius: '20px', width: '100%', maxWidth: '600px',
                maxHeight: '90vh', overflowY: 'auto', padding: '32px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)', position: 'relative'
              }}
            >
              <button
                onClick={() => setSelectedTask(null)}
                style={{
                  position: 'absolute', top: '24px', right: '24px',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700,
                  background: 'rgba(185, 43, 39, 0.12)', color: '#b92b27',
                  padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px',
                  textTransform: 'uppercase'
                }}>
                  {getQuoraTypeIcon(selectedTask.task_type)}
                  {selectedTask.task_type?.replace('_', ' ')}
                </span>
                {selectedTask.task_seq_id && (
                  <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '4px 8px', borderRadius: '6px' }}>
                    #{selectedTask.task_seq_id}
                  </span>
                )}
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', marginLeft: 'auto' }}>
                  ${Number(selectedTask.payment_amount).toFixed(2)}
                </span>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
                {selectedTask.title}
              </h2>

              {/* Instructions */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Instructions
                </h4>
                <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                  {selectedTask.instructions || 'Follow the link and complete the task as requested.'}
                </div>
              </div>

              {/* Target Link */}
              {selectedTask.post_link && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Target Quora URL
                  </h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      readOnly
                      value={selectedTask.post_link}
                      style={{
                        flex: 1, padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)', fontSize: '13px', outline: 'none'
                      }}
                    />
                    <button
                      onClick={() => copyToClipboard(selectedTask.post_link, 'link')}
                      style={{
                        padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      {copiedField === 'link' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      {copiedField === 'link' ? 'Copied' : 'Copy'}
                    </button>
                    <a
                      href={selectedTask.post_link}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '10px 14px', borderRadius: '8px',
                        background: '#b92b27', color: '#fff', fontSize: '13px', fontWeight: 600,
                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      Open <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}

              {/* Answer/Comment Content if Admin Provided */}
              {selectedTask.content_body && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Required Content Text
                    </h4>
                    <button
                      onClick={() => copyToClipboard(selectedTask.content_body, 'body')}
                      style={{
                        background: 'none', border: 'none', color: 'var(--accent-blue)',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      {copiedField === 'body' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      {copiedField === 'body' ? 'Copied Content' : 'Copy Text'}
                    </button>
                  </div>
                  <div style={{
                    background: 'var(--bg-card)', padding: '16px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', color: 'var(--text-primary)',
                    fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap'
                  }}>
                    {selectedTask.content_body}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setSelectedTask(null)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '10px',
                    background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                    color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => handleClaim(selectedTask.id)}
                  disabled={claimingId === selectedTask.id}
                  style={{
                    flex: 2, padding: '12px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #b92b27, #aa221e)',
                    color: '#ffffff', border: 'none', fontSize: '14px', fontWeight: 600,
                    cursor: claimingId === selectedTask.id ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(185, 43, 39, 0.3)'
                  }}
                >
                  {claimingId === selectedTask.id ? 'Claiming Task...' : 'Claim This Task'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
