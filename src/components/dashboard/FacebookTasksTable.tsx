'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Pencil, Calendar, ExternalLink, Sparkles, 
  MessageSquare, ThumbsUp, Share2, UserPlus, Users, Eye,
  Link2, X, FileText, CheckCircle2, Clock, Check, Upload, Image as ImageIcon,
  Film, Heart, AlertCircle
} from 'lucide-react';
import { createTask, updateTask, deleteTask } from '@/actions/tasks';
import { useSearchParams } from 'next/navigation';
import { 
  FacebookIcon, 
  getDefaultFacebookInstructions, 
  getDefaultFacebookPayment,
  FACEBOOK_TASK_TYPES,
  FACEBOOK_POST_TYPES,
  FACEBOOK_REACTION_TYPES,
  FACEBOOK_SHARE_TYPES,
  FACEBOOK_FOLLOW_ACTIONS
} from '@/utils/facebook';
import { parseMediaItems, serializeMediaUrls, isVideoUrl } from '@/utils/media';
import { parseCommentItems } from '@/utils/comments';
import { createClient } from '@/utils/supabase/client';

export default function FacebookTasksTable({ 
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
  
  // Specific category options
  const [postSubtype, setPostSubtype] = useState<'text' | 'image' | 'video' | 'link'>('text');
  const [contentMode, setContentMode] = useState<'provided' | 'custom'>('provided');
  const [reactionType, setReactionType] = useState<string>('like');
  const [shareType, setShareType] = useState<'feed' | 'group' | 'story'>('feed');
  const [followAction, setFollowAction] = useState<'follow' | 'like_page'>('follow');
  
  const [postLink, setPostLink] = useState('');
  const [instructions, setInstructions] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('0.50');
  const [maxClaims, setMaxClaims] = useState('10');
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
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.instructions && t.instructions.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.post_link && t.post_link.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Calculate live counts for each category pill
  const categoryCounts = {
    all: displayedTasks.length,
    post: displayedTasks.filter(t => t.task_type === 'post').length,
    comment: displayedTasks.filter(t => t.task_type === 'comment').length,
    like: displayedTasks.filter(t => t.task_type === 'like').length,
    share: displayedTasks.filter(t => t.task_type === 'share').length,
    follow: displayedTasks.filter(t => t.task_type === 'follow').length,
    join_group: displayedTasks.filter(t => t.task_type === 'join_group').length,
    story_view: displayedTasks.filter(t => t.task_type === 'story_view').length,
  };

  const handleTypeChange = (newType: string) => {
    setTaskType(newType);
    setPaymentAmount(getDefaultFacebookPayment(newType));
    setInstructions(getDefaultFacebookInstructions(newType, postSubtype, contentMode));
    
    if (newType === 'post') {
      setTitle(contentMode === 'provided' ? 'Facebook Post (Admin Provided)' : 'Create Facebook Post');
      setMaxClaims(contentMode === 'provided' ? '1' : '10');
    } else if (newType === 'comment') {
      setTitle(contentMode === 'provided' ? 'Comment on Facebook Post' : 'Write Comment on Facebook Post');
      setMaxClaims('15');
    } else if (newType === 'like') {
      setTitle(`React with ${reactionType.toUpperCase()} on Facebook Post`);
      setMaxClaims('25');
    } else if (newType === 'share') {
      setTitle(`Share Facebook Post to ${shareType === 'feed' ? 'Feed' : shareType === 'group' ? 'Group' : 'Story'}`);
      setMaxClaims('10');
    } else if (newType === 'follow') {
      setTitle(followAction === 'like_page' ? 'Like Facebook Page' : 'Follow Facebook Page/Profile');
      setMaxClaims('20');
    } else if (newType === 'join_group') {
      setTitle('Join Facebook Group');
      setMaxClaims('20');
    } else if (newType === 'story_view') {
      setTitle('View Facebook Story');
      setMaxClaims('30');
    }
  };

  const openCreateModal = () => {
    setEditingTaskId(null);
    setTitle('Facebook Post (Admin Provided Content)');
    setTaskType('post');
    setPostSubtype('text');
    setContentMode('provided');
    setReactionType('like');
    setShareType('feed');
    setFollowAction('follow');
    setPostLink('');
    setInstructions(getDefaultFacebookInstructions('post', 'text', 'provided'));
    setContentBody('');
    setPaymentAmount(getDefaultFacebookPayment('post'));
    setMaxClaims('1');
    setIsScheduled(false);
    setScheduledFor('');
    setMediaFiles([]);
    setExistingMediaUrls([]);
    setIsModalOpen(true);
  };

  const openEditModal = (task: any) => {
    setEditingTaskId(task.id);
    setTitle(task.title || '');
    const currentType = task.task_type || 'post';
    setTaskType(currentType);
    setContentMode(task.content_mode === 'custom' ? 'custom' : 'provided');
    setPostLink(task.post_link || '');
    setInstructions(task.instructions || '');
    setContentBody(task.content_body || '');
    setPaymentAmount(String(task.payment_amount || '0.50'));
    setMaxClaims(String(task.max_claims || '1'));
    
    // Parse flair/subtype
    if (task.flair) {
      if (['text', 'image', 'video', 'link'].includes(task.flair)) {
        setPostSubtype(task.flair);
      }
      if (['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'].includes(task.flair.toLowerCase())) {
        setReactionType(task.flair.toLowerCase());
      }
      if (['feed', 'group', 'story'].includes(task.flair.toLowerCase())) {
        setShareType(task.flair.toLowerCase() as any);
      }
      if (['follow', 'like_page'].includes(task.flair.toLowerCase())) {
        setFollowAction(task.flair.toLowerCase() as any);
      }
    }

    if (task.scheduled_for) {
      setIsScheduled(true);
      setScheduledFor(new Date(task.scheduled_for).toISOString().slice(0, 16));
    } else {
      setIsScheduled(false);
      setScheduledFor('');
    }

    setMediaFiles([]);
    if (task.image_url) {
      setExistingMediaUrls(parseMediaItems(task.image_url).map(m => m.url));
    } else {
      setExistingMediaUrls([]);
    }

    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Upload media if present
      let uploadedUrls: string[] = [...existingMediaUrls];
      if (mediaFiles.length > 0) {
        const supabase = createClient();
        for (const item of mediaFiles) {
          const fileExt = item.name.split('.').pop();
          const fileName = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
          const filePath = `tasks/${fileName}`;

          const { error: uploadErr } = await supabase.storage
            .from('proofs')
            .upload(filePath, item.file);

          if (!uploadErr) {
            const { data: { publicUrl } } = supabase.storage
              .from('proofs')
              .getPublicUrl(filePath);
            uploadedUrls.push(publicUrl);
          }
        }
      }

      const serializedMedia = uploadedUrls.length > 0 ? serializeMediaUrls(uploadedUrls) : null;

      // Determine appropriate flair
      let computedFlair: string = postSubtype;
      if (taskType === 'like') computedFlair = reactionType;
      if (taskType === 'share') computedFlair = shareType;
      if (taskType === 'follow') computedFlair = followAction;

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('platform', 'facebook');
      formData.append('task_type', taskType);
      formData.append('task_category', 'standard');
      formData.append('content_mode', contentMode);
      formData.append('post_link', postLink.trim());
      formData.append('instructions', instructions.trim());
      formData.append('content_body', contentBody.trim());
      formData.append('payment_amount', paymentAmount);
      formData.append('max_claims', maxClaims);
      formData.append('flair', computedFlair);
      if (serializedMedia) formData.append('image_url', serializedMedia);
      if (isScheduled && scheduledFor) formData.append('scheduled_for', new Date(scheduledFor).toISOString());

      let res;
      if (editingTaskId) {
        res = await updateTask(editingTaskId, formData);
      } else {
        res = await createTask(formData);
      }

      if (res?.error) {
        alert(res.error);
        setIsSubmitting(false);
        return;
      }

      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Error saving task');
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this Facebook task?')) return;
    setDeletingId(taskId);
    const res = await deleteTask(taskId);
    if (res?.error) {
      alert(res.error);
      setDeletingId(null);
    } else {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setDeletingId(null);
    }
  };

  const getCategoryIcon = (key: string) => {
    switch (key) {
      case 'post': return <Film size={14} />;
      case 'comment': return <MessageSquare size={14} />;
      case 'like': return <ThumbsUp size={14} />;
      case 'share': return <Share2 size={14} />;
      case 'follow': return <UserPlus size={14} />;
      case 'join_group': return <Users size={14} />;
      case 'story_view': return <Eye size={14} />;
      default: return <FacebookIcon size={14} />;
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(24, 119, 242, 0.12)',
              border: '1px solid rgba(24, 119, 242, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(24, 119, 242, 0.15)'
            }}>
              <FacebookIcon size={24} color="#1877F2" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Manage Facebook Tasks
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            Create and manage all 7 categories of Facebook tasks for workers.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 22px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, #1877F2 0%, #0c5dc7 100%)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(24, 119, 242, 0.35)',
            transition: 'transform 0.15s ease'
          }}
        >
          <Plus size={18} /> + Create Facebook Task
        </button>
      </div>

      {/* Top Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* TOTAL APPROVED TASKS */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '18px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              TOTAL APPROVED TASKS
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Check size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {initialStats?.totalApprovedTasks || 0}
          </div>
        </div>

        {/* TOTAL MONEY GIVEN */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '18px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              TOTAL MONEY GIVEN
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(24, 119, 242, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1877F2' }}>
              <span style={{ fontWeight: 800, fontSize: '14px' }}>$</span>
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
            ${(initialStats?.totalMoneyGiven || 0).toFixed(2)}
          </div>
        </div>

        {/* BASE AMOUNT GIVEN */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '18px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              BASE AMOUNT GIVEN
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
              <span style={{ fontWeight: 800, fontSize: '14px' }}>$</span>
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
            ${(initialStats?.totalBaseMoneyGiven || 0).toFixed(2)}
          </div>
        </div>

        {/* BONUS AMOUNT GIVEN */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '18px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              BONUS AMOUNT GIVEN
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}>
              <Sparkles size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
            ${(initialStats?.totalBonusGiven || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '16px'
      }}>
        {/* Active vs Completed Tabs */}
        <div style={{
          display: 'flex',
          gap: '6px',
          background: 'var(--bg-secondary)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'active' ? '#1877F2' : 'transparent',
              color: activeTab === 'active' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Active Tasks
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'completed' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'completed' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Completed / Claimed
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Search Facebook tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px',
              borderRadius: '8px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Category Filter Pills with Live Counts */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '20px'
      }}>
        {FACEBOOK_TASK_TYPES.map(cat => {
          const count = categoryCounts[cat.key as keyof typeof categoryCounts] ?? 0;
          const isSelected = selectedType === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedType(cat.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                border: isSelected ? '1px solid #1877F2' : '1px solid var(--border-color)',
                background: isSelected ? 'rgba(24, 119, 242, 0.12)' : 'var(--bg-surface)',
                color: isSelected ? '#1877F2' : 'var(--text-secondary)',
                fontSize: '12.5px',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {getCategoryIcon(cat.key)}
              <span>{cat.label}</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '10px',
                background: isSelected ? '#1877F2' : 'var(--bg-secondary)',
                color: isSelected ? '#fff' : 'var(--text-muted)'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tasks Table */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>ID</th>
                <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>TASK</th>
                <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>TARGET LINK</th>
                <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>SLOTS</th>
                <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>PAYMENT</th>
                <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>TYPE</th>
                <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>DATE</th>
                <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No Facebook tasks found. Click &quot;+ Create Facebook Task&quot; above to publish a new one.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', color: 'var(--text-muted)' }}>
                      #{task.task_seq_id || task.id.substring(0, 6)}
                    </td>

                    <td style={{ padding: '14px 16px', maxWidth: '300px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)', marginBottom: '3px' }}>
                        {task.title}
                      </div>
                      {task.flair && (
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: 'rgba(24, 119, 242, 0.1)',
                          color: '#1877F2',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'capitalize'
                        }}>
                          {task.flair.replace('_', ' ')}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px', maxWidth: '240px' }}>
                      {task.post_link ? (
                        <a
                          href={task.post_link}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#1877F2',
                            fontSize: '12.5px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '220px'
                          }}
                        >
                          Target Link <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'var(--bg-secondary)',
                        fontWeight: 600
                      }}>
                        👥 {task.active_claims_count || 0}/{task.max_claims || 1}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#10b981', fontSize: '13.5px' }}>
                      ${Number(task.payment_amount || 0).toFixed(2)}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(24, 119, 242, 0.08)', color: '#1877F2', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>
                        {getCategoryIcon(task.task_type)}
                        {task.task_type?.replace('_', ' ')}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(task.created_at).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => openEditModal(task)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          disabled={deletingId === task.id}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#ef4444',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Facebook Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '18px',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '92vh',
                overflowY: 'auto',
                padding: '28px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
                position: 'relative'
              }}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(24, 119, 242, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1877F2'
                }}>
                  <FacebookIcon size={22} color="#1877F2" />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {editingTaskId ? 'Edit Facebook Task' : 'Create Facebook Task'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Configure target link, content, slots, and rewards.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 1. Category Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    TASK CATEGORY
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    {FACEBOOK_TASK_TYPES.filter(t => t.key !== 'all').map(cat => {
                      const isSel = taskType === cat.key;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => handleTypeChange(cat.key)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '9px 12px',
                            borderRadius: '10px',
                            border: isSel ? '2px solid #1877F2' : '1px solid var(--border-color)',
                            background: isSel ? 'rgba(24, 119, 242, 0.1)' : 'var(--bg-secondary)',
                            color: isSel ? '#1877F2' : 'var(--text-primary)',
                            fontSize: '12px',
                            fontWeight: isSel ? 700 : 500,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          {getCategoryIcon(cat.key)}
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Specific Sub-options depending on category */}
                {/* CATEGORY 1: POST */}
                {taskType === 'post' && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {/* Post Type */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          Post Type
                        </label>
                        <select
                          value={postSubtype}
                          onChange={(e) => {
                            const sub = e.target.value as any;
                            setPostSubtype(sub);
                            setInstructions(getDefaultFacebookInstructions('post', sub, contentMode));
                          }}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                        >
                          {FACEBOOK_POST_TYPES.map(p => (
                            <option key={p.key} value={p.key}>{p.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Content Source */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          Content Source
                        </label>
                        <select
                          value={contentMode}
                          onChange={(e) => {
                            const mode = e.target.value as any;
                            setContentMode(mode);
                            setMaxClaims(mode === 'provided' ? '1' : '10');
                            setInstructions(getDefaultFacebookInstructions('post', postSubtype, mode));
                          }}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                        >
                          <option value="provided">Admin Provided Content</option>
                          <option value="custom">User Generated Content</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* CATEGORY 2: COMMENT */}
                {taskType === 'comment' && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Comment Content Source
                      </label>
                      <select
                        value={contentMode}
                        onChange={(e) => {
                          const mode = e.target.value as any;
                          setContentMode(mode);
                          setInstructions(getDefaultFacebookInstructions('comment', postSubtype, mode));
                        }}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                      >
                        <option value="provided">Admin Provided Comment</option>
                        <option value="custom">User Generated Comment</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* CATEGORY 3: LIKE / REACTION */}
                {taskType === 'like' && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Select Required Reaction Type
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {FACEBOOK_REACTION_TYPES.map(r => {
                        const isR = reactionType === r.key;
                        return (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() => {
                              setReactionType(r.key);
                              setTitle(`React with ${r.label} on Facebook Post`);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 14px',
                              borderRadius: '20px',
                              border: isR ? '2px solid #1877F2' : '1px solid var(--border-color)',
                              background: isR ? 'rgba(24, 119, 242, 0.15)' : 'var(--bg-surface)',
                              color: isR ? '#1877F2' : 'var(--text-primary)',
                              fontSize: '13px',
                              fontWeight: isR ? 700 : 500,
                              cursor: 'pointer'
                            }}
                          >
                            <span>{r.icon}</span>
                            <span>{r.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CATEGORY 4: SHARE */}
                {taskType === 'share' && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Share Destination
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {FACEBOOK_SHARE_TYPES.map(s => {
                        const isS = shareType === s.key;
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => {
                              setShareType(s.key as any);
                              setTitle(`Share Facebook Post to ${s.label.replace('Share to ', '')}`);
                            }}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: isS ? '2px solid #1877F2' : '1px solid var(--border-color)',
                              background: isS ? 'rgba(24, 119, 242, 0.12)' : 'var(--bg-surface)',
                              color: isS ? '#1877F2' : 'var(--text-primary)',
                              fontSize: '12.5px',
                              fontWeight: isS ? 700 : 500,
                              cursor: 'pointer'
                            }}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CATEGORY 5: FOLLOW / LIKE PAGE */}
                {taskType === 'follow' && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Target Action
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {FACEBOOK_FOLLOW_ACTIONS.map(a => {
                        const isA = followAction === a.key;
                        return (
                          <button
                            key={a.key}
                            type="button"
                            onClick={() => {
                              setFollowAction(a.key as any);
                              setTitle(a.key === 'like_page' ? 'Like Facebook Page' : 'Follow Facebook Page/Profile');
                            }}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: isA ? '2px solid #1877F2' : '1px solid var(--border-color)',
                              background: isA ? 'rgba(24, 119, 242, 0.12)' : 'var(--bg-surface)',
                              color: isA ? '#1877F2' : 'var(--text-primary)',
                              fontSize: '13px',
                              fontWeight: isA ? 700 : 500,
                              cursor: 'pointer'
                            }}
                          >
                            {a.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Task Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Share product launch on Facebook group"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                {/* 4. Target Link */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    {taskType === 'post' ? 'Target Facebook Page / Group / Profile URL *' :
                     taskType === 'join_group' ? 'Facebook Group URL *' :
                     taskType === 'follow' ? 'Facebook Page / Profile URL *' :
                     taskType === 'story_view' ? 'Facebook Story / Profile URL *' :
                     'Target Facebook Post URL *'}
                  </label>
                  <input
                    type="url"
                    required
                    value={postLink}
                    onChange={(e) => setPostLink(e.target.value)}
                    placeholder="https://www.facebook.com/..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                {/* 5. Post Content / Comment Content */}
                {(taskType === 'post' || taskType === 'comment') && contentMode === 'provided' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {taskType === 'post' ? 'Post Content / Text *' : 'Comment Content *'}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={contentBody}
                      onChange={(e) => setContentBody(e.target.value)}
                      placeholder={taskType === 'post' ? 'Enter the exact post text / caption to publish...' : 'Enter the exact comment text to post...'}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                )}

                {/* 6. Media Attachment for Post Image/Video */}
                {taskType === 'post' && (postSubtype === 'image' || postSubtype === 'video') && contentMode === 'provided' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Attach Media ({postSubtype === 'video' ? 'Video File' : 'Image Files'})
                    </label>
                    <input
                      type="file"
                      ref={mediaInputRef}
                      accept={postSubtype === 'video' ? 'video/*' : 'image/*'}
                      multiple={postSubtype === 'image'}
                      onChange={(e) => handleMediaSelect(e.target.files)}
                      style={{ display: 'none' }}
                    />
                    <div
                      onClick={() => mediaInputRef.current?.click()}
                      style={{
                        border: '2px dashed var(--border-color)',
                        borderRadius: '10px',
                        padding: '18px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <Upload size={22} style={{ margin: '0 auto 6px', display: 'block', color: '#1877F2' }} />
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Click to upload {postSubtype === 'video' ? 'video' : 'images'}</div>
                    </div>

                    {/* Previews */}
                    {mediaFiles.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {mediaFiles.map((m) => (
                          <div key={m.id} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            {m.type === 'video' ? (
                              <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                <Film size={20} />
                              </div>
                            ) : (
                              <img src={m.previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveMediaFile(m.id)}
                              style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 7. Instructions */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Worker Instructions *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                {/* 8. Slots & Payment */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Number of Slots *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={maxClaims}
                      onChange={(e) => setMaxClaims(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Payment per Slot ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* 9. Schedule Release (Optional) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="fbSchedule"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="fbSchedule" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>
                    Schedule task for future release
                  </label>
                </div>

                {isScheduled && (
                  <div>
                    <input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#1877F2',
                      color: '#fff',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.7 : 1
                    }}
                  >
                    {isSubmitting ? 'Saving Task...' : editingTaskId ? 'Update Task' : 'Publish Facebook Task'}
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
