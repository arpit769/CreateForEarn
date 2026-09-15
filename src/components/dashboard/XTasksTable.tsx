'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Check, Pencil, Calendar, ExternalLink, Sparkles, 
  MessageSquare, ThumbsUp, Share2, UserPlus, UploadCloud, Link2, X, 
  PlusCircle, Film, Image as ImageIcon, Bookmark
} from 'lucide-react';
import { createTask, updateTask, deleteTask } from '@/actions/tasks';
import { useSearchParams } from 'next/navigation';
import { parseMediaItems, serializeMediaUrls, isVideoUrl } from '@/utils/media';
import { createClient } from '@/utils/supabase/client';

export default function XTasksTable({ 
  initialTasks, 
  initialStats
}: { 
  initialTasks: any[], 
  initialStats?: {
    totalApprovedTasks: number;
    totalMoneyGiven: number;
    totalBaseMoneyGiven: number;
    totalBonusGiven: number;
  }
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [selectedType, setSelectedType] = useState<string>('all');

  const X_TYPES = [
    { key: 'all', label: 'All Tasks' },
    { key: 'post', label: 'Posts' },
    { key: 'comment', label: 'Comments' },
    { key: 'like', label: 'Likes' },
    { key: 'repost', label: 'Reposts' },
    { key: 'quote_post', label: 'Quotes' },
    { key: 'follow', label: 'Follows' },
    { key: 'bookmark', label: 'Bookmarks' },
  ];

  const displayedTasks = tasks.filter(t => {
    const isCompleted = t.status === 'completed' || t.status === 'claimed' || (t.active_claims_count || 0) >= (t.max_claims || 1);
    if (searchQuery.trim()) return true;
    return activeTab === 'completed' ? isCompleted : !isCompleted;
  });

  const filteredTasks = displayedTasks.filter(t => {
    if (selectedType !== 'all') {
      if (t.task_type !== selectedType) return false;
    }
    return (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.instructions || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.task_seq_id && `task id: ${t.task_seq_id}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.task_seq_id && String(t.task_seq_id).includes(searchQuery.toLowerCase()));
  });

  const [visibleCount, setVisibleCount] = useState(30);

  useEffect(() => {
    setVisibleCount(30);
  }, [activeTab, searchQuery, selectedType]);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 30);
        }
      },
      { threshold: 0.1, rootMargin: '250px' }
    );

    const el = loadMoreRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [filteredTasks.length, visibleCount]);

  const visibleTasks = filteredTasks.slice(0, visibleCount);

  // Stats
  const totalApprovedTasks = initialStats ? initialStats.totalApprovedTasks : tasks.reduce((sum, t) => sum + (t.approved_claims_count || 0), 0);
  const totalBaseMoneyGiven = initialStats ? initialStats.totalBaseMoneyGiven : tasks.reduce((sum, t) => sum + ((t.approved_claims_count || 0) * (Number(t.payment_amount) || 0)), 0);
  const totalBonusGiven = initialStats ? initialStats.totalBonusGiven : tasks.reduce((sum, t) => sum + (t.total_bonus_amount || 0), 0);
  const totalMoneyGiven = initialStats ? initialStats.totalMoneyGiven : (totalBaseMoneyGiven + totalBonusGiven);

  // Form State
  const [mainCategory, setMainCategory] = useState<'post' | 'comment' | 'like' | 'repost' | 'quote_post' | 'follow' | 'bookmark'>('post');
  const [postMode, setPostMode] = useState<'text' | 'image' | 'video'>('text');
  const [contentOrigin, setContentOrigin] = useState<'admin' | 'ugc'>('admin');
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [postLink, setPostLink] = useState('');
  const [slots, setSlots] = useState('1');
  const [instructions, setInstructions] = useState('');

  // Media upload state
  const [mediaFiles, setMediaFiles] = useState<Array<{ id: string; file: File; previewUrl: string; name: string; type: 'image' | 'video' }>>([]);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  const [paymentType, setPaymentType] = useState<'base' | 'custom'>('base');
  const [paymentAmount, setPaymentAmount] = useState('0.15');

  // Load previous payment settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedXPayment = localStorage.getItem('admin_last_x_payment_amount');
      const savedXType = localStorage.getItem('admin_last_x_payment_type');
      if (savedXPayment) setPaymentAmount(savedXPayment);
      if (savedXType === 'base' || savedXType === 'custom') setPaymentType(savedXType);
    }
  }, []);

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');

  const handleMediaSelect = (incoming: FileList | File[] | null) => {
    if (!incoming || incoming.length === 0) return;
    const fileList = Array.from(incoming);
    const newItems: Array<{ id: string; file: File; previewUrl: string; name: string; type: 'image' | 'video' }> = [];

    fileList.forEach(file => {
      const isVid = file.type.startsWith('video/') || isVideoUrl(file.name);
      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        type: isVid ? 'video' : 'image'
      });
    });

    if (newItems.length > 0) {
      setMediaFiles(prev => [...prev, ...newItems]);
    }
  };

  const handleRemoveMediaFile = (id: string) => {
    setMediaFiles(prev => {
      const target = prev.find(item => item.id === id);
      if (target?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const handleOpenCreateModal = () => {
    setEditingTaskId(null);
    setTitle('');
    setBody('');
    setPostLink('');
    setSlots('1');
    setInstructions('');
    setMainCategory('post');
    setPostMode('text');
    setContentOrigin('admin');
    setMediaFiles([]);
    setExistingMediaUrls([]);
    setIsScheduled(false);
    setScheduledFor('');

    if (typeof window !== 'undefined') {
      const savedXPayment = localStorage.getItem('admin_last_x_payment_amount');
      const savedXType = localStorage.getItem('admin_last_x_payment_type');
      if (savedXPayment) setPaymentAmount(savedXPayment);
      if (savedXType === 'base' || savedXType === 'custom') setPaymentType(savedXType);
    }

    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: any) => {
    setEditingTaskId(task.id);
    setTitle(task.title || '');
    setBody(task.content_body || '');
    setPostLink(task.post_link || '');
    setSlots(String(task.max_claims || 1));
    setInstructions(task.instructions || '');
    setMainCategory(task.task_type || 'post');
    setPostMode(task.content_mode || 'text');
    setContentOrigin(task.title?.startsWith('User-Generated') ? 'ugc' : 'admin');
    setPaymentAmount(String(task.payment_amount || '0.15'));
    setPaymentType('custom');

    const parsedMedia = parseMediaItems(task.image_url, task.content_mode);
    setExistingMediaUrls(parsedMedia.map(m => m.url));
    setMediaFiles([]);

    if (task.scheduled_for) {
      setIsScheduled(true);
      const d = new Date(task.scheduled_for);
      const pad = (n: number) => n < 10 ? '0' + n : n;
      setScheduledFor(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } else {
      setIsScheduled(false);
      setScheduledFor('');
    }

    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_last_x_payment_amount', paymentAmount);
        localStorage.setItem('admin_last_x_payment_type', paymentType);
      }

      // Upload local media files if any
      const uploadedUrls: string[] = [];
      if (mediaFiles.length > 0) {
        const supabase = createClient();
        for (const m of mediaFiles) {
          const fileExt = m.file.name.split('.').pop();
          const fileName = `x_asset_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('task_images')
            .upload(fileName, m.file);

          if (uploadError) {
            throw new Error(`Media upload failed: ${uploadError.message}`);
          }
          const { data: pubData } = supabase.storage.from('task_images').getPublicUrl(fileName);
          uploadedUrls.push(pubData.publicUrl);
        }
      }

      const allMediaUrls = [...existingMediaUrls, ...uploadedUrls];
      const serializedMedia = serializeMediaUrls(allMediaUrls);

      let finalTitle = title.trim();
      if (!finalTitle) {
        if (contentOrigin === 'ugc') {
          finalTitle = `User-Generated X ${mainCategory.toUpperCase()} Task`;
        } else {
          finalTitle = `X ${mainCategory.charAt(0).toUpperCase() + mainCategory.slice(1)} Task`;
        }
      }

      const formData = new FormData();
      formData.append('title', finalTitle);
      formData.append('instructions', instructions.trim() || 'Follow the specified instructions and submit proof.');
      formData.append('task_type', mainCategory);
      formData.append('platform', 'x');
      formData.append('payment_amount', paymentAmount);
      formData.append('max_claims', slots);
      formData.append('content_mode', postMode);
      formData.append('task_category', 'standard');

      if (postLink.trim()) {
        formData.append('post_link', postLink.trim());
      }
      if (body.trim()) {
        formData.append('content_body', body.trim());
      }
      if (serializedMedia) {
        formData.append('image_url', serializedMedia);
      }
      if (isScheduled && scheduledFor) {
        formData.append('scheduled_for', new Date(scheduledFor).toISOString());
      }

      let res;
      if (editingTaskId) {
        formData.append('task_id', editingTaskId);
        res = await updateTask(editingTaskId, formData);
      } else {
        res = await createTask(formData);
      }

      if (res?.error) {
        alert("Operation failed: " + res.error);
      } else {
        setIsModalOpen(false);
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setDeletingId(id);
    const res = await deleteTask(id);
    if (res?.error) {
      alert('Delete failed: ' + res.error);
    } else {
      setTasks(tasks.filter(t => t.id !== id));
    }
    setDeletingId(null);
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            X Tasks
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Create and manage all 7 categories of X tasks for workers.</p>
        </div>

        <div className="admin-stats-box">
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Approved Claims</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{totalApprovedTasks}</p>
          </div>
          <div className="admin-stats-divider"></div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Payouts Given</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>${totalMoneyGiven.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: activeTab === 'active' ? 'var(--text-primary)' : 'transparent',
              color: activeTab === 'active' ? 'var(--bg-primary)' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Active ({tasks.filter(t => t.status !== 'completed' && (t.active_claims_count || 0) < (t.max_claims || 1)).length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: activeTab === 'completed' ? 'var(--text-primary)' : 'transparent',
              color: activeTab === 'completed' ? 'var(--bg-primary)' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Completed ({tasks.filter(t => t.status === 'completed' || (t.active_claims_count || 0) >= (t.max_claims || 1)).length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search X tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '10px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
              borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', minWidth: '220px'
            }}
          />
          <button
            onClick={handleOpenCreateModal}
            style={{
              padding: '10px 20px', borderRadius: '10px', background: '#000', color: '#fff',
              border: '1px solid #333', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            <Plus size={16} /> Create X Task
          </button>
        </div>
      </div>

      {/* Category Partition Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px', alignItems: 'center' }}>
        {X_TYPES.map(cat => {
          const isActive = selectedType === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedType(cat.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: isActive ? '1px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                background: isActive ? 'var(--text-primary)' : 'var(--bg-elevated)',
                color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Task Cards Grid */}
      {visibleTasks.length === 0 ? (
        <div style={{ background: 'var(--bg-elevated)', borderRadius: '16px', padding: '64px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No X tasks found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
          {visibleTasks.map(task => {
            const isCompleted = task.status === 'completed' || task.status === 'claimed' || (task.active_claims_count || 0) >= (task.max_claims || 1);
            return (
              <div
                key={task.id}
                style={{
                  background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)',
                  padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)', position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ 
                        fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                        background: 'var(--text-primary)', color: 'var(--bg-card)',
                        display: 'inline-flex', alignItems: 'center', gap: '5px'
                      }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span>{task.task_type?.toUpperCase() || 'POST'}</span>
                      </span>
                      {task.task_seq_id && (
                        <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '3px 8px', borderRadius: '6px' }}>
                          #{task.task_seq_id}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>
                      ${(Number(task.payment_amount) || 0).toFixed(2)}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.3 }}>
                    {task.title}
                  </h3>

                  {task.post_link && (
                    <a
                      href={task.post_link}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '10px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%'
                      }}
                    >
                      <Link2 size={12} /> {task.post_link}
                    </a>
                  )}

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
                    {task.instructions}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>Slots: <strong>{task.active_claims_count || 0} / {task.max_claims || 1}</strong></span>
                    <span style={{ color: isCompleted ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                      {isCompleted ? 'Completed' : 'Available'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      onClick={() => handleOpenEditModal(task)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px', background: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)', color: 'var(--text-primary)',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: '4px'
                      }}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      disabled={deletingId === task.id}
                      style={{
                        padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444',
                        fontSize: '12px', fontWeight: 600, cursor: deletingId === task.id ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More trigger */}
      <div ref={loadMoreRef} style={{ height: '20px', margin: '20px 0' }} />

      {/* CREATE / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
                borderRadius: '20px', width: '100%', maxWidth: '640px',
                maxHeight: '90vh', overflowY: 'auto', padding: '32px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)', position: 'relative'
              }}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  position: 'absolute', top: '24px', right: '24px',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>

              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>
                {editingTaskId ? 'Edit X Task' : 'Create New X Task'}
              </h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Main Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    X Task Type *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    {[
                      { id: 'post', label: 'Post', icon: <MessageSquare size={14} /> },
                      { id: 'comment', label: 'Comment', icon: <MessageSquare size={14} /> },
                      { id: 'like', label: 'Like', icon: <ThumbsUp size={14} /> },
                      { id: 'repost', label: 'Repost', icon: <Share2 size={14} /> },
                      { id: 'quote_post', label: 'Quote Post', icon: <MessageSquare size={14} /> },
                      { id: 'follow', label: 'Follow', icon: <UserPlus size={14} /> },
                      { id: 'bookmark', label: 'Bookmark', icon: <Bookmark size={14} /> },
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setMainCategory(cat.id as any)}
                        style={{
                          padding: '10px', borderRadius: '10px',
                          border: mainCategory === cat.id ? '2px solid #ffffff' : '1px solid var(--border-subtle)',
                          background: mainCategory === cat.id ? 'rgba(255,255,255,0.1)' : 'var(--bg-card)',
                          color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subcategory / Origin for Post and Comment */}
                {(mainCategory === 'post' || mainCategory === 'comment' || mainCategory === 'quote_post') && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setContentOrigin('admin')}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px',
                        border: contentOrigin === 'admin' ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                        background: contentOrigin === 'admin' ? 'rgba(59,130,246,0.1)' : 'var(--bg-card)',
                        color: contentOrigin === 'admin' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Admin Provided Content
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentOrigin('ugc')}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px',
                        border: contentOrigin === 'ugc' ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                        background: contentOrigin === 'ugc' ? 'rgba(59,130,246,0.1)' : 'var(--bg-card)',
                        color: contentOrigin === 'ugc' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      User Generated Content (UGC)
                    </button>
                  </div>
                )}

                {/* Media format for Post */}
                {mainCategory === 'post' && contentOrigin === 'admin' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      Post Media Format
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {[
                        { id: 'text', label: 'Text Only' },
                        { id: 'image', label: 'Image Post' },
                        { id: 'video', label: 'Video Post' },
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPostMode(m.id as any)}
                          style={{
                            flex: 1, padding: '8px', borderRadius: '8px',
                            border: postMode === m.id ? '1px solid #ffffff' : '1px solid var(--border-subtle)',
                            background: postMode === m.id ? 'rgba(255,255,255,0.08)' : 'var(--bg-card)',
                            color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Target Link (for comment, like, repost, quote_post, follow, bookmark) */}
                {mainCategory !== 'post' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {mainCategory === 'follow' ? 'Target X Profile URL to Follow *' : 'Target X Post / Tweet URL *'}
                    </label>
                    <input
                      type="url"
                      required
                      placeholder={mainCategory === 'follow' ? 'https://x.com/username' : 'https://x.com/username/status/...'}
                      value={postLink}
                      onChange={e => setPostLink(e.target.value)}
                      style={{
                        width: '100%', padding: '12px', borderRadius: '8px',
                        background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
                      }}
                    />
                  </div>
                )}

                {/* Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Task Title
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. ${mainCategory === 'post' ? 'Post announcement on X' : `Perform ${mainCategory} on X post`}`}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '8px',
                      background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
                    }}
                  />
                </div>

                {/* Body / Content */}
                {((mainCategory === 'post' || mainCategory === 'comment' || mainCategory === 'quote_post') && contentOrigin === 'admin') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {mainCategory === 'comment' ? 'Assigned Comments (Separate with || or newlines for multiple)' : 'Post / Tweet Body Text'}
                    </label>
                    <textarea
                      rows={4}
                      placeholder={mainCategory === 'comment' ? 'Great project! Check this out || Amazing release! Excited for the updates.' : 'Type the exact tweet content workers must post...'}
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      style={{
                        width: '100%', padding: '12px', borderRadius: '8px',
                        background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
                      }}
                    />
                  </div>
                )}

                {/* Media Uploads for Image/Video Posts */}
                {mainCategory === 'post' && contentOrigin === 'admin' && (postMode === 'image' || postMode === 'video') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Attach {postMode === 'video' ? 'Video' : 'Image'} Files
                    </label>
                    <input
                      type="file"
                      ref={mediaInputRef}
                      accept={postMode === 'video' ? 'video/*' : 'image/*'}
                      multiple
                      onChange={e => handleMediaSelect(e.target.files)}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => mediaInputRef.current?.click()}
                      style={{
                        width: '100%', padding: '14px', borderRadius: '10px',
                        border: '2px dashed var(--border-medium)', background: 'var(--bg-card)',
                        color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                      }}
                    >
                      <UploadCloud size={16} /> Click to Upload {postMode === 'video' ? 'Videos (MP4, WEBM)' : 'Images (PNG, JPG)'}
                    </button>

                    {/* Previews */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                      {mediaFiles.map(m => (
                        <div key={m.id} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                          {m.type === 'video' ? (
                            <video src={m.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <img src={m.previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveMediaFile(m.id)}
                            style={{
                              position: 'absolute', top: '4px', right: '4px',
                              background: '#ef4444', color: '#fff', border: 'none',
                              borderRadius: '50%', width: '18px', height: '18px',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {existingMediaUrls.map((url, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                          <img src={url} alt="existing" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => setExistingMediaUrls(existingMediaUrls.filter((_, i) => i !== idx))}
                            style={{
                              position: 'absolute', top: '4px', right: '4px',
                              background: '#ef4444', color: '#fff', border: 'none',
                              borderRadius: '50%', width: '18px', height: '18px',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Special Instructions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter any guidance for the worker..."
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '8px',
                      background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
                    }}
                  />
                </div>

                {/* Slots and Payment */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Worker Slots (Max Claims) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={slots}
                      onChange={e => setSlots(e.target.value)}
                      style={{
                        width: '100%', padding: '12px', borderRadius: '8px',
                        background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Payment per Claim ($ USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      style={{
                        width: '100%', padding: '12px', borderRadius: '8px',
                        background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Scheduling */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', marginBottom: '8px' }}>
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={e => setIsScheduled(e.target.checked)}
                    />
                    Schedule Task for Later
                  </label>
                  {isScheduled && (
                    <input
                      type="datetime-local"
                      required={isScheduled}
                      value={scheduledFor}
                      onChange={e => setScheduledFor(e.target.value)}
                      style={{
                        width: '100%', padding: '12px', borderRadius: '8px',
                        background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
                      }}
                    />
                  )}
                </div>

                {/* Submit button */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: '12px 20px', borderRadius: '10px',
                      background: 'transparent', border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '12px 28px', borderRadius: '10px',
                      background: '#000', color: '#fff', border: '1px solid #333',
                      fontSize: '14px', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                  >
                    {isSubmitting ? 'Saving Task...' : (editingTaskId ? 'Update Task' : 'Create Task')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
