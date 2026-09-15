'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reviewSubmission } from '@/actions/tasks';
import { 
  Check, X, Link as LinkIcon, Image as ImageIcon, MessageSquare, 
  AlertCircle, Type, ArrowBigUp, Share2, Eye, EyeOff, ThumbsUp, 
  CornerDownRight, Video, UserPlus, Film, Search, XCircle, Clock, Sparkles 
} from 'lucide-react';
import { getRedditUsername } from '@/utils/reddit';
import { parseMediaItems } from '@/utils/media';
import { parseCommentItems, isMultiCommentTask, getAssignedCommentText } from '@/utils/comments';

export default function SubmissionsTable({ 
  initialSubmissions, 
  initialCounts 
}: { 
  initialSubmissions: any[];
  initialCounts?: { submitted: number; rejected: number; approved: number; all: number };
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [counts, setCounts] = useState(initialCounts || {
    submitted: initialSubmissions.filter(s => s.status === 'submitted').length,
    rejected: initialSubmissions.filter(s => s.status === 'rejected').length,
    approved: initialSubmissions.filter(s => s.status === 'approved').length,
    all: initialSubmissions.length
  });

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [claimToReject, setClaimToReject] = useState<string | null>(null);
  const [rejectReasonType, setRejectReasonType] = useState<string>("Removed by reddit filter");
  const [customReason, setCustomReason] = useState<string>("");
  const [expandedClaims, setExpandedClaims] = useState<Record<string, boolean>>({});

  // Main Status Tab: 'submitted' (Needs Review), 'rejected', 'approved', 'all'
  const [statusTab, setStatusTab] = useState<'submitted' | 'rejected' | 'approved' | 'all'>('submitted');
  // Task Type Filter: 'all', 'post', 'comment', 'upvote', 'crosspost', etc.
  const [typeFilter, setTypeFilter] = useState<string>('all');
  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Detect platform (Reddit, YouTube, or X)
  const isYouTube = useMemo(() => {
    return submissions.some(s => s.tasks?.platform === 'youtube');
  }, [submissions]);

  const isX = useMemo(() => {
    return submissions.some(s => s.tasks?.platform === 'x');
  }, [submissions]);

  const toggleExpand = (claimId: string) => {
    setExpandedClaims(prev => ({ ...prev, [claimId]: !prev[claimId] }));
  };

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [claimToApprove, setClaimToApprove] = useState<string | null>(null);
  const [approveType, setApproveType] = useState<'standard' | 'bonus'>('standard');
  const [bonusAmount, setBonusAmount] = useState<string>("0.50");
  const [reopenTask, setReopenTask] = useState<'yes' | 'no'>('no');

  const handleReview = async (
    claimId: string, 
    action: 'approved' | 'rejected', 
    notes: string | null = null, 
    bonus: number = 0,
    reopen: 'yes' | 'no' = 'yes'
  ) => {
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
    if (action === 'rejected') {
      form.append('reopen_task', reopen);
    }
    
    const res = await reviewSubmission(form);
    
    if (res.error) {
      alert("Error: " + res.error);
      setProcessingId(null);
    } else {
      const prevClaim = submissions.find(s => s.id === claimId);
      const prevStatus = prevClaim?.status;

      setSubmissions(submissions.map(s => s.id === claimId ? { ...s, status: action, admin_notes: notes || undefined, bonus_amount: action === 'approved' ? bonus : 0.00 } : s));
      
      // Update badge counts accurately
      setCounts(prev => {
        const next = { ...prev };
        if (prevStatus === 'submitted') next.submitted = Math.max(0, next.submitted - 1);
        if (action === 'approved') next.approved = next.approved + 1;
        if (action === 'rejected') next.rejected = next.rejected + 1;
        return next;
      });

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
    const claim = submissions.find(s => s.id === claimId);
    setClaimToReject(claimId);
    setRejectReasonType(claim?.tasks?.platform === 'youtube' ? "Channel/Account doesn't match" : (claim?.tasks?.platform === 'x' ? "X handle doesn't match / proof invalid" : "Removed by reddit filter"));
    setCustomReason("");
    setReopenTask('no');
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
    handleReview(claimToReject, 'rejected', finalReason, 0, reopenTask);
  };

  // Helper to check task type matches filter
  const matchesTaskType = (task: any, filter: string) => {
    if (filter === 'all') return true;
    const rawType = (task?.task_type || '').toLowerCase().trim();
    if (filter === 'post') return rawType === 'post' || rawType === 'text' || rawType === 'image' || rawType === 'video' || (!rawType && (!task?.platform || task?.platform === 'reddit'));
    if (filter === 'comment') return rawType === 'comment' || rawType === 'comment_reply' || rawType === 'comments';
    if (filter === 'upvote') return rawType === 'upvote';
    if (filter === 'crosspost') return rawType === 'crosspost';
    if (filter === 'like') return rawType === 'like';
    if (filter === 'repost') return rawType === 'repost';
    if (filter === 'quote_post') return rawType === 'quote_post';
    if (filter === 'follow') return rawType === 'follow';
    if (filter === 'bookmark') return rawType === 'bookmark';
    if (filter === 'subscribe') return rawType === 'subscribe';
    return rawType === filter.toLowerCase();
  };

  // Counts for status tabs
  const pendingCount = counts.submitted;
  const rejectedCount = counts.rejected;
  const approvedCount = counts.approved;
  const totalCount = counts.all;

  // Filter by active status tab first
  const statusFilteredSubmissions = useMemo(() => {
    if (statusTab === 'submitted') return submissions.filter(s => s.status === 'submitted');
    if (statusTab === 'rejected') return submissions.filter(s => s.status === 'rejected');
    if (statusTab === 'approved') return submissions.filter(s => s.status === 'approved');
    return submissions;
  }, [submissions, statusTab]);

  // Compute available task type options and their counts for current status tab
  const typeOptions = useMemo(() => {
    if (isX) {
      return [
        { id: 'all', label: 'All Types', icon: null },
        { id: 'post', label: 'Posts', icon: <Type size={13} style={{ color: '#ffffff' }} /> },
        { id: 'comment', label: 'Comments', icon: <MessageSquare size={13} style={{ color: '#3b82f6' }} /> },
        { id: 'like', label: 'Likes', icon: <ThumbsUp size={13} style={{ color: '#ec4899' }} /> },
        { id: 'repost', label: 'Reposts', icon: <Share2 size={13} style={{ color: '#10b981' }} /> },
        { id: 'quote_post', label: 'Quotes', icon: <MessageSquare size={13} style={{ color: '#06b6d4' }} /> },
        { id: 'follow', label: 'Follows', icon: <UserPlus size={13} style={{ color: '#8b5cf6' }} /> },
        { id: 'bookmark', label: 'Bookmarks', icon: <Check size={13} style={{ color: '#f59e0b' }} /> },
      ];
    }
    if (isYouTube) {
      return [
        { id: 'all', label: 'All Types', icon: null },
        { id: 'like', label: 'Likes', icon: <ThumbsUp size={13} style={{ color: '#ef4444' }} /> },
        { id: 'comment', label: 'Comments & Replies', icon: <MessageSquare size={13} style={{ color: '#3b82f6' }} /> },
        { id: 'subscribe', label: 'Subscribes', icon: <UserPlus size={13} style={{ color: '#ec4899' }} /> },
        { id: 'post', label: 'Video Posts', icon: <Video size={13} style={{ color: '#10b981' }} /> },
      ];
    }
    return [
      { id: 'all', label: 'All Types', icon: null },
      { id: 'post', label: 'Posts', icon: <Type size={13} style={{ color: '#8b5cf6' }} /> },
      { id: 'comment', label: 'Comments', icon: <MessageSquare size={13} style={{ color: '#3b82f6' }} /> },
      { id: 'upvote', label: 'Upvotes', icon: <ArrowBigUp size={13} style={{ color: '#f97316' }} /> },
      { id: 'crosspost', label: 'Crossposts', icon: <Share2 size={13} style={{ color: '#a855f7' }} /> },
    ];
  }, [isYouTube, isX]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: statusFilteredSubmissions.length };
    typeOptions.forEach(opt => {
      if (opt.id !== 'all') {
        counts[opt.id] = statusFilteredSubmissions.filter(s => matchesTaskType(s.tasks, opt.id)).length;
      }
    });
    return counts;
  }, [statusFilteredSubmissions, typeOptions]);

  // Filter by task type and search query
  const finalFilteredSubmissions = useMemo(() => {
    return statusFilteredSubmissions.filter(s => {
      // Task type match
      if (!matchesTaskType(s.tasks, typeFilter)) return false;

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const taskTitle = (s.tasks?.title || '').toLowerCase();
        const taskSeq = s.tasks?.task_seq_id ? String(s.tasks.task_seq_id) : '';
        const userEmail = (s.users?.email || '').toLowerCase();
        const userFullName = (s.users?.full_name || '').toLowerCase();
        const redditLink = (s.reddit_accounts?.reddit_profile_link || '').toLowerCase();
        const ytChannel = (s.youtube_accounts?.channel_name || '').toLowerCase();
        const xHandle = (s.x_accounts?.username || s.x_accounts?.x_handle || '').toLowerCase();
        const adminNotes = (s.admin_notes || '').toLowerCase();
        const redditUrl = (s.reddit_url || '').toLowerCase();

        return taskTitle.includes(query) ||
          taskSeq.includes(query) ||
          `task id: ${taskSeq}`.includes(query) ||
          userEmail.includes(query) ||
          userFullName.includes(query) ||
          redditLink.includes(query) ||
          ytChannel.includes(query) ||
          xHandle.includes(query) ||
          adminNotes.includes(query) ||
          redditUrl.includes(query);
      }

      return true;
    });
  }, [statusFilteredSubmissions, typeFilter, searchQuery]);

  // Infinite Scroll State (Loads 25 items initially, smoothly loads 25 more as you scroll)
  const [visibleCount, setVisibleCount] = useState(25);

  useEffect(() => {
    setTypeFilter('all');
  }, [statusTab]);

  useEffect(() => {
    setVisibleCount(25);
  }, [statusTab, typeFilter, searchQuery]);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 25);
        }
      },
      { threshold: 0.1, rootMargin: '250px' }
    );

    const el = loadMoreRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [finalFilteredSubmissions.length, visibleCount]);

  const visibleSubmissions = finalFilteredSubmissions.slice(0, visibleCount);

  const renderSubmissionCard = (claim: any) => {
    const task = claim.tasks;
    const isPast = claim.status === 'approved' || claim.status === 'rejected';
    const isRejected = claim.status === 'rejected';
    const isApproved = claim.status === 'approved';
    
    return (
      <motion.div
        key={claim.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-card-item"
        style={{ 
          background: 'var(--bg-elevated)', borderRadius: '16px', 
          border: isRejected ? '1px solid rgba(239, 68, 68, 0.35)' : isApproved ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)', 
          overflow: 'hidden',
          marginBottom: '16px', padding: '20px',
          boxShadow: isRejected ? '0 4px 16px rgba(239, 68, 68, 0.06)' : '0 4px 16px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Rejection Header Banner (if in Rejection tab or rejected status) */}
          {isRejected && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#ef4444'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <XCircle size={15} /> Rejection: {claim.admin_notes || 'Rejected by Admin'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString() : ''}
              </span>
            </div>
          )}

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {task.task_seq_id && task.task_category !== 'karma_farm' ? `Task ID: ${task.task_seq_id} - ` : ''}{task.title}
                </h3>
                <span style={{ 
                  padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                  background: claim.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : claim.status === 'submitted' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: claim.status === 'approved' ? '#10b981' : claim.status === 'submitted' ? '#f59e0b' : '#ef4444',
                  border: `1px solid ${claim.status === 'approved' ? 'rgba(16, 185, 129, 0.3)' : claim.status === 'submitted' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                  {claim.status === 'approved' ? 'Approved' : claim.status === 'submitted' ? 'Needs Review' : 'Rejected'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {task.task_type === 'comment' ? (
                    <>
                      <MessageSquare size={13} style={{ color: '#3b82f6' }} />
                      <span style={{ fontWeight: 600, color: '#3b82f6' }}>Comment</span>
                    </>
                  ) : task.task_type === 'comment_reply' ? (
                    <>
                      <CornerDownRight size={13} style={{ color: '#a855f7' }} />
                      <span style={{ fontWeight: 600, color: '#a855f7' }}>Reply</span>
                    </>
                  ) : task.task_type === 'like' ? (
                    <>
                      <ThumbsUp size={13} style={{ color: '#ef4444' }} />
                      <span style={{ fontWeight: 600, color: '#ef4444' }}>Like</span>
                    </>
                  ) : task.task_type === 'subscribe' ? (
                    <>
                      <UserPlus size={13} style={{ color: '#ec4899' }} />
                      <span style={{ fontWeight: 600, color: '#ec4899' }}>Subscribe</span>
                    </>
                  ) : task.task_type === 'upvote' ? (
                    <>
                      <ArrowBigUp size={13} style={{ color: '#f97316' }} />
                      <span style={{ fontWeight: 600, color: '#f97316' }}>Upvote</span>
                    </>
                  ) : task.task_type === 'crosspost' ? (
                    <>
                      <Share2 size={13} style={{ color: '#a855f7' }} />
                      <span style={{ fontWeight: 600, color: '#a855f7' }}>Crosspost</span>
                    </>
                  ) : task.platform === 'youtube' ? (
                    <>
                      <Video size={13} style={{ color: '#ec4899' }} />
                      <span style={{ fontWeight: 600, color: '#ec4899' }}>{parseMediaItems(task.image_url, task.content_mode).length > 1 ? `${parseMediaItems(task.image_url, task.content_mode).length} Videos` : 'Post'}</span>
                    </>
                  ) : (task.content_mode === 'video' || (parseMediaItems(task.image_url, task.content_mode).length > 0 && parseMediaItems(task.image_url, task.content_mode)[0].type === 'video')) ? (
                    <>
                      <Film size={13} style={{ color: '#ec4899' }} />
                      <span style={{ fontWeight: 600, color: '#ec4899' }}>{parseMediaItems(task.image_url, task.content_mode).length > 1 ? `${parseMediaItems(task.image_url, task.content_mode).length} Videos` : 'Video Post'}</span>
                    </>
                  ) : (task.content_mode === 'image' || Boolean(task.image_url)) ? (
                    <>
                      <ImageIcon size={13} style={{ color: '#10b981' }} />
                      <span style={{ fontWeight: 600, color: '#10b981' }}>{parseMediaItems(task.image_url, task.content_mode).length > 1 ? `${parseMediaItems(task.image_url, task.content_mode).length} Images` : 'Image Post'}</span>
                    </>
                  ) : (
                    <>
                      <Type size={13} style={{ color: '#8b5cf6' }} />
                      <span style={{ fontWeight: 600, color: '#8b5cf6' }}>Text Post</span>
                    </>
                  )}
                </div>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ 
                    fontSize: '11px', fontWeight: 600,
                    color: task.title?.startsWith('User-Generated') ? 'var(--accent-blue)' : 'var(--text-secondary)'
                  }}>
                    {task.title?.startsWith('User-Generated') ? 'User Generated' : 'Admin Given'}
                  </span>
                </div>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>User: <strong>{claim.users?.full_name ? `${claim.users.full_name} (${claim.users.email})` : claim.users?.email}</strong></span>
                </div>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Account: {task.platform === 'x' ? (
                    (claim.x_accounts?.username || claim.x_accounts?.x_handle) ? (
                      <>
                        <strong>@{claim.x_accounts.username || claim.x_accounts.x_handle}</strong>{' '}
                        (<a href={claim.x_accounts.profile_url || `https://x.com/${claim.x_accounts.username || claim.x_accounts.x_handle}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>
                          Profile ↗
                        </a>)
                      </>
                    ) : 'N/A'
                  ) : task.platform === 'youtube' ? (
                    claim.youtube_accounts?.channel_name ? (
                      <>
                        <strong>{claim.youtube_accounts.channel_name}</strong>
                        {claim.youtube_accounts.email_id && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '4px' }}>
                            ({claim.youtube_accounts.email_id})
                          </span>
                        )}
                      </>
                    ) : 'N/A'
                  ) : claim.reddit_accounts?.reddit_profile_link ? (
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
              
              {task.content_body && (() => {
                const isComment = task.task_type === 'comment' || task.task_type === 'comment_reply';
                const isMulti = isComment && isMultiCommentTask(task);
                const assignedText = isComment
                  ? getAssignedCommentText(task.content_body, claim.assigned_comment_index)
                  : task.content_body;

                return (
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      {isComment
                        ? (isMulti ? `Assigned Comment (Variation #${(claim.assigned_comment_index ?? 0) + 1}):` : 'Comment Content:')
                        : 'Post Body Content:'}
                    </span>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.4', fontFamily: 'monospace' }}>
                      {assignedText}
                    </div>
                  </div>
                );
              })()}
              
              {task.flair && (
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Required Flair:</span>{' '}
                  <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {task.flair}
                  </span>
                </div>
              )}
              
              {task.image_url && (() => {
                const mediaItems = parseMediaItems(task.image_url, task.content_mode);
                const imageItems = mediaItems.filter(m => m.type === 'image');
                const videoItems = mediaItems.filter(m => m.type === 'video');

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {videoItems.length > 0 && (
                      <div>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px', fontSize: '12px' }}>
                          🎬 Reference Video{videoItems.length > 1 ? `s (${videoItems.length})` : ''}:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {videoItems.map((vid, idx) => (
                            <div key={idx} style={{ maxWidth: '240px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#000' }}>
                              <video controls src={vid.url} style={{ width: '100%', maxHeight: '140px', display: 'block' }} />
                              <div style={{ padding: '4px 8px', background: 'var(--bg-elevated)', fontSize: '11px' }}>
                                <a href={vid.url} target="_blank" rel="noreferrer" style={{ color: '#ec4899', textDecoration: 'none', fontWeight: 600 }}>
                                  Video {idx + 1} ↗
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {imageItems.length > 0 && (
                      <div>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px', fontSize: '12px' }}>
                          🖼️ Reference Image{imageItems.length > 1 ? `s (${imageItems.length})` : ''}:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {imageItems.map((img, idx) => (
                            <a key={idx} href={img.url} target="_blank" rel="noreferrer" style={{ display: 'inline-block' }}>
                              <img 
                                src={img.url} 
                                alt={`Task Reference ${idx + 1}`} 
                                style={{ maxHeight: '120px', maxWidth: '180px', borderRadius: '6px', border: '1px solid var(--border-subtle)', objectFit: 'contain' }} 
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Submitted Work */}
          {(claim.screenshot_url || (task.task_type !== 'upvote' && task.task_type !== 'like' && task.task_type !== 'subscribe' && claim.reddit_url) || claim.admin_notes) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.08)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Submitted Work</h4>
              {claim.submitted_at && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Submitted on {new Date(claim.submitted_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            
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

            {task.task_type !== 'upvote' && task.task_type !== 'like' && task.task_type !== 'subscribe' && claim.reddit_url && (
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  {task.platform === 'youtube' ? 'YouTube URL:' : 'Reddit URL:'}
                </p>
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
          )}

          {/* Action Buttons */}
          {task.task_category !== 'karma_farm' && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
            {claim.status !== 'approved' && (
              <button
                onClick={() => handleApproveClick(claim.id)}
                disabled={processingId === claim.id}
                style={{
                  flex: 1, minWidth: '120px', padding: '10px 16px', borderRadius: '8px',
                  background: '#10b981', color: 'white', border: 'none',
                  fontSize: '13px', fontWeight: 600, cursor: processingId === claim.id ? 'not-allowed' : 'pointer',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', opacity: processingId === claim.id ? 0.5 : 1,
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
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
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', opacity: processingId === claim.id ? 0.5 : 1,
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)'
                }}
              >
                <X size={16} /> Reject
              </button>
            )}
          </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {isYouTube ? 'Review YouTube Submissions' : 'Review Reddit Submissions'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Approve or reject submitted tasks with detailed task type categorization and rejection management.
          </p>
        </div>
      </div>

      {/* Top Stats Overview Row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div 
          onClick={() => setStatusTab('submitted')}
          style={{ 
            flex: '1 1 200px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', 
            border: statusTab === 'submitted' ? '2px solid #f59e0b' : '1px solid var(--border-medium)', 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Needs Review</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>{pendingCount}</p>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <Clock size={20} />
          </div>
        </div>

        <div 
          onClick={() => setStatusTab('rejected')}
          style={{ 
            flex: '1 1 200px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', 
            border: statusTab === 'rejected' ? '2px solid #ef4444' : '1px solid var(--border-medium)', 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Rejections</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>{rejectedCount}</p>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <XCircle size={20} />
          </div>
        </div>

        <div 
          onClick={() => setStatusTab('approved')}
          style={{ 
            flex: '1 1 200px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', 
            border: statusTab === 'approved' ? '2px solid #10b981' : '1px solid var(--border-medium)', 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Approved</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>{approvedCount}</p>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(160, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <Check size={20} />
          </div>
        </div>
      </div>

      {/* Main Status Tabs + Search Bar */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '10px', padding: '4px' }}>
          {[
            { id: 'submitted', label: 'Needs Review', count: pendingCount, color: '#f59e0b' },
            { id: 'rejected', label: 'Rejections', count: rejectedCount, color: '#ef4444' },
            { id: 'approved', label: 'Approved', count: approvedCount, color: '#10b981' },
            { id: 'all', label: 'All', count: totalCount, color: 'var(--text-primary)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setStatusTab(tab.id as any); setTypeFilter('all'); }}
              style={{
                padding: '8px 14px',
                borderRadius: '7px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: statusTab === tab.id ? 'var(--hero-glow-2)' : 'transparent',
                color: statusTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <span>{tab.label}</span>
              <span style={{ 
                fontSize: '11px', 
                padding: '1px 6px', 
                borderRadius: '10px', 
                background: statusTab === tab.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                color: statusTab === tab.id ? tab.color : 'var(--text-muted)'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '380px', flex: '1 1 280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by user, ID, title, proof..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', padding: '10px 14px 10px 38px', 
              background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', 
              borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' 
            }}
          />
        </div>
      </div>

      {/* Task Type Filter Pills (Posts, Comments, Upvotes, Crossposts, etc.) */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '24px', 
        overflowX: 'auto', 
        paddingBottom: '4px',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
          {statusTab === 'rejected' ? 'Rejection Types:' : 'Task Types:'}
        </span>
        {typeOptions.map(opt => {
          const count = typeCounts[opt.id] ?? 0;
          const isSelected = typeFilter === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTypeFilter(opt.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-elevated)',
                color: isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {opt.icon}
              <span>{opt.label}</span>
              <span style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.06)',
                color: isSelected ? '#93c5fd' : 'var(--text-muted)'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Submissions List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {statusTab === 'submitted' ? 'Submissions Awaiting Review' : statusTab === 'rejected' ? 'Rejected Submissions' : statusTab === 'approved' ? 'Approved Submissions' : 'All Submissions'}
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '8px' }}>
              ({finalFilteredSubmissions.length})
            </span>
          </h2>
        </div>

        {finalFilteredSubmissions.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px dashed var(--border-medium)' }}>
            <AlertCircle size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
              No submissions found
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {searchQuery.trim() ? 'No submissions match your search query.' : `No ${statusTab === 'submitted' ? 'pending' : statusTab === 'rejected' ? 'rejected' : 'matching'} submissions for this filter.`}
            </p>
          </div>
        ) : (
          <div>
            {visibleSubmissions.map(s => renderSubmissionCard(s))}
          </div>
        )}

        {/* Infinite Scroll Sentinel / Loading Indicator */}
        {visibleCount < finalFilteredSubmissions.length && (
          <div 
            ref={loadMoreRef} 
            style={{ 
              padding: '24px 16px', 
              textAlign: 'center', 
              color: 'var(--text-muted)', 
              fontSize: '13px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px' 
            }}
          >
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--accent-blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <span>Showing {visibleSubmissions.length} of {finalFilteredSubmissions.length} submissions (scroll for more)</span>
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
                  {(submissions.find(s => s.id === claimToReject)?.tasks?.platform === 'youtube' 
                    ? ["Channel/Account doesn't match", "Video removed or private", "Manual"] 
                    : ["Removed by reddit filter", "Removed by mod", "Username doesn't match", "Manual"]).map((reason) => (
                    <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px 12px', background: rejectReasonType === reason ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-secondary)', border: `1px solid ${rejectReasonType === reason ? '#8b5cf6' : 'var(--border-subtle)'}`, borderRadius: '8px', transition: 'all 0.2s' }}>
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
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)', fontSize: '14px', resize: 'vertical'
                      }}
                    />
                  </div>
                )}

                {/* Return Task to User Dashboard Option */}
                <div style={{ marginTop: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Make task available again on User Dashboard?
                  </label>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.4 }}>
                    Choose whether other workers can claim this task or if it should be closed permanently.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      padding: '10px 12px',
                      background: reopenTask === 'yes' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary)',
                      border: `1px solid ${reopenTask === 'yes' ? '#10b981' : 'var(--border-subtle)'}`,
                      borderRadius: '10px',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="radio"
                        name="reopenTask"
                        value="yes"
                        checked={reopenTask === 'yes'}
                        onChange={() => setReopenTask('yes')}
                        style={{ accentColor: '#10b981', marginTop: '2px' }}
                      />
                      <div>
                        <span style={{ fontWeight: 600, color: reopenTask === 'yes' ? '#10b981' : 'var(--text-primary)', display: 'block', fontSize: '13px' }}>
                          Yes, return to dashboard for other workers
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                          Other eligible workers can claim it. The rejected worker will never see it again.
                        </span>
                      </div>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      padding: '10px 12px',
                      background: reopenTask === 'no' ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-secondary)',
                      border: `1px solid ${reopenTask === 'no' ? '#ef4444' : 'var(--border-subtle)'}`,
                      borderRadius: '10px',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="radio"
                        name="reopenTask"
                        value="no"
                        checked={reopenTask === 'no'}
                        onChange={() => setReopenTask('no')}
                        style={{ accentColor: '#ef4444', marginTop: '2px' }}
                      />
                      <div>
                        <span style={{ fontWeight: 600, color: reopenTask === 'no' ? '#ef4444' : 'var(--text-primary)', display: 'block', fontSize: '13px' }}>
                          No, do not show on user dashboards
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                          Permanently close this task so no other worker can see or claim it.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px 12px', background: approveType === 'standard' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)', border: `1px solid ${approveType === 'standard' ? '#10b981' : 'var(--border-subtle)'}`, borderRadius: '8px', transition: 'all 0.2s' }}>
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px 12px', background: approveType === 'bonus' ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-secondary)', border: `1px solid ${approveType === 'bonus' ? '#8b5cf6' : 'var(--border-subtle)'}`, borderRadius: '8px', transition: 'all 0.2s' }}>
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
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)',
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

