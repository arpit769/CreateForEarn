'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitTaskWork } from '@/actions/tasks';
import { 
  CheckCircle2, Clock, Upload, Link as LinkIcon, FileText, 
  AlertCircle, Image as ImageIcon, MessageSquare, X, Eye, ShieldAlert 
} from 'lucide-react';

function ClaimTimer({ claimedAt, status, fullBanner = false }: { claimedAt: string; status: string; fullBanner?: boolean }) {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number; isExpired: boolean; text: string }>({
    minutes: 30,
    seconds: 0,
    isExpired: false,
    text: '30m 00s'
  });

  useEffect(() => {
    if (status !== 'claimed') return;

    const updateTimer = () => {
      const claimedTime = new Date(claimedAt).getTime();
      const now = Date.now();
      const elapsed = now - claimedTime;
      const remaining = 30 * 60 * 1000 - elapsed;

      if (remaining <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, isExpired: true, text: 'Expired' });
      } else {
        const totalSeconds = Math.floor(remaining / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        setTimeLeft({
          minutes,
          seconds,
          isExpired: false,
          text: `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [claimedAt, status]);

  if (status !== 'claimed') return null;

  if (fullBanner) {
    if (timeLeft.isExpired) {
      return (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#ef4444'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
            <p style={{ fontWeight: 700, margin: '0 0 2px 0' }}>30-Minute Time Expired</p>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>This task claim has expired. The slot has been returned to the available pool.</p>
          </div>
        </div>
      );
    }

    const isUrgent = timeLeft.minutes < 5;
    return (
      <div style={{
        background: isUrgent ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
        borderRadius: '12px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        color: isUrgent ? '#ef4444' : '#f59e0b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={18} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
            <p style={{ fontWeight: 700, margin: '0 0 2px 0' }}>Time Remaining to Submit</p>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>Submit within 30 minutes to claim your payout.</p>
          </div>
        </div>
        <span style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace' }}>
          {timeLeft.text}
        </span>
      </div>
    );
  }

  if (timeLeft.isExpired) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px',
        background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)'
      }}>
        <Clock size={11} /> Expired
      </span>
    );
  }

  const isUrgent = timeLeft.minutes < 5;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px',
      background: isUrgent ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
      color: isUrgent ? '#ef4444' : '#f59e0b',
      border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
    }}>
      <Clock size={11} /> {timeLeft.text}
    </span>
  );
}

export default function WorkerMyTasks({ initialClaims }: { initialClaims: any[] }) {
  const [claims, setClaims] = useState(initialClaims);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  
  // Form state per claim
  const [formData, setFormData] = useState<Record<string, { reddit_url: string, screenshot_url?: string }>>({});

  // Initialize form data if opening a claim
  const handleOpenClaim = (claim: any) => {
    setSelectedClaim(claim);
    if (!formData[claim.id]) {
      setFormData(prev => ({
        ...prev,
        [claim.id]: {
          reddit_url: claim.reddit_url || '',
          screenshot_url: claim.screenshot_url || ''
        }
      }));
    }
  };

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
      // Update local claims state
      const updatedClaims = claims.map(c => 
        c.id === claimId 
          ? { ...c, status: 'submitted', reddit_url: data.reddit_url.trim(), screenshot_url: data.screenshot_url?.trim() } 
          : c
      );
      setClaims(updatedClaims);
      setSubmittingId(null);
      setSelectedClaim(null); // Close modal
      alert("Work submitted successfully! Pending admin approval.");
    }
  };

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'claimed': return { text: 'Action Required', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' };
      case 'submitted': return { text: 'In Review', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' };
      case 'approved': return { text: 'Approved & Paid', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' };
      case 'rejected': return { text: 'Rejected', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' };
      case 'expired': return { text: 'Expired', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.2)' };
      default: return { text: status, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.2)' };
    }
  };

  const getInstructions = (task: any) => {
    if (task.task_type === 'post' && (!task.content_body && !task.image_url && !task.post_link)) {
      return 'User will use their own content';
    }
    return task.instructions || 'No special instructions.';
  };

  return (
    <div className="dashboard-content-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>My Tasks</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Track and submit work for your claimed tasks within the 30-minute window.</p>
      </div>

      {claims.length === 0 ? (
        <div style={{ 
          background: 'var(--bg-elevated)', borderRadius: '16px', padding: '64px', 
          textAlign: 'center', border: '1px solid var(--border-subtle)' 
        }}>
          <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.5 }} />
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No Claimed Tasks</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You haven&apos;t claimed any tasks yet. Head over to Available Tasks to find work!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '24px' }}>
          <AnimatePresence>
            {claims.map((claim) => {
              const task = claim.tasks;
              const status = getStatusDisplay(claim.status);
              
              return (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ 
                    background: 'var(--bg-elevated)', borderRadius: '16px', 
                    border: '1px solid var(--border-subtle)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    height: '245px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    
                    {/* Top: Subreddit & Status & Countdown */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                        background: task.subreddits?.name ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: task.subreddits?.name ? 'var(--accent-blue)' : '#10b981',
                        border: `1px solid ${task.subreddits?.name ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                      }}>
                        {task.subreddits?.name ? `r/${task.subreddits.name}` : 'Open for All'}
                      </span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {claim.status === 'claimed' && (
                          <ClaimTimer claimedAt={claim.claimed_at} status={claim.status} />
                        )}
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                          background: status.bg, color: status.color, border: `1px solid ${status.border}`
                        }}>
                          {status.text}
                        </span>
                      </div>
                    </div>

                    {/* Title & Payout */}
                    <div style={{ margin: '12px 0 8px' }}>
                      <h3 style={{ 
                        fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', 
                        margin: '0 0 6px 0', lineHeight: '1.3',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>
                        {task.title}
                      </h3>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {task.task_type === 'post' ? <ImageIcon size={12} /> : <MessageSquare size={12} />}
                          <span style={{ textTransform: 'capitalize' }}>{task.task_type}</span>
                        </span>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>
                          ${task.payment_amount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Instruction snippet */}
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '8px' }}>
                      {getInstructions(task)}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.02)' }}>
                    <button
                      onClick={() => handleOpenClaim(claim)}
                      style={{
                        width: '100%', padding: '10px', borderRadius: '8px',
                        background: 'var(--text-primary)', color: 'var(--bg-primary)',
                        border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Eye size={15} />
                      {claim.status === 'claimed' ? 'View & Submit' : 'View Details'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* DETAILED CLAIM MODAL */}
      <AnimatePresence>
        {selectedClaim && (() => {
          const task = selectedClaim.tasks;
          const status = getStatusDisplay(selectedClaim.status);
          const isPendingSubmit = selectedClaim.status === 'claimed' || selectedClaim.status === 'rejected';
          const inputValues = formData[selectedClaim.id] || { reddit_url: '', screenshot_url: '' };

          return (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex',
              alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: 'spring', duration: 0.4 }}
                style={{
                  background: 'var(--bg-elevated)', borderRadius: '20px', border: '1px solid var(--border-medium)',
                  width: '100%', maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto',
                  boxShadow: '0 24px 50px rgba(0,0,0,0.3)', position: 'relative', display: 'flex', flexDirection: 'column'
                }}
              >
                {/* Modal Sticky Header */}
                <div style={{ 
                  padding: '24px 32px 16px', borderBottom: '1px solid var(--border-subtle)', 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                      background: task.subreddits?.name ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: task.subreddits?.name ? 'var(--accent-blue)' : '#10b981',
                      border: `1px solid ${task.subreddits?.name ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                    }}>
                      {task.subreddits?.name ? `r/${task.subreddits.name}` : 'Open for All'}
                    </span>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                      background: status.bg, color: status.color, border: `1px solid ${status.border}`
                    }}>
                      {status.text}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setSelectedClaim(null)}
                    style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '50%',
                      width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'var(--text-secondary)'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: '1.3' }}>
                      {task.title}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {task.task_type === 'post' ? <ImageIcon size={14} /> : <MessageSquare size={14} />}
                        <span style={{ textTransform: 'capitalize' }}>{task.task_type} Task</span>
                      </span>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>
                        Payout: ${task.payment_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* 30-Minute Live Countdown Banner (for active claimed status) */}
                  {selectedClaim.status === 'claimed' && (
                    <ClaimTimer claimedAt={selectedClaim.claimed_at} status={selectedClaim.status} fullBanner={true} />
                  )}

                  {/* Instructions */}
                  <div style={{ 
                    background: 'var(--bg-default)', padding: '20px', borderRadius: '14px', 
                    fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <p style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instructions</p>
                    {getInstructions(task)}
                  </div>

                  {/* Content Details */}
                  {(task.content_body || task.image_url || task.post_link) && (
                    <div style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.01)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Content Details</h4>
                      
                      {task.post_link && (
                        <div style={{ marginBottom: '16px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Reference Post Link:</p>
                          <a href={task.post_link} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                            <LinkIcon size={14} /> View Reference Post
                          </a>
                        </div>
                      )}
                      
                      {task.content_body && (
                        <div style={{ marginBottom: task.image_url ? '16px' : '0' }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Text Content to Use:</p>
                          <p style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', background: 'var(--bg-default)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontFamily: 'monospace' }}>{task.content_body}</p>
                        </div>
                      )}
                      
                      {task.image_url && (
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Attached Asset / Image:</p>
                          <img src={task.image_url} alt="Task Asset" style={{ maxWidth: '100%', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'block', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rejection Notes */}
                  {selectedClaim.status === 'rejected' && selectedClaim.admin_notes && (
                    <div style={{ 
                      background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', 
                      padding: '16px 20px', borderRadius: '14px', fontSize: '14px', color: '#ef4444' 
                    }}>
                      <p style={{ fontWeight: 700, marginBottom: '6px' }}>Admin Feedback (Rejected):</p>
                      {selectedClaim.admin_notes}
                    </div>
                  )}

                  {/* Submission Form OR Submitted details view */}
                  {isPendingSubmit ? (
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', marginTop: '8px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {selectedClaim.status === 'rejected' ? 'Re-Submit Your Work' : 'Submit Your Work'}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>Reddit Link (Required)</label>
                          <div style={{ position: 'relative' }}>
                            <LinkIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                              type="text"
                              placeholder="https://reddit.com/r/..."
                              value={inputValues.reddit_url}
                              onChange={e => handleInputChange(selectedClaim.id, 'reddit_url', e.target.value)}
                              style={{ width: '100%', padding: '12px 12px 12px 38px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px' }}
                            />
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>Screenshot Link (Optional)</label>
                          <div style={{ position: 'relative' }}>
                            <Upload size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                              type="text"
                              placeholder="https://imgur.com/..."
                              value={inputValues.screenshot_url}
                              onChange={e => handleInputChange(selectedClaim.id, 'screenshot_url', e.target.value)}
                              style={{ width: '100%', padding: '12px 12px 12px 38px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', marginTop: '8px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Submission Details</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <a href={selectedClaim.reddit_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>
                          <LinkIcon size={14} /> View Submitted Reddit Post
                        </a>
                        {selectedClaim.screenshot_url && (
                          <a href={selectedClaim.screenshot_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>
                            <ImageIcon size={14} /> View Submitted Screenshot
                          </a>
                        )}
                      </div>
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
                    onClick={() => setSelectedClaim(null)}
                    style={{
                      flex: 1, padding: '13px', borderRadius: '10px',
                      background: 'transparent', color: 'var(--text-secondary)',
                      border: '1px solid var(--border-medium)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    Cancel
                  </button>

                  {isPendingSubmit && (
                    <button
                      onClick={() => handleSubmit(selectedClaim.id)}
                      disabled={submittingId === selectedClaim.id || !inputValues.reddit_url?.trim()}
                      style={{
                        flex: 1.5, padding: '13px', borderRadius: '10px',
                        background: 'var(--text-primary)', color: 'var(--bg-primary)',
                        border: 'none', fontSize: '14px', fontWeight: 600, cursor: (submittingId === selectedClaim.id || !inputValues.reddit_url?.trim()) ? 'not-allowed' : 'pointer',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                        opacity: (submittingId === selectedClaim.id || !inputValues.reddit_url?.trim()) ? 0.6 : 1, transition: 'all 0.2s'
                      }}
                    >
                      {submittingId === selectedClaim.id ? 'Submitting...' : (
                        <>
                          <CheckCircle2 size={18} />
                          {selectedClaim.status === 'rejected' ? 'Re-Submit Work' : 'Submit Work'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
