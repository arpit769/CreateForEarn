'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reviewSubmission } from '@/actions/tasks';
import { Check, X, Link as LinkIcon, Image as ImageIcon, MessageSquare, AlertCircle, Type } from 'lucide-react';

export default function SubmissionsTable({ initialSubmissions }: { initialSubmissions: any[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleReview = async (claimId: string, action: 'approved' | 'rejected') => {
    const notes = action === 'rejected' ? prompt("Please provide a reason for rejection:") : null;
    
    if (action === 'rejected' && !notes) {
      return; // cancelled
    }
    
    setProcessingId(claimId);
    
    const form = new FormData();
    form.append('claim_id', claimId);
    form.append('action', action);
    if (notes) {
      form.append('admin_notes', notes);
    }
    
    const res = await reviewSubmission(form);
    
    if (res.error) {
      alert("Error: " + res.error);
      setProcessingId(null);
    } else {
      setSubmissions(submissions.map(s => s.id === claimId ? { ...s, status: action, admin_notes: notes || undefined } : s));
      setProcessingId(null);
    }
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
                  {task.task_seq_id ? `#${task.task_seq_id}: ` : ''}{task.title}
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
                      <MessageSquare size={13} />
                      <span>Comment</span>
                    </>
                  ) : (task.content_mode === 'image' || Boolean(task.image_url)) ? (
                    <>
                      <ImageIcon size={13} />
                      <span>Image Post</span>
                    </>
                  ) : (
                    <>
                      <Type size={13} />
                      <span>Text Post</span>
                    </>
                  )}
                </div>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>User: <strong>{claim.users?.email}</strong></span>
                </div>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Account: {claim.reddit_accounts?.reddit_profile_link ? (
                    <a href={claim.reddit_accounts.reddit_profile_link} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>
                      Profile ↗
                    </a>
                  ) : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submitted Work */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.08)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Submitted Work</h4>
            
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px' }}>Reddit URL:</p>
              <a href={claim.reddit_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', fontSize: '13px', wordBreak: 'break-all', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {claim.reddit_url} <LinkIcon size={12} />
              </a>
            </div>
            
            {claim.screenshot_url && (
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px' }}>Screenshot URL:</p>
                <a href={claim.screenshot_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', fontSize: '13px', wordBreak: 'break-all', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {claim.screenshot_url} <LinkIcon size={12} />
                </a>
              </div>
            )}
            
            {claim.admin_notes && (
               <div style={{ marginTop: '4px', color: '#ef4444', fontSize: '12px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px' }}>
                 <strong>Rejection Reason:</strong> {claim.admin_notes}
               </div>
            )}
          </div>

          {/* Action Buttons for Pending */}
          {!isPast && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleReview(claim.id, 'approved')}
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
              <button
                onClick={() => handleReview(claim.id, 'rejected')}
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
            </div>
          )}
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
    </div>
  );
}
