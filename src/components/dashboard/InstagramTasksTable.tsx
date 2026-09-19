'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Pencil, Calendar, ExternalLink, Sparkles, 
  MessageSquare, Heart, Bookmark, UserPlus, Eye, Film,
  Link2, X, FileText, CheckCircle2, Clock, Check, Upload, Image as ImageIcon
} from 'lucide-react';
import { createTask, updateTask, deleteTask } from '@/actions/tasks';
import { useSearchParams } from 'next/navigation';
import { InstagramIcon, getDefaultInstagramInstructions, getDefaultInstagramPayment } from '@/utils/instagram';
import { parseMediaItems, serializeMediaUrls, isVideoUrl } from '@/utils/media';
import { parseCommentItems } from '@/utils/comments';
import { createClient } from '@/utils/supabase/client';

export const INSTAGRAM_TYPES = [
  { key: 'all', label: 'All Tasks', icon: InstagramIcon },
  { key: 'post', label: 'Post', icon: Film },
  { key: 'comment', label: 'Comment', icon: MessageSquare },
  { key: 'like', label: 'Like', icon: Heart },
  { key: 'follow', label: 'Follow', icon: UserPlus },
  { key: 'save', label: 'Save', icon: Bookmark },
  { key: 'reel_view', label: 'Reel View', icon: Eye },
  { key: 'story_view', label: 'Story View', icon: Eye },
] as const;

export default function InstagramTasksTable({ 
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
  
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<string>('post');
  const [postSubtype, setPostSubtype] = useState<'image' | 'video'>('image');
  const [contentMode, setContentMode] = useState<'provided' | 'custom'>('provided');
  const [postLink, setPostLink] = useState('');
  const [instructions, setInstructions] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('0.50');
  const [maxClaims, setMaxClaims] = useState('10');
  const [viewDuration, setViewDuration] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');

  // Media upload state
  const [mediaFiles, setMediaFiles] = useState<Array<{ id: string; file: File; previewUrl: string; name: string; type: 'image' | 'video' }>>([]);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

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

  const displayedTasks = tasks.filter(t => {
    const isCompleted = t.status === 'completed' || t.status === 'claimed' || (t.active_claims_count || 0) >= (t.max_claims || 1);
    if (searchQuery.trim()) return true;
    return activeTab === 'completed' ? isCompleted : !isCompleted;
  });

  const filteredTasks = displayedTasks.filter(t => {
    const matchesType = selectedType === 'all' || t.task_type === selectedType;
    const matchesSearch = !searchQuery.trim() || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.instructions && t.instructions.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.post_link && t.post_link.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getCategoryCount = (key: string) => {
    if (key === 'all') return displayedTasks.length;
    return displayedTasks.filter(t => t.task_type === key).length;
  };

  const totalApprovedTasks = initialStats?.totalApprovedTasks ?? tasks.reduce((sum, t) => sum + (t.status === 'completed' ? (t.max_claims || 1) : (t.active_claims_count || 0)), 0);
  const totalBaseMoneyGiven = initialStats?.totalBaseMoneyGiven ?? tasks.reduce((sum, t) => sum + (t.status === 'completed' ? (t.payment_amount || 0) * (t.max_claims || 1) : 0), 0);
  const totalBonusGiven = initialStats?.totalBonusGiven ?? 0;
  const totalMoneyGiven = initialStats?.totalMoneyGiven ?? (totalBaseMoneyGiven + totalBonusGiven);

  const handleOpenCreateModal = () => {
    setEditingTaskId(null);
    setTitle('');
    setTaskType('post');
    setPostSubtype('image');
    setContentMode('provided');
    setPostLink('');
    setInstructions(getDefaultInstagramInstructions('post', 'image', 'provided'));
    setContentBody('');
    setPaymentAmount(getDefaultInstagramPayment('post'));
    setMaxClaims('10');
    setViewDuration('');
    setMediaFiles([]);
    setExistingMediaUrls([]);
    setIsScheduled(false);
    setScheduledFor('');
    setIsModalOpen(true);
  };

  const handleTaskTypeChange = (newType: string) => {
    setTaskType(newType);
    if (!editingTaskId) {
      setInstructions(getDefaultInstagramInstructions(newType, postSubtype, contentMode));
      setPaymentAmount(getDefaultInstagramPayment(newType));
    }
  };

  const handlePostSubtypeChange = (newSubtype: 'image' | 'video') => {
    setPostSubtype(newSubtype);
    if (!editingTaskId && taskType === 'post') {
      setInstructions(getDefaultInstagramInstructions('post', newSubtype, contentMode));
    }
  };

  const handleContentModeChange = (newMode: 'provided' | 'custom') => {
    setContentMode(newMode);
    if (!editingTaskId && (taskType === 'post' || taskType === 'comment')) {
      setInstructions(getDefaultInstagramInstructions(taskType, postSubtype, newMode));
    }
  };

  const handleOpenEditModal = (task: any) => {
    setEditingTaskId(task.id);
    setTitle(task.title || '');
    setTaskType(task.task_type || 'post');
    setPostSubtype(task.flair === 'video' ? 'video' : 'image');
    setContentMode(task.content_mode === 'provided' ? 'provided' : 'custom');
    setPostLink(task.post_link || '');
    setInstructions(task.instructions || '');
    setContentBody(task.content_body || '');
    setPaymentAmount(task.payment_amount?.toString() || '0.50');
    setMaxClaims(task.max_claims?.toString() || '1');
    setViewDuration('');
    setMediaFiles([]);
    if (task.image_url) {
      const parsed = parseMediaItems(task.image_url, task.content_mode);
      setExistingMediaUrls(parsed.map((p: any) => p.url));
    } else {
      setExistingMediaUrls([]);
    }
    setIsScheduled(!!task.scheduled_for);
    setScheduledFor(task.scheduled_for ? new Date(task.scheduled_for).toISOString().slice(0, 16) : '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Upload local media files to Supabase storage if any
      const uploadedUrls: string[] = [];
      if (mediaFiles.length > 0) {
        const supabase = createClient();
        for (const m of mediaFiles) {
          const fileExt = m.file.name.split('.').pop();
          const fileName = `ig_asset_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
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

      const showSlotsInput = (taskType !== 'post' && taskType !== 'comment') || contentMode === 'custom';
      let finalMaxClaims = maxClaims;
      if (!showSlotsInput) {
        if (taskType === 'comment' && contentBody.includes('||')) {
          finalMaxClaims = String(parseCommentItems(contentBody).length || 1);
        } else {
          finalMaxClaims = '1';
        }
      }

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('task_type', taskType);
      formData.append('task_category', 'standard');
      formData.append('content_mode', contentMode);
      formData.append('platform', 'instagram');
      formData.append('payment_amount', paymentAmount);
      formData.append('max_claims', finalMaxClaims);
      formData.append('post_link', postLink);
      formData.append('instructions', instructions);
      formData.append('content_body', contentBody);
      formData.append('flair', taskType === 'post' ? postSubtype : '');
      
      if (serializedMedia) {
        formData.append('image_url', serializedMedia);
      } else if (viewDuration) {
        formData.append('image_url', viewDuration);
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

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this Instagram task?')) return;
    setDeletingId(taskId);
    const res = await deleteTask(taskId);
    if (res.error) {
      alert(res.error);
    } else {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
    setDeletingId(null);
  };

  return (
    <div>
      {/* Top Header */}
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
              width: '32px', height: '32px', borderRadius: '8px', 
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', 
              color: '#fff' 
            }}>
              <InstagramIcon size={18} color="#ffffff" />
            </span>
            Manage Instagram Tasks
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Create and manage all 7 categories of Instagram tasks for workers.</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          style={{
            padding: '10px 20px', borderRadius: '10px', 
            background: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #F77737 100%)', 
            color: '#fff', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(225, 48, 108, 0.35)'
          }}
        >
          <Plus size={16} /> Create Instagram Task
        </button>
      </div>

      {/* Aggregate Stats Row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Approved Tasks</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{totalApprovedTasks}</p>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <Check size={20} />
          </div>
        </div>
        <div style={{ flex: '1 1 200px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Money Given</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>${totalMoneyGiven.toFixed(2)}</p>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <span style={{ fontSize: '18px', fontWeight: 700 }}>$</span>
          </div>
        </div>
        <div style={{ flex: '1 1 200px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Base Amount Given</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>${totalBaseMoneyGiven.toFixed(2)}</p>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
            <span style={{ fontSize: '18px', fontWeight: 700 }}>$</span>
          </div>
        </div>
        <div style={{ flex: '1 1 200px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Bonus Amount Given</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>${totalBonusGiven.toFixed(2)}</p>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}>
            <Sparkles size={18} />
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: activeTab === 'active' ? 'linear-gradient(135deg, #833AB4, #FD1D1D)' : 'transparent',
              color: activeTab === 'active' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'active' ? '0 2px 8px rgba(225, 48, 108, 0.25)' : 'none'
            }}
          >
            Active Tasks
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: activeTab === 'completed' ? 'linear-gradient(135deg, #833AB4, #FD1D1D)' : 'transparent',
              color: activeTab === 'completed' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'completed' ? '0 2px 8px rgba(225, 48, 108, 0.25)' : 'none'
            }}
          >
            Completed / Claimed
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '400px', flex: '1 1 260px' }}>
          <input
            type="text"
            placeholder="Search Instagram tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
              borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Category Partition Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px', alignItems: 'center' }}>
        {INSTAGRAM_TYPES.map(cat => {
          const count = getCategoryCount(cat.key);
          const isActive = selectedType === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedType(cat.key)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: isActive ? '1px solid rgba(225, 48, 108, 0.35)' : '1px solid var(--border-subtle)',
                background: isActive ? 'rgba(225, 48, 108, 0.15)' : 'var(--bg-card)',
                color: isActive ? '#E1306C' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{cat.label}</span>
              <span style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: isActive ? 'rgba(225, 48, 108, 0.25)' : 'rgba(255,255,255,0.06)',
                color: isActive ? '#E1306C' : 'var(--text-muted)'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="admin-desktop-table" style={{ background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
          <thead>
            <tr style={{ background: 'var(--hero-glow-2)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ borderTopLeftRadius: '16px', padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>ID</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Task</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Target Link</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Slots</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Payment</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Type</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Date</th>
              <th style={{ borderTopRightRadius: '16px', padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No Instagram tasks found. Click "Create Instagram Task" above to publish a new one.
                </td>
              </tr>
            ) : (
              filteredTasks.map(t => {
                const isClaimLimitReached = (t.active_claims_count || 0) >= (t.max_claims || 1) || t.status === 'claimed' || t.status === 'completed';
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '13px' }}>
                      {t.task_seq_id ? `${t.task_seq_id}` : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', maxWidth: '240px' }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.3' }}>{t.title}</p>
                      {t.flair && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                          <span style={{ display: 'inline-block', padding: '1px 6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '11px' }}>{t.flair}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '13px' }}>
                      {t.post_link ? (
                        <a 
                          href={t.post_link} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ color: '#E1306C', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600, fontSize: '13px' }}
                        >
                          Target Link ↗
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '4px', 
                        padding: '3px 8px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
                        background: isClaimLimitReached ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.06)',
                        color: isClaimLimitReached ? '#ef4444' : 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)',
                        whiteSpace: 'nowrap'
                      }}>
                        👥 {t.active_claims_count || 0}/{t.max_claims || 1}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#10b981', fontWeight: 600, whiteSpace: 'nowrap', fontSize: '13px' }}>
                      ${Number(t.payment_amount || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: 'rgba(225, 48, 108, 0.1)',
                        color: '#E1306C',
                        border: '1px solid rgba(225, 48, 108, 0.25)'
                      }}>
                        <InstagramIcon size={12} color="#E1306C" /> {t.task_type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {t.scheduled_for && new Date(t.scheduled_for) > new Date() ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px', background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', borderRadius: '4px', fontSize: '10px', fontWeight: 600, width: 'fit-content' }}>
                            <Calendar size={10} /> Scheduled
                          </span>
                          <span style={{ fontSize: '11px' }}>{new Date(t.scheduled_for).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ) : (
                        new Date(t.created_at).toLocaleDateString()
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEditModal(t)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-medium)',
                            background: 'var(--bg-default)',
                            color: 'var(--text-primary)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s'
                          }}
                          title="Edit Task"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={deletingId === t.id}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#ef4444',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: deletingId === t.id ? 'not-allowed' : 'pointer',
                            opacity: deletingId === t.id ? 0.6 : 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s'
                          }}
                          title="Delete Task"
                        >
                          <Trash2 size={12} /> {deletingId === t.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="admin-mobile-cards">
        {filteredTasks.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
            No Instagram tasks found matching your search.
          </div>
        ) : (
          filteredTasks.map(t => (
            <div key={t.id} className="admin-card-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t.task_seq_id ? `Task ID: ${t.task_seq_id} - ` : ''}{t.title}
                  </h3>
                  {t.flair && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '11px' }}>
                        {t.flair}
                      </span>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>
                  ${Number(t.payment_amount || 0).toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {t.post_link ? (
                    <a 
                      href={t.post_link} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ color: '#E1306C', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Target Link ↗
                    </a>
                  ) : (
                    <span>Instagram</span>
                  )}
                  <span>•</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    👥 {t.active_claims_count || 0}/{t.max_claims || 1} slots
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#E1306C'
                  }}>
                    {t.task_type?.replace('_', ' ')}
                  </span>
                  <span>•</span>
                  {t.scheduled_for && new Date(t.scheduled_for) > new Date() ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px', background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                      <Calendar size={10} /> {new Date(t.scheduled_for).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : (
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              {/* Mobile Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => handleOpenEditModal(t)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-default)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={deletingId === t.id}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#ef4444',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: deletingId === t.id ? 'not-allowed' : 'pointer',
                    opacity: deletingId === t.id ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Trash2 size={13} /> {deletingId === t.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT TASK MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)', zIndex: 999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
                borderRadius: '20px', width: '100%', maxWidth: '640px',
                maxHeight: '90vh', overflowY: 'auto', padding: '28px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.35)', position: 'relative'
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

              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
                  width: '28px', height: '28px', borderRadius: '8px', 
                  background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', 
                  color: '#fff' 
                }}>
                  <InstagramIcon size={16} color="#ffffff" />
                </span>
                {editingTaskId ? 'Edit Instagram Task' : 'Create Instagram Task'}
              </h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Task Type Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Task Type *</label>
                  <select
                    value={taskType}
                    onChange={(e) => handleTaskTypeChange(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                  >
                    <option value="post">1. Post</option>
                    <option value="comment">2. Comment</option>
                    <option value="like">3. Like</option>
                    <option value="follow">4. Follow Profile</option>
                    <option value="save">5. Save</option>
                    <option value="reel_view">6. Reel View</option>
                    <option value="story_view">7. Story View</option>
                  </select>
                </div>

                {/* Subtype for Post: Image or Video/Reel */}
                {taskType === 'post' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => handlePostSubtypeChange('image')}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px',
                        background: postSubtype === 'image' ? 'var(--text-primary)' : 'var(--bg-card)',
                        color: postSubtype === 'image' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                        border: '1px solid var(--border-medium)', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Image Post
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePostSubtypeChange('video')}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px',
                        background: postSubtype === 'video' ? 'var(--text-primary)' : 'var(--bg-card)',
                        color: postSubtype === 'video' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                        border: '1px solid var(--border-medium)', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Video / Reel Post
                    </button>
                  </div>
                )}

                {/* Content Source for Post & Comment */}
                {(taskType === 'post' || taskType === 'comment') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Content Source</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => handleContentModeChange('provided')}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '8px',
                          background: contentMode === 'provided' ? 'var(--text-primary)' : 'var(--bg-card)',
                          color: contentMode === 'provided' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                          border: '1px solid var(--border-medium)', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        Admin Provided Content
                      </button>
                      <button
                        type="button"
                        onClick={() => handleContentModeChange('custom')}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '8px',
                          background: contentMode === 'custom' ? 'var(--text-primary)' : 'var(--bg-card)',
                          color: contentMode === 'custom' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                          border: '1px solid var(--border-medium)', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        User Generated Content
                      </button>
                    </div>
                  </div>
                )}

                {/* Task Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Task Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Post high quality fitness reel on Instagram"
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                {/* Target URL */}
                {taskType !== 'post' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {taskType === 'follow' ? 'Instagram Profile URL *' : taskType === 'story_view' ? 'Instagram Story / Profile URL *' : taskType === 'reel_view' ? 'Target Reel URL *' : 'Target Post / Reel URL *'}
                    </label>
                    <input
                      type="url"
                      value={postLink}
                      onChange={(e) => setPostLink(e.target.value)}
                      placeholder="e.g. https://www.instagram.com/p/..."
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                )}

                {/* Reel View Duration (Optional) */}
                {taskType === 'reel_view' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Required View Duration (Optional)</label>
                    <input
                      type="text"
                      value={viewDuration}
                      onChange={(e) => setViewDuration(e.target.value)}
                      placeholder="e.g. Watch at least 30 seconds or full reel"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                )}

                {/* Caption / Content Body */}
                {(taskType === 'post' || taskType === 'comment') && contentMode === 'provided' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {taskType === 'post' ? 'Caption / Post Content *' : 'Provided Comment Content *'}
                    </label>
                    <textarea
                      value={contentBody}
                      onChange={(e) => setContentBody(e.target.value)}
                      placeholder="Enter the caption or comment text workers should post..."
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontSize: '14px', minHeight: '80px', outline: 'none' }}
                    />
                  </div>
                )}

                {/* Media Uploads for Admin-Provided Image/Video Posts */}
                {taskType === 'post' && contentMode === 'provided' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Attach {postSubtype === 'video' ? 'Video / Reel' : 'Image'} Files for Workers to Post
                    </label>
                    <input
                      type="file"
                      ref={mediaInputRef}
                      accept={postSubtype === 'video' ? 'video/*' : 'image/*'}
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
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Upload size={18} style={{ color: '#E1306C' }} /> 
                      Click to Upload {postSubtype === 'video' ? 'Video / Reel (MP4, MOV, WEBM)' : 'Images (PNG, JPG, WEBP)'}
                    </button>

                    {/* Previews */}
                    {(mediaFiles.length > 0 || existingMediaUrls.length > 0) && (
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {mediaFiles.map(m => (
                          <div key={m.id} style={{ position: 'relative', width: '84px', height: '84px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#000' }}>
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
                                borderRadius: '50%', width: '20px', height: '20px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        {existingMediaUrls.map((url, idx) => (
                          <div key={idx} style={{ position: 'relative', width: '84px', height: '84px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#000' }}>
                            {isVideoUrl(url) ? (
                              <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <img src={url} alt="existing" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                            <button
                              type="button"
                              onClick={() => setExistingMediaUrls(existingMediaUrls.filter((_, i) => i !== idx))}
                              style={{
                                position: 'absolute', top: '4px', right: '4px',
                                background: '#ef4444', color: '#fff', border: 'none',
                                borderRadius: '50%', width: '20px', height: '20px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Instructions */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Worker Instructions</label>
                    <button
                      type="button"
                      onClick={() => setInstructions(getDefaultInstagramInstructions(taskType, postSubtype, contentMode))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#E1306C',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}
                      title="Fill or reset instructions with recommended default template"
                    >
                      <Sparkles size={12} /> Auto-fill Default
                    </button>
                  </div>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Provide clear steps for the worker (e.g. Like the post and leave a genuine comment)..."
                    rows={4}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.5', minHeight: '100px', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                {/* Payment Amount & Number of Slots */}
                {(() => {
                  const showSlotsInput = (taskType !== 'post' && taskType !== 'comment') || contentMode === 'custom';
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: showSlotsInput ? '1fr 1fr' : '1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Payment Amount ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          required
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                        />
                      </div>
                      {showSlotsInput && (
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Number of Slots *</label>
                          <input
                            type="number"
                            min="1"
                            value={maxClaims}
                            onChange={(e) => setMaxClaims(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Submit Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px',
                      background: 'transparent', border: '1px solid var(--border-medium)',
                      color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #F77737 100%)',
                      color: '#fff', border: 'none',
                      fontSize: '14px', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(225, 48, 108, 0.35)'
                    }}
                  >
                    {isSubmitting ? 'Saving Task...' : editingTaskId ? 'Update Task' : 'Publish Task'}
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
