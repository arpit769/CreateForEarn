'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reviewSubmission } from '@/actions/tasks';
import { Check, X, Link as LinkIcon, Image as ImageIcon, MessageSquare, AlertCircle } from 'lucide-react';

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
        style={{ 
          background: 'var(--bg-elevated)', borderRadius: '16px', 
          border: '1px solid var(--border-subtle)', overflow: 'hidden',
          marginBottom: '24px'
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
                {isPast && (
                  <div style={{ 
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: claim.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: claim.status === 'approved' ? '#10b981' : '#ef4444'
                  }}>
                    {claim.status === 'approved' ? 'Approved' : 'Rejected'}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {task.task_type === 'post' ? <ImageIcon size={14} /> : <MessageSquare size={14} />}
                  <span style={{ textTransform: 'capitalize' }}>{task.task_type}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>User: {claim.users?.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Account: {claim.reddit_accounts?.reddit_profile_link || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submitted Work */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Submitted Work</h4>
            
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Reddit URL:</p>
              <a href={claim.reddit_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', fontSize: '14px', wordBreak: 'break-all' }}>
                {claim.reddit_url}
              </a>
            </div>
            
            {claim.screenshot_url && (
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Screenshot URL:</p>
                <a href={claim.screenshot_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', fontSize: '14px', wordBreak: 'break-all' }}>
                  {claim.screenshot_url}
                </a>
              </div>
            )}
            
            {claim.admin_notes && (
               <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>
                 <strong>Rejection Reason:</strong> {claim.admin_notes}
               </div>
            )}
          </div>

          {/* Action Buttons for Pending */}
          {!isPast && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => handleReview(claim.id, 'approved')}
                disabled={processingId === claim.id}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px',
                  background: '#10b981', color: 'white', border: 'none',
                  fontSize: '14px', fontWeight: 600, cursor: processingId === claim.id ? 'not-allowed' : 'pointer',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: processingId === claim.id ? 0.5 : 1
                }}
              >
                <Check size={18} /> Approve
              </button>
              <button
                onClick={() => handleReview(claim.id, 'rejected')}
                disabled={processingId === claim.id}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px',
                  background: '#ef4444', color: 'white', border: 'none',
                  fontSize: '14px', fontWeight: 600, cursor: processingId === claim.id ? 'not-allowed' : 'pointer',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: processingId === claim.id ? 0.5 : 1
                }}
              >
                <X size={18} /> Reject
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Review Submissions</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Approve or reject work submitted by workers.</p>
      </div>

      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Needs Review ({pendingSubmissions.length})</h2>
        {pendingSubmissions.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px dashed var(--border-medium)' }}>
            <p style={{ color: 'var(--text-muted)' }}>All caught up! No pending submissions.</p>
          </div>
        ) : (
          <div>
            {pendingSubmissions.map(s => renderSubmissionCard(s))}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Past Reviews</h2>
        {pastSubmissions.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px dashed var(--border-medium)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No past reviews yet.</p>
          </div>
        ) : (
          <div style={{ opacity: 0.8 }}>
            {pastSubmissions.map(s => renderSubmissionCard(s, true))}
          </div>
        )}
      </div>
    </div>
  );
}
