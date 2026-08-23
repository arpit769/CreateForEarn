'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { claimTask } from '@/actions/tasks';
import { PlusCircle, Search, Clock, DollarSign, Image as ImageIcon, MessageSquare, AlertCircle, Link as LinkIcon, X, Eye, Download, Copy, Check, Type, ExternalLink, ThumbsUp, CornerDownRight, Video, PlaySquare, UserPlus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function WorkerYoutubeTasks({ 
  initialTasks
}: { 
  initialTasks: any[]
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState('');
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
    if (!confirm('Are you sure you want to claim this task? You will have 1 hour to complete it.')) return;
    setClaimingId(taskId);
    
    const res = await claimTask(taskId);
    if (res.error) {
      alert("Failed to claim task: " + res.error);
      setClaimingId(null);
    } else {
      setTasks(tasks.filter(t => t.id !== taskId));
      setClaimingId(null);
      setSelectedTask(null);
      alert("Task claimed successfully!");
      router.push('/worker/my-tasks');
    }
  };

  const filteredTasks = tasks.filter(t => {
    return t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.instructions?.toLowerCase().includes(search.toLowerCase()) ||
      (t.task_seq_id && `task id: ${t.task_seq_id}`.toLowerCase().includes(search.toLowerCase())) ||
      (t.task_seq_id && String(t.task_seq_id).includes(search.toLowerCase()));
  });

  return (
    <div className="dashboard-content-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            YouTube Tasks
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Browse and claim YouTube tasks (Like, Comment, Reply, Subscribe, Post). Open for everyone.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
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
              onClick={() => setSelectedTask(task)}
              style={{
                background: 'var(--bg-elevated)',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.2)';
                e.currentTarget.style.borderColor = 'var(--border-medium)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    
                    {task.post_link ? (
                      <a 
                        href={task.post_link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px'
                        }}
                      >
                        {task.task_type === 'subscribe' ? 'YouTube Channel' : 'YouTube Video'}
                        <ExternalLink size={10} />
                      </a>
                    ) : null}

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
                    {task.task_seq_id ? `Task ID: ${task.task_seq_id} - ` : ''}{task.title}
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
                gap: '10px'
              }}>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClaim(task.id);
                  }}
                  disabled={claimingId === task.id}
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: '8px',
                    background: 'var(--accent-blue)', color: '#fff',
                    border: 'none', fontSize: '13px', fontWeight: 600,
                    cursor: claimingId === task.id ? 'not-allowed' : 'pointer',
                    opacity: claimingId === task.id ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    transition: 'opacity 0.2s'
                  }}
                >
                  <PlusCircle size={14} />
                  {claimingId === task.id ? 'Claiming...' : 'Claim Task'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedTask && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '20px',
                width: '100%', maxWidth: '650px',
                maxHeight: '90vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                overflow: 'hidden'
              }}
            >
              <div style={{
                padding: '24px 32px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {selectedTask.post_link ? (
                      <a 
                        href={selectedTask.post_link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                        <PlaySquare size={12} />
                        {selectedTask.task_type === 'subscribe' ? 'Open YouTube Channel' : 'Open YouTube Video'}
                        <ExternalLink size={11} />
                      </a>
                    ) : null}
                    
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                      background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      👥 {selectedTask.slots_remaining !== undefined ? `${selectedTask.slots_remaining} / ${selectedTask.max_claims || 1} slots open` : `${selectedTask.max_claims || 1} slots`}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedTask.task_seq_id ? `Task ID: ${selectedTask.task_seq_id} - ` : ''}{selectedTask.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', padding: '4px', borderRadius: '6px'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '24px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                    background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-subtle)'
                  }}>
                    {selectedTask.task_type === 'like' ? (
                      <>
                        <ThumbsUp size={14} style={{ color: '#ef4444' }} /> LIKE
                      </>
                    ) : selectedTask.task_type === 'comment' ? (
                      <>
                        <MessageSquare size={14} style={{ color: '#3b82f6' }} /> COMMENT
                      </>
                    ) : selectedTask.task_type === 'comment_reply' ? (
                      <>
                        <CornerDownRight size={14} style={{ color: '#a855f7' }} /> REPLY
                      </>
                    ) : selectedTask.task_type === 'subscribe' ? (
                      <>
                        <UserPlus size={14} style={{ color: '#ec4899' }} /> SUBSCRIBE
                      </>
                    ) : (
                      <>
                        <Video size={14} style={{ color: '#10b981' }} /> POST
                      </>
                    )}
                  </span>
                  <span style={{ fontWeight: 700, color: '#10b981', fontSize: '18px', marginLeft: 'auto' }}>
                    ${selectedTask.payment_amount.toFixed(2)}
                  </span>
                </div>

                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <Clock size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                    <p style={{ fontWeight: 700, color: '#f59e0b', marginBottom: '2px' }}>1-Hour Completion Window</p>
                    Once you claim this, you have 1 hour to submit the task.
                  </div>
                </div>

                <div style={{ 
                  background: 'var(--bg-default)', padding: '20px', borderRadius: '14px', 
                  fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <p style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instructions</p>
                  {selectedTask.instructions || 'No special instructions.'}
                </div>

                {(selectedTask.content_body || selectedTask.post_link) && (
                  <div style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.02)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required Content Details</h4>
                    
                    {selectedTask.image_url && selectedTask.task_type === 'post' && (
                      <div style={{ marginBottom: '16px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            🎬 Video to Post:
                          </span>
                          <a
                            href={selectedTask.image_url}
                            target="_blank"
                            download
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              background: '#3b82f6', color: '#fff', padding: '6px 12px',
                              borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                              textDecoration: 'none', whiteSpace: 'nowrap'
                            }}
                          >
                            <Download size={12} /> Download Video
                          </a>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>Download this video and upload it to your YouTube channel according to the instructions.</p>
                      </div>
                    )}

                    {selectedTask.post_link && (
                      <div style={{ marginBottom: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {selectedTask.task_type === 'subscribe' ? '🔗 Target YouTube Channel Link:' : '🔗 Target YouTube Link:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedTask.post_link, 'modal_link')}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: copiedField === 'modal_link' ? '#10b981' : '#ef4444', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            {copiedField === 'modal_link' ? <Check size={13} /> : <Copy size={13} />}
                            {copiedField === 'modal_link' ? 'Copied' : 'Copy Link'}
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: 'var(--bg-default)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', wordBreak: 'break-all' }}>
                            {selectedTask.post_link}
                          </span>
                          <a
                            href={selectedTask.post_link}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              background: '#ef4444', color: '#fff', padding: '6px 12px',
                              borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                              textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0
                            }}
                          >
                            Open Link <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {selectedTask.content_body && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>📝 Comment Text:</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedTask.content_body, 'modal_body')}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: copiedField === 'modal_body' ? '#10b981' : 'var(--accent-blue)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            {copiedField === 'modal_body' ? <Check size={13} /> : <Copy size={13} />}
                            {copiedField === 'modal_body' ? 'Copied' : 'Copy Text'}
                          </button>
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', background: 'var(--bg-default)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', margin: 0 }}>{selectedTask.content_body}</p>
                      </div>
                    )}
                    
                  </div>
                )}
              </div>

              <div style={{
                padding: '20px 32px 28px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'rgba(0,0,0,0.01)',
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={() => setSelectedTask(null)}
                  style={{
                    flex: 1, padding: '13px', borderRadius: '10px',
                    background: 'transparent', color: 'var(--text-secondary)',
                    border: '1px solid var(--border-medium)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleClaim(selectedTask.id)}
                  disabled={claimingId === selectedTask.id}
                  style={{
                    flex: 1, padding: '13px', borderRadius: '10px',
                    background: 'var(--accent-blue)', color: '#fff',
                    border: 'none', fontSize: '14px', fontWeight: 600, cursor: claimingId === selectedTask.id ? 'not-allowed' : 'pointer',
                    opacity: claimingId === selectedTask.id ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'opacity 0.2s',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <PlusCircle size={18} />
                  {claimingId === selectedTask.id ? 'Claiming Task...' : 'Claim Task Now'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
