'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { claimTask } from '@/actions/tasks';
import { PlusCircle, Search, Clock, DollarSign, Image as ImageIcon, MessageSquare, AlertCircle, Link as LinkIcon, X, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WorkerAvailableTasks({ initialTasks }: { initialTasks: any[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const router = useRouter();

  const handleClaim = async (taskId: string) => {
    if (!confirm('Are you sure you want to claim this task? You will have 30 minutes to complete it.')) return;
    setClaimingId(taskId);
    
    const res = await claimTask(taskId);
    if (res.error) {
      alert("Failed to claim task: " + res.error);
      setClaimingId(null);
    } else {
      // Remove task from available list
      setTasks(tasks.filter(t => t.id !== taskId));
      setClaimingId(null);
      setSelectedTask(null); // Close modal if open
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
          background: 'var(--bg-elevated)', borderRadius: '16px', padding: '64px', 
          textAlign: 'center', border: '1px solid var(--border-subtle)' 
        }}>
          <AlertCircle size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.5 }} />
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No Tasks Available</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            There are currently no open tasks that match your verified subreddits. Please check back later.
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          <AnimatePresence>
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ 
                  background: 'var(--bg-elevated)', borderRadius: '16px', 
                  border: '1px solid var(--border-subtle)', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                  height: '240px', // Set uniform height for clean grid alignment
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  
                  {/* Top line: Tag + Payout + Slots */}
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

                  {/* Title & Type */}
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
                        {task.task_type === 'post' ? <ImageIcon size={12} /> : <MessageSquare size={12} />}
                        <span style={{ textTransform: 'capitalize' }}>{task.task_type} Task</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 500 }}>
                        <Clock size={12} /> 30m window
                      </span>
                    </div>
                  </div>

                  {/* Truncated Instructions Preview */}
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

                {/* Footer Actions */}
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
                      flex: 1, padding: '10px', borderRadius: '8px',
                      background: 'transparent', color: 'var(--text-secondary)',
                      border: '1px solid var(--border-medium)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <Eye size={15} />
                    View
                  </button>

                  <button
                    onClick={() => handleClaim(task.id)}
                    disabled={claimingId === task.id}
                    style={{
                      flex: 1.2, padding: '10px', borderRadius: '8px',
                      background: 'var(--text-primary)', color: 'var(--bg-primary)',
                      border: 'none', fontSize: '13px', fontWeight: 600, cursor: claimingId === task.id ? 'not-allowed' : 'pointer',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px',
                      opacity: claimingId === task.id ? 0.7 : 1, transition: 'all 0.2s'
                    }}
                  >
                    {claimingId === task.id ? 'Claiming...' : (
                      <>
                        <PlusCircle size={15} />
                        Claim
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Glassmorphic Modal for detailed view */}
      <AnimatePresence>
        {selectedTask && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              style={{
                background: 'var(--bg-elevated)',
                borderRadius: '20px',
                border: '1px solid var(--border-medium)',
                width: '100%',
                maxWidth: '640px',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 24px 50px rgba(0,0,0,0.3)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Sticky Modal Header */}
              <div style={{ 
                padding: '24px 32px 16px', 
                borderBottom: '1px solid var(--border-subtle)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                background: 'var(--bg-elevated)',
                backdropFilter: 'blur(20px)',
                zIndex: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                    background: selectedTask.subreddits?.name ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: selectedTask.subreddits?.name ? 'var(--accent-blue)' : '#10b981',
                    border: `1px solid ${selectedTask.subreddits?.name ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                  }}>
                    {selectedTask.subreddits?.name ? `r/${selectedTask.subreddits.name}` : 'Open for All'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 700, fontSize: '16px' }}>
                    <DollarSign size={16} />
                    {selectedTask.payment_amount.toFixed(2)}
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedTask(null)}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '50%',
                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: '1.3' }}>
                    {selectedTask.title}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {selectedTask.task_type === 'post' ? <ImageIcon size={14} /> : <MessageSquare size={14} />}
                      <span style={{ textTransform: 'capitalize' }}>{selectedTask.task_type} Task</span>
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      👥 {selectedTask.slots_remaining !== undefined ? `${selectedTask.slots_remaining} of ${selectedTask.max_claims || 1} slots open` : `${selectedTask.max_claims || 1} slot`}
                    </span>
                  </div>
                </div>

                {/* 30-Minute Policy Alert */}
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  color: 'var(--text-primary)'
                }}>
                  <Clock size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    <p style={{ fontWeight: 700, color: '#f59e0b', marginBottom: '2px' }}>30-Minute Completion Window</p>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                      Once you claim this slot, you must complete and submit your work within <strong>30 minutes</strong>. If not submitted in time, the slot will expire and release back for other workers.
                    </p>
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

                {/* Content Details inside modal */}
                {(selectedTask.content_body || selectedTask.image_url || selectedTask.post_link) && (
                  <div style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.01)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Content Details</h4>
                    
                    {selectedTask.post_link && (
                      <div style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Reference Post Link:</p>
                        <a href={selectedTask.post_link} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                          <LinkIcon size={14} /> View Reference Post
                        </a>
                      </div>
                    )}
                    
                    {selectedTask.content_body && (
                      <div style={{ marginBottom: selectedTask.image_url ? '16px' : '0' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Text Content to Use:</p>
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', background: 'var(--bg-default)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontFamily: 'monospace' }}>{selectedTask.content_body}</p>
                      </div>
                    )}
                    
                    {selectedTask.image_url && (
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Attached Asset / Image:</p>
                        <img src={selectedTask.image_url} alt="Task Asset" style={{ maxWidth: '100%', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'block', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
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



