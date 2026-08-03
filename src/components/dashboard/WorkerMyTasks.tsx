'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitTaskWork } from '@/actions/tasks';
import { CheckCircle2, Clock, Upload, Link as LinkIcon, FileText, AlertCircle, Image as ImageIcon, MessageSquare } from 'lucide-react';

export default function WorkerMyTasks({ initialClaims }: { initialClaims: any[] }) {
  const [claims, setClaims] = useState(initialClaims);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  
  // Form state per claim
  const [formData, setFormData] = useState<Record<string, { reddit_url: string, screenshot_url?: string }>>({});

  const handleInputChange = (claimId: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [claimId]: {
        ...prev[claimId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (claimId: string) => {
    const data = formData[claimId];
    if (!data?.reddit_url?.trim()) {
      alert("Please provide the Reddit URL before submitting.");
      return;
    }
    
    setSubmittingId(claimId);
    
    const form = new FormData();
    form.append('claim_id', claimId);
    form.append('reddit_url', data.reddit_url.trim());
    if (data.screenshot_url?.trim()) {
      form.append('screenshot_url', data.screenshot_url.trim());
    }
    
    const res = await submitTaskWork(form);
    
    if (res.error) {
      alert("Failed to submit work: " + res.error);
      setSubmittingId(null);
    } else {
      // Update local state
      setClaims(claims.map(c => c.id === claimId ? { ...c, status: 'submitted' } : c));
      setSubmittingId(null);
      alert("Work submitted successfully! Pending admin approval.");
    }
  };

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'claimed': return { text: 'Action Required', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'submitted': return { text: 'In Review', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
      case 'approved': return { text: 'Approved & Paid', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'rejected': return { text: 'Rejected', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
      default: return { text: status, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>My Tasks</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Track and submit work for your claimed tasks.</p>
      </div>

      {claims.length === 0 ? (
        <div style={{ 
          background: 'var(--bg-elevated)', borderRadius: '16px', padding: '64px', 
          textAlign: 'center', border: '1px solid var(--border-subtle)' 
        }}>
          <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.5 }} />
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No Claimed Tasks</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You haven't claimed any tasks yet. Head over to Available Tasks to find work!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <AnimatePresence>
            {claims.map((claim) => {
              const task = claim.tasks;
              const status = getStatusDisplay(claim.status);
              
              return (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ 
                    background: 'var(--bg-elevated)', borderRadius: '16px', 
                    border: '1px solid var(--border-subtle)', overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {task.title}
                          </h3>
                          <div style={{ 
                            padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                            background: status.bg, color: status.color
                          }}>
                            {status.text}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {task.task_type === 'post' ? <ImageIcon size={14} /> : <MessageSquare size={14} />}
                            <span style={{ textTransform: 'capitalize' }}>{task.task_type}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>r/{task.subreddits?.name || 'Open for All'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#10b981' }}>
                            <span>${task.payment_amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div style={{ background: 'var(--bg-default)', padding: '16px', borderRadius: '12px', fontSize: '14px', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                      <p style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>Instructions:</p>
                      {task.instructions}
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

                    {/* Rejection Note if applicable */}
                    {claim.status === 'rejected' && claim.admin_notes && (
                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '16px', borderRadius: '12px', fontSize: '14px', color: '#ef4444' }}>
                        <p style={{ fontWeight: 600, marginBottom: '4px' }}>Admin Feedback (Rejected):</p>
                        {claim.admin_notes}
                      </div>
                    )}

                    {/* Submission Form for 'claimed' tasks */}
                    {claim.status === 'claimed' && (
                      <div style={{ marginTop: '8px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Submit Your Work</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Reddit Link (Required)</label>
                            <div style={{ position: 'relative' }}>
                              <LinkIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                              <input 
                                type="text"
                                placeholder="https://reddit.com/r/..."
                                value={formData[claim.id]?.reddit_url || ''}
                                onChange={e => handleInputChange(claim.id, 'reddit_url', e.target.value)}
                                style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px' }}
                              />
                            </div>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Screenshot Link (Optional)</label>
                            <div style={{ position: 'relative' }}>
                              <Upload size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                              <input 
                                type="text"
                                placeholder="https://imgur.com/..."
                                value={formData[claim.id]?.screenshot_url || ''}
                                onChange={e => handleInputChange(claim.id, 'screenshot_url', e.target.value)}
                                style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px' }}
                              />
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleSubmit(claim.id)}
                            disabled={submittingId === claim.id || !(formData[claim.id]?.reddit_url?.trim())}
                            style={{ 
                              padding: '12px', background: 'var(--text-primary)', color: 'var(--bg-primary)', 
                              border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                              opacity: (submittingId === claim.id || !(formData[claim.id]?.reddit_url?.trim())) ? 0.5 : 1
                            }}
                          >
                            {submittingId === claim.id ? 'Submitting...' : (
                              <>
                                <CheckCircle2 size={18} />
                                Submit Work for Review
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Readonly Details for submitted/approved/rejected */}
                    {claim.status !== 'claimed' && (
                      <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Your Submission</h4>
                        <a href={claim.reddit_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--accent-blue)', textDecoration: 'none', marginBottom: '4px' }}>
                          <LinkIcon size={14} /> View Reddit Post
                        </a>
                        {claim.screenshot_url && (
                          <a href={claim.screenshot_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--accent-blue)', textDecoration: 'none' }}>
                            <ImageIcon size={14} /> View Screenshot
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
