'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reviewSubmission } from '@/actions/tasks';
import { Check, X, Link as LinkIcon, Image as ImageIcon, MessageSquare, AlertCircle, Type, ArrowBigUp, Share2, Eye, EyeOff } from 'lucide-react';
import { getRedditUsername } from '@/utils/reddit';

export default function SubmissionsTable({ initialSubmissions }: { initialSubmissions: any[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [claimToReject, setClaimToReject] = useState<string | null>(null);
  const [rejectReasonType, setRejectReasonType] = useState<string>("Removed by reddit filter");
  const [customReason, setCustomReason] = useState<string>("");
  const [expandedClaims, setExpandedClaims] = useState<Record<string, boolean>>({});

  const toggleExpand = (claimId: string) => {
    setExpandedClaims(prev => ({ ...prev, [claimId]: !prev[claimId] }));
  };

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [claimToApprove, setClaimToApprove] = useState<string | null>(null);
  const [approveType, setApproveType] = useState<'standard' | 'bonus'>('standard');
  const [bonusAmount, setBonusAmount] = useState<string>("0.50");

  const handleReview = async (claimId: string, action: 'approved' | 'rejected', notes: string | null = null, bonus: number = 0) => {
    setProcessingId(claimId);
    
    const form = new FormData();
    form.append('claim_id', claimId);
    form.append('action', action);
    if (notes) {
      form.append('admin_notes', notes);
    }
    if (action === 'approved') {
      form.append('bonus_amount', String(bonus));
    }
    
    const res = await reviewSubmission(form);
    
    if (res.error) {
      alert("Error: " + res.error);
      setProcessingId(null);
    } else {
      setSubmissions(submissions.map(s => s.id === claimId ? { ...s, status: action, admin_notes: notes || undefined, bonus_amount: action === 'approved' ? bonus : 0.00 } : s));
      setProcessingId(null);
    }
  };

  const handleApproveClick = (claimId: string) => {
    setClaimToApprove(claimId);
    setApproveType('standard');
    setBonusAmount("0.50");
    setApproveModalOpen(true);
  };

  const submitApprove = () => {
    if (!claimToApprove) return;
    const finalBonus = approveType === 'bonus' ? parseFloat(bonusAmount) : 0.00;
    if (approveType === 'bonus' && (isNaN(finalBonus) || finalBonus < 0)) {
      alert("Please provide a valid bonus amount.");
      return;
    }
    
    setApproveModalOpen(false);
    handleReview(claimToApprove, 'approved', null, finalBonus);
  };

  const handleRejectClick = (claimId: string) => {
    setClaimToReject(claimId);
    setRejectReasonType("Removed by reddit filter");
    setCustomReason("");
    setRejectModalOpen(true);
  };

  const submitReject = () => {
    if (!claimToReject) return;
    const finalReason = rejectReasonType === 'Manual' ? customReason : rejectReasonType;
    if (rejectReasonType === 'Manual' && !finalReason.trim()) {
      alert("Please provide a manual reason.");
      return;
    }
    
    setRejectModalOpen(false);
    handleReview(claimToReject, 'rejected', finalReason);
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'submitted');
  const pastSubmissions = submissions.filter(s => s.status === 'approved' || s.status === 'rejected');

  const renderSubmissionCard = (claim: any, isPast = false) => {
    const task = claim.tasks;
    
    return (
      <motion.div
        key={claim.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-card-item"
        style={{ 
          background: 'var(--bg-elevated)', borderRadius: '16px', 
          border: '1px solid var(--border-subtle)', overflow: 'hidden',
          marginBottom: '16px', padding: '20px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {task.task_seq_id ? `Task ID: ${task.task_seq_id} - ` : ''}{task.title}
                </h3>
                {isPast && (
                  <span style={{ 
                    padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                    background: claim.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: claim.status === 'approved' ? '#10b981' : '#ef4444'
                  }}>
                    {claim.status === 'approved' ? 'Approved' : 'Rejected'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {task.task_type === 'comment' ? (
                    <>
                      <MessageSquare size={13} style={{ color: '#3b82f6' }} />
                      <span>Comment</span>
                    </>
                  ) : task.task_type === 'upvote' ? (
                    <>
                      <ArrowBigUp size={13} style={{ color: '#f97316' }} />
                      <span>Upvote</span>
                    </>
                  ) : task.task_type === 'crosspost' ? (
                    <>
                      <Share2 size={13} style={{ color: '#a855f7' }} />
                      <span>Crosspost</span>
                    </>
                  ) : (task.content_mode === 'image' || Boolean(task.image_url)) ? (
                    <>
                      <ImageIcon size={13} style={{ color: '#10b981' }} />
                      <span>Image Post</span>
                    </>
                  ) : (
                    <>
                      <Type size={13} style={{ color: '#8b5cf6' }} />
                      <span>Text Post</span>
                    </>
                  )}
                </div>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>User: <strong>{claim.users?.full_name ? `${claim.users.full_name} (${claim.users.email})` : claim.users?.email}</strong></span>
                </div>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Account: {claim.reddit_accounts?.reddit_profile_link ? (
                    <>
                      <strong>u/{getRedditUsername(claim.reddit_accounts.reddit_profile_link)}</strong>{' '}
                      (<a href={claim.reddit_accounts.reddit_profile_link} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>
                        Profile ↗
                      </a>)
                    </>
                  ) : 'N/A'}</span>
                </div>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Payout: <strong style={{ color: '#10b981' }}>${Number(task.payment_amount).toFixed(2)}</strong>
                    {Number(claim.bonus_amount) > 0 && (
                      <span style={{ color: '#a855f7', marginLeft: '4px', fontWeight: 600 }}>
                        (+ ${Number(claim.bonus_amount).toFixed(2)} Bonus)
                      </span>
                    )}
                  </span>
                </div>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={() => toggleExpand(claim.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--accent-blue)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {expandedClaims[claim.id] ? (
                      <><EyeOff size={13} /> Hide Task Details</>
                    ) : (
                      <><Eye size={13} /> View Task Details</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Task Details Collapsible */}
          {expandedClaims[claim.id] && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '13px'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px', margin: 0 }}>
                Task Specification
              </h4>
              
              {task.post_link && (
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Target Post Link:</span>{' '}
                  <a href={task.post_link} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none', wordBreak: 'break-all' }}>
                    {task.post_link} ↗
                  </a>
                </div>
              )}
              
              {task.instructions && (
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Instructions:</span>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                    {task.instructions}
                  </div>
                </div>
              )}
              
              {task.content_body && (
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Post Body Content:</span>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.4', fontFamily: 'monospace' }}>
                    {task.content_body}
                  </div>
                </div>
              )}
              
              {task.flair && (
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Required Flair:</span>{' '}
                  <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {task.flair}
                  </span>
                </div>
              )}
              
              {task.image_url && (
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Reference Image:</span>
                  <img 
                    src={task.image_url} 
                    alt="Task Reference" 
                    style={{ maxHeight: '180px', borderRadius: '8px', border: '1px solid var(--border-subtle)', objectFit: 'contain' }} 
                  />
                </div>
              )}
            </div>
          )}

          {/* Submitted Work */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.08)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Submitted Work</h4>
            
            {claim.screenshot_url && (
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Screenshot Proof:</p>
                <a href={claim.screenshot_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', fontSize: '13px', wordBreak: 'break-all', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  {claim.screenshot_url} <LinkIcon size={12} />
                </a>
                <div style={{ marginTop: '4px' }}>
                  <img 
                    src={claim.screenshot_url} 
                    alt="Proof Screenshot" 
                    style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border-medium)', objectFit: 'contain', cursor: 'pointer', background: '#111' }} 
                    onClick={() => window.open(claim.screenshot_url, '_blank')} 
                  />
                </div>
              </div>
            )}

            {task.task_type !== 'upvote' && claim.reddit_url && (
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px' }}>Reddit URL:</p>
                <a href={claim.reddit_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', fontSize: '13px', wordBreak: 'break-all', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {claim.reddit_url} <LinkIcon size={12} />
                </a>
              </div>
            )}
            
            {claim.admin_notes && (
               <div style={{ marginTop: '4px', color: '#ef4444', fontSize: '12px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px' }}>
                 <strong>Rejection Reason:</strong> {claim.admin_notes}
               </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
            {claim.status !== 'approved' && (
              <button
                onClick={() => handleApproveClick(claim.id)}
                disabled={processingId === claim.id}
                style={{
                  flex: 1, minWidth: '120px', padding: '10px 16px', borderRadius: '8px',
                  background: '#10b981', color: 'white', border: 'none',
                  fontSize: '13px', fontWeight: 600, cursor: processingId === claim.id ? 'not-allowed' : 'pointer',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', opacity: processingId === claim.id ? 0.5 : 1
                }}
              >
                <Check size={16} /> Approve
              </button>
            )}
            {claim.status !== 'rejected' && (
              <button
                onClick={() => handleRejectClick(claim.id)}
                disabled={processingId === claim.id}
                style={{
                  flex: 1, minWidth: '120px', padding: '10px 16px', borderRadius: '8px',
                  background: '#ef4444', color: 'white', border: 'none',
                  fontSize: '13px', fontWeight: 600, cursor: processingId === claim.id ? 'not-allowed' : 'pointer',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', opacity: processingId === claim.id ? 0.5 : 1
                }}
              >
                <X size={16} /> Reject
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Review Submissions</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Approve or reject work submitted by workers.</p>
        </div>
      </div>

      <div style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Needs Review ({pendingSubmissions.length})</h2>
        {pendingSubmissions.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px dashed var(--border-medium)' }}>
            <p style={{ color: 'var(--text-muted)' }}>All caught up! No pending submissions.</p>
          </div>
        ) : (
          <div>
            {pendingSubmissions.map(s => renderSubmissionCard(s))}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Past Reviews</h2>
        {pastSubmissions.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px dashed var(--border-medium)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No past reviews yet.</p>
          </div>
        ) : (
          <div style={{ opacity: 0.85 }}>
            {pastSubmissions.map(s => renderSubmissionCard(s, true))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setRejectModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                position: 'relative', background: 'var(--bg-elevated)', borderRadius: '20px',
                padding: '24px', width: '90%', maxWidth: '400px', border: '1px solid var(--border-medium)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Reject Submission</h3>
                <button onClick={() => setRejectModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Select Reason</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {["Removed by reddit filter", "Removed by mod", "Username doesn't match", "Manual"].map((reason) => (
                    <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px 12px', background: rejectReasonType === reason ? 'rgba(139, 92, 246, 0.1)' : 'rgba(0,0,0,0.2)', border: `1px solid ${rejectReasonType === reason ? '#8b5cf6' : 'var(--border-subtle)'}`, borderRadius: '8px', transition: 'all 0.2s' }}>
                      <input
                        type="radio"
                        name="rejectReason"
                        value={reason}
                        checked={rejectReasonType === reason}
                        onChange={(e) => setRejectReasonType(e.target.value)}
                        style={{ accentColor: '#8b5cf6' }}
                      />
                      {reason}
                    </label>
                  ))}
                </div>

                {rejectReasonType === 'Manual' && (
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Custom Reason</label>
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Type custom rejection reason..."
                      rows={3}
                      style={{
                        width: '100%', padding: '12px', borderRadius: '10px',
                        background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)', fontSize: '14px', resize: 'vertical'
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={() => setRejectModalOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitReject}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#ef4444', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                >
                  Confirm Reject
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Approve Modal */}
      <AnimatePresence>
        {approveModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setApproveModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                position: 'relative', background: 'var(--bg-elevated)', borderRadius: '20px',
                padding: '24px', width: '90%', maxWidth: '400px', border: '1px solid var(--border-medium)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Approve Submission</h3>
                <button onClick={() => setApproveModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Bonus Options</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px 12px', background: approveType === 'standard' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.2)', border: `1px solid ${approveType === 'standard' ? '#10b981' : 'var(--border-subtle)'}`, borderRadius: '8px', transition: 'all 0.2s' }}>
                    <input
                      type="radio"
                      name="approveType"
                      value="standard"
                      checked={approveType === 'standard'}
                      onChange={() => setApproveType('standard')}
                      style={{ accentColor: '#10b981' }}
                    />
                    Without Bonus (Standard Payout)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px 12px', background: approveType === 'bonus' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(0,0,0,0.2)', border: `1px solid ${approveType === 'bonus' ? '#8b5cf6' : 'var(--border-subtle)'}`, borderRadius: '8px', transition: 'all 0.2s' }}>
                    <input
                      type="radio"
                      name="approveType"
                      value="bonus"
                      checked={approveType === 'bonus'}
                      onChange={() => setApproveType('bonus')}
                      style={{ accentColor: '#8b5cf6' }}
                    />
                    With Bonus
                  </label>
                </div>

                {approveType === 'bonus' && (
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Bonus Amount ($)</label>
                    <input
                      type="number"
                      step="0.10"
                      min="0.01"
                      value={bonusAmount}
                      onChange={(e) => setBonusAmount(e.target.value)}
                      placeholder="0.50"
                      style={{
                        width: '100%', padding: '12px', borderRadius: '10px',
                        background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)', fontSize: '14px'
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={() => setApproveModalOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitApprove}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#10b981', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                >
                  Confirm Approve
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
