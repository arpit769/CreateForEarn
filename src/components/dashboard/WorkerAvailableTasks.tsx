'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { claimTask } from '@/actions/tasks';
import { PlusCircle, Search, Clock, DollarSign, Image as ImageIcon, MessageSquare, AlertCircle, Link as LinkIcon, X, Eye, Download, Copy, Check, Type } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WorkerAvailableTasks({ initialTasks }: { initialTasks: any[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const router = useRouter();

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadImage = async (imageUrl: string, filename = 'reddit-task-asset.png') => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      window.open(imageUrl, '_blank');
    }
  };

  const handleClaim = async (taskId: string) => {
    if (!confirm('Are you sure you want to claim this task? You will have 30 minutes to complete it.')) return;
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
    }
  };

  const getInstructions = (t: any) => {
    if (t.task_type === 'post' && (!t.content_body && !t.image_url && !t.post_link)) {
      return 'User will use their own content';
    }
    return t.instructions || 'No special instructions.';
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.instructions?.toLowerCase().includes(search.toLowerCase()) ||
    t.subreddits?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-content-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Available Tasks</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Browse and claim tasks matching your verified subreddits.</p>
        </div>
      </div>

      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '400px' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search tasks or subreddits..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ 
            width: '100%', padding: '14px 16px 14px 48px', 
            background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', 
            borderRadius: '12px', color: 'var(--text-primary)', fontSize: '15px', outline: 'none' 
          }}
        />
      </div>

      {tasks.length === 0 ? (
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '64px 24px',
          textAlign: 'center'
        }}>
          <AlertCircle size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No Tasks Available</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', fontSize: '14px' }}>
            There are currently no tasks available matching your active reddit account or subreddit permissions. Check back soon!
          </p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{ 
          background: 'var(--bg-elevated)', borderRadius: '16px', padding: '64px', 
          textAlign: 'center', border: '1px solid var(--border-subtle)' 
        }}>
          <p style={{ color: 'var(--text-secondary)' }}>No tasks match your search criteria.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                height: '240px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <div style={{ 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                      background: task.subreddits?.name ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: task.subreddits?.name ? 'var(--accent-blue)' : '#10b981',
                      border: `1px solid ${task.subreddits?.name ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                    }}>
                      {task.subreddits?.name ? `r/${task.subreddits.name}` : 'Open for All'}
                    </div>

                    {task.flair && (
                      <div style={{
                        padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                        background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        🏷️ {task.flair}
                      </div>
                    )}

                    <div style={{
                      padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                      background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      👥 {task.slots_remaining !== undefined ? `${task.slots_remaining} / ${task.max_claims || 1} slots` : `${task.max_claims || 1} slot`}
                    </div>
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
                    lineHeight: '1.3',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {task.title}
                  </h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {task.task_type === 'comment' ? (
                        <>
                          <MessageSquare size={12} />
                          <span>Comment Task</span>
                        </>
                      ) : (task.content_mode === 'image' || Boolean(task.image_url)) ? (
                        <>
                          <ImageIcon size={12} />
                          <span>Image Post</span>
                        </>
                      ) : (
                        <>
                          <Type size={12} />
                          <span>Text Post</span>
                        </>
                      )}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 500 }}>
                      <Clock size={12} /> 30m window
                    </span>
                  </div>
                </div>

                <div style={{ 
                  fontSize: '13px', 
                  color: 'var(--text-muted)', 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: '8px'
                }}>
                  {getInstructions(task)}
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
                  onClick={() => setSelectedTask(task)}
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: '8px',
                    background: 'var(--bg-default)', color: 'var(--text-primary)',
                    border: '1px solid var(--border-medium)', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    transition: 'background 0.2s'
                  }}
                >
                  <Eye size={14} /> View Details
                </button>
                <button
                  onClick={() => handleClaim(task.id)}
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
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                      background: selectedTask.subreddits?.name ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: selectedTask.subreddits?.name ? 'var(--accent-blue)' : '#10b981',
                      border: `1px solid ${selectedTask.subreddits?.name ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                    }}>
                      {selectedTask.subreddits?.name ? `r/${selectedTask.subreddits.name}` : 'Open for All Subreddits'}
                    </span>
                    {selectedTask.flair && (
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                        background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        🏷️ Flair: {selectedTask.flair}
                      </span>
                    )}
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                      background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      👥 {selectedTask.slots_remaining !== undefined ? `${selectedTask.slots_remaining} / ${selectedTask.max_claims || 1} slots open` : `${selectedTask.max_claims || 1} slots`}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedTask.title}
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

              <div style={{ padding: '24px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                    background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-subtle)'
                  }}>
                    {selectedTask.task_type === 'comment' ? (
                      <>
                        <MessageSquare size={14} /> COMMENT
                      </>
                    ) : (selectedTask.content_mode === 'image' || Boolean(selectedTask.image_url)) ? (
                      <>
                        <ImageIcon size={14} /> IMAGE POST
                      </>
                    ) : (
                      <>
                        <Type size={14} /> TEXT POST
                      </>
                    )}
                  </span>
                  <span style={{ fontWeight: 700, color: '#10b981', fontSize: '18px' }}>
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
                    <p style={{ fontWeight: 700, color: '#f59e0b', marginBottom: '2px' }}>30-Minute Completion Window</p>
                    Once you claim this, you have 30 minutes to submit the task.
                  </div>
                </div>

                <div style={{ 
                  background: 'var(--bg-default)', padding: '20px', borderRadius: '14px', 
                  fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <p style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instructions</p>
                  {getInstructions(selectedTask)}
                </div>

                {(selectedTask.title || selectedTask.flair || selectedTask.content_body || selectedTask.image_url || selectedTask.post_link) && (
                  <div style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.02)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required Content Details</h4>
                    
                    {selectedTask.title && !selectedTask.title.startsWith('User-Generated') && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>📌 Post Title to Use:</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedTask.title, 'modal_title')}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: copiedField === 'modal_title' ? '#10b981' : 'var(--accent-blue)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            {copiedField === 'modal_title' ? <Check size={13} /> : <Copy size={13} />}
                            {copiedField === 'modal_title' ? 'Copied' : 'Copy Title'}
                          </button>
                        </div>
                        <div style={{ background: 'var(--bg-default)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                          {selectedTask.title}
                        </div>
                      </div>
                    )}

                    {selectedTask.flair && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>🏷️ Post Flair to Select:</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedTask.flair, 'modal_flair')}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: copiedField === 'modal_flair' ? '#10b981' : 'var(--accent-blue)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            {copiedField === 'modal_flair' ? <Check size={13} /> : <Copy size={13} />}
                            {copiedField === 'modal_flair' ? 'Copied' : 'Copy Flair'}
                          </button>
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.06)', padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' }}>
                          {selectedTask.flair}
                        </div>
                      </div>
                    )}

                    {selectedTask.post_link && (
                      <div style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>🔗 Reference Post Link:</p>
                        <a href={selectedTask.post_link} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                          <LinkIcon size={14} /> View Reference Post
                        </a>
                      </div>
                    )}
                    
                    {selectedTask.content_body && (
                      <div style={{ marginBottom: selectedTask.image_url ? '16px' : '0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>📝 Post Body Text to Use:</span>
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
                    
                    {selectedTask.image_url && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>🖼️ Attached Image Asset:</span>
                          <button
                            type="button"
                            onClick={() => handleDownloadImage(selectedTask.image_url)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'var(--accent-blue)',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                            }}
                          >
                            <Download size={13} />
                            Download Image Asset
                          </button>
                        </div>
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#000' }}>
                          <img src={selectedTask.image_url} alt="Task Asset" style={{ maxWidth: '100%', maxHeight: '350px', objectFit: 'contain', width: '100%', display: 'block' }} />
                        </div>
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
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  Close
                </button>

                <button
                  onClick={() => handleClaim(selectedTask.id)}
                  disabled={claimingId === selectedTask.id}
                  style={{
                    flex: 1.5, padding: '13px', borderRadius: '10px',
                    background: 'var(--text-primary)', color: 'var(--bg-primary)',
                    border: 'none', fontSize: '14px', fontWeight: 600, cursor: claimingId === selectedTask.id ? 'not-allowed' : 'pointer',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                    opacity: claimingId === selectedTask.id ? 0.7 : 1, transition: 'all 0.2s'
                  }}
                >
                  {claimingId === selectedTask.id ? 'Claiming...' : (
                    <>
                      <PlusCircle size={18} />
                      Claim & Start Task
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}



