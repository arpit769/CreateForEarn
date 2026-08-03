'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { claimTask } from '@/actions/tasks';
import { PlusCircle, Search, Clock, DollarSign, Image as ImageIcon, MessageSquare, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WorkerAvailableTasks({ initialTasks }: { initialTasks: any[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const router = useRouter();

  const handleClaim = async (taskId: string) => {
    if (!confirm('Are you sure you want to claim this task? You will have 24 hours to complete it.')) return;
    setClaimingId(taskId);
    
    const res = await claimTask(taskId);
    if (res.error) {
      alert("Failed to claim task: " + res.error);
      setClaimingId(null);
    } else {
      // Remove task from available list
      setTasks(tasks.filter(t => t.id !== taskId));
      setClaimingId(null);
      alert("Task claimed successfully!");
      // Option: router.push('/worker/my-tasks');
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.instructions?.toLowerCase().includes(search.toLowerCase()) ||
    t.subreddits?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
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
                  display: 'flex', flexDirection: 'column'
                }}
              >
                <div style={{ padding: '24px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                      background: task.subreddits?.name ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: task.subreddits?.name ? 'var(--accent-blue)' : '#10b981',
                      border: `1px solid ${task.subreddits?.name ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                    }}>
                      {task.subreddits?.name ? `r/${task.subreddits.name}` : 'Open for All'}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 700, fontSize: '18px' }}>
                      <DollarSign size={18} />
                      {task.payment_amount.toFixed(2)}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: '1.4' }}>
                    {task.title}
                  </h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {task.task_type === 'post' ? <ImageIcon size={14} /> : <MessageSquare size={14} />}
                      <span style={{ textTransform: 'capitalize' }}>{task.task_type} Task</span>
                    </div>
                  </div>

                  <div style={{ 
                    background: 'var(--bg-default)', padding: '16px', borderRadius: '12px', 
                    fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6',
                    border: '1px solid var(--border-subtle)', marginBottom: '16px'
                  }}>
                    {task.instructions || 'No special instructions provided.'}
                  </div>

                  {/* Content Details */}
                  {(task.content_body || task.image_url || task.post_link) && (
                    <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Content Details</h4>
                      
                      {task.post_link && (
                        <div style={{ marginBottom: '12px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Reference Post:</p>
                          <a href={task.post_link} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <LinkIcon size={14} /> View Reference Post
                          </a>
                        </div>
                      )}
                      
                      {task.content_body && (
                        <div style={{ marginBottom: task.image_url ? '12px' : '0' }}>
                          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Text Content:</p>
                          <p style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{task.content_body}</p>
                        </div>
                      )}
                      
                      {task.image_url && (
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>Attached Image:</p>
                          <img src={task.image_url} alt="Task Image" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border-subtle)' }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.02)' }}>
                  <button
                    onClick={() => handleClaim(task.id)}
                    disabled={claimingId === task.id}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '10px',
                      background: 'var(--text-primary)', color: 'var(--bg-primary)',
                      border: 'none', fontSize: '14px', fontWeight: 600, cursor: claimingId === task.id ? 'not-allowed' : 'pointer',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                      opacity: claimingId === task.id ? 0.7 : 1, transition: 'all 0.2s'
                    }}
                  >
                    {claimingId === task.id ? 'Claiming...' : (
                      <>
                        <PlusCircle size={18} />
                        Claim Task
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
