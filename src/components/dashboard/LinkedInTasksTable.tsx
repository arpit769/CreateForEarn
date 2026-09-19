'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Pencil, ExternalLink, MessageSquare, ThumbsUp, 
  Repeat, UserPlus, Users, Share2, FileText, CheckCircle2, Clock, Check, Upload, Image as ImageIcon, Video, Link2, Sparkles, Calendar
} from 'lucide-react';
import { createTask, updateTask, deleteTask } from '@/actions/tasks';
import { useSearchParams } from 'next/navigation';
import { 
  LinkedInIcon, 
  LINKEDIN_TASK_TYPES, 
  LINKEDIN_POST_TYPES, 
  LINKEDIN_REACTION_OPTIONS, 
  LINKEDIN_REPOST_OPTIONS, 
  LINKEDIN_SHARE_OPTIONS,
  LinkedInTaskType,
  LinkedInPostType,
  LinkedInReactionType,
  LinkedInRepostType,
  LinkedInShareMethod,
  LinkedInContentSource,
  getDefaultLinkedInInstructions,
  getDefaultLinkedInPayment
} from '@/utils/linkedin';
import { parseMediaItems, serializeMediaUrls, isVideoUrl } from '@/utils/media';
import { parseCommentItems } from '@/utils/comments';
import { createClient } from '@/utils/supabase/client';

export const LINKEDIN_TAB_TYPES = [
  { key: 'all', label: 'All Tasks', icon: LinkedInIcon },
  { key: 'post', label: 'Post', icon: FileText },
  { key: 'comment', label: 'Comment', icon: MessageSquare },
  { key: 'like', label: 'Like / Reaction', icon: ThumbsUp },
  { key: 'repost', label: 'Repost', icon: Repeat },
  { key: 'follow', label: 'Follow', icon: UserPlus },
  { key: 'connect', label: 'Connect', icon: Users },
  { key: 'share', label: 'Share', icon: Share2 },
] as const;

export default function LinkedInTasksTable({ 
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

  // Calculate aggregate lifetime stats
  const totalApprovedTasks = initialStats ? initialStats.totalApprovedTasks : tasks.reduce((sum, t) => sum + (t.approved_claims_count || 0), 0);
  const totalBaseMoneyGiven = initialStats ? initialStats.totalBaseMoneyGiven : tasks.reduce((sum, t) => sum + ((t.approved_claims_count || 0) * (Number(t.payment_amount) || 0)), 0);
  const totalBonusGiven = initialStats ? initialStats.totalBonusGiven : tasks.reduce((sum, t) => sum + (t.total_bonus_amount || 0), 0);
  const totalMoneyGiven = initialStats ? initialStats.totalMoneyGiven : (totalBaseMoneyGiven + totalBonusGiven);

  // Form State
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<LinkedInTaskType>('post');
  const [postType, setPostType] = useState<LinkedInPostType>('text');
  const [contentSource, setContentSource] = useState<'admin_provided' | 'ugc'>('admin_provided');
  const [reactionType, setReactionType] = useState<LinkedInReactionType>('like');
  const [repostType, setRepostType] = useState<LinkedInRepostType>('repost');
  const [shareMethod, setShareMethod] = useState<LinkedInShareMethod>('share_on_linkedin');
  const [connectionNote, setConnectionNote] = useState('');
  
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
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.instructions && t.instructions.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.post_link && t.post_link.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const resetForm = (targetType: LinkedInTaskType = 'post') => {
    setTitle('');
    setTaskType(targetType);
    setPostType('text');
    setContentSource('admin_provided');
    setReactionType('like');
    setRepostType('repost');
    setShareMethod('share_on_linkedin');
    setConnectionNote('');
    setPostLink('');
    setInstructions(getDefaultLinkedInInstructions(targetType, 'text', 'admin_provided', 'like', 'repost', 'share_on_linkedin'));
    setContentBody('');
    setPaymentAmount(getDefaultLinkedInPayment(targetType));
    setMaxClaims(targetType === 'post' ? '1' : '10');
    setIsScheduled(false);
    setScheduledFor('');
    setMediaFiles([]);
    setExistingMediaUrls([]);
    setEditingTaskId(null);
  };

  const openCreateModal = (type: LinkedInTaskType = 'post') => {
    resetForm(type);
    setIsModalOpen(true);
  };

  const handleTaskTypeChange = (newType: LinkedInTaskType) => {
    setTaskType(newType);
    if (!editingTaskId) {
      setInstructions(getDefaultLinkedInInstructions(newType, postType, contentSource, reactionType, repostType, shareMethod));
      setPaymentAmount(getDefaultLinkedInPayment(newType));
      if (newType === 'post' && contentSource === 'admin_provided') {
        setMaxClaims('1');
      }
    }
  };

  const handlePostTypeChange = (newPostType: LinkedInPostType) => {
    setPostType(newPostType);
    if (!editingTaskId && taskType === 'post') {
      setInstructions(getDefaultLinkedInInstructions('post', newPostType, contentSource, reactionType, repostType, shareMethod));
    }
  };

  const handleContentSourceChange = (newSource: LinkedInContentSource) => {
    setContentSource(newSource);
    if (!editingTaskId && (taskType === 'post' || taskType === 'comment')) {
      setInstructions(getDefaultLinkedInInstructions(taskType, postType, newSource, reactionType, repostType, shareMethod));
      if (taskType === 'post') {
        setMaxClaims(newSource === 'admin_provided' ? '1' : '10');
      }
    }
  };

  const handleReactionTypeChange = (newReaction: LinkedInReactionType) => {
    setReactionType(newReaction);
    if (!editingTaskId && taskType === 'like') {
      setInstructions(getDefaultLinkedInInstructions('like', postType, contentSource, newReaction, repostType, shareMethod));
    }
  };

  const handleRepostTypeChange = (newRepost: LinkedInRepostType) => {
    setRepostType(newRepost);
    if (!editingTaskId && taskType === 'repost') {
      setInstructions(getDefaultLinkedInInstructions('repost', postType, contentSource, reactionType, newRepost, shareMethod));
    }
  };

  const handleShareMethodChange = (newShare: LinkedInShareMethod) => {
    setShareMethod(newShare);
    if (!editingTaskId && taskType === 'share') {
      setInstructions(getDefaultLinkedInInstructions('share', postType, contentSource, reactionType, repostType, newShare));
    }
  };

  const openEditModal = (task: any) => {
    setEditingTaskId(task.id);
    setTitle(task.title || '');
    setTaskType(task.task_type || 'post');
    setPostType(task.flair && ['text', 'image', 'video', 'article_link'].includes(task.flair) ? task.flair : 'text');
    setContentSource(task.content_mode === 'provided' ? 'admin_provided' : 'ugc');
    setReactionType(task.flair && ['like', 'celebrate', 'support', 'love', 'insightful', 'funny'].includes(task.flair) ? task.flair : 'like');
    setRepostType(task.flair && ['repost', 'repost_with_thoughts'].includes(task.flair) ? task.flair : 'repost');
    setShareMethod(task.flair && ['share_on_linkedin', 'send_privately'].includes(task.flair) ? task.flair : 'share_on_linkedin');
    setConnectionNote(task.task_type === 'connect' ? (task.content_body || '') : '');
    setPostLink(task.post_link || '');
    setInstructions(task.instructions || '');
    setContentBody(task.task_type !== 'connect' ? (task.content_body || '') : '');
    setPaymentAmount(task.payment_amount?.toString() || '0.50');
    setMaxClaims(task.max_claims?.toString() || '1');
    setIsScheduled(!!task.scheduled_for);
    setScheduledFor(task.scheduled_for ? new Date(task.scheduled_for).toISOString().slice(0, 16) : '');
    
    if (task.image_url) {
      setExistingMediaUrls(parseMediaItems(task.image_url).map(m => m.url));
    } else {
      setExistingMediaUrls([]);
    }
    setMediaFiles([]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }

    setIsSubmitting(true);
    try {
      // Handle file uploads if any
      let uploadedUrls: string[] = [];
      if (mediaFiles.length > 0) {
        const supabase = createClient();
        for (const item of mediaFiles) {
          const fileExt = item.file.name.split('.').pop();
          const fileName = `linkedin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          const filePath = `task_media/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('task_images')
            .upload(filePath, item.file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('task_images')
              .getPublicUrl(filePath);
            uploadedUrls.push(publicUrl);
          }
        }
      }

      const allMedia = [...existingMediaUrls, ...uploadedUrls];
      const serializedMedia = serializeMediaUrls(allMedia);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('task_type', taskType);
      formData.append('platform', 'linkedin');
      formData.append('task_category', 'standard');
      formData.append('content_mode', contentSource === 'admin_provided' ? 'provided' : 'custom');
      formData.append('payment_amount', paymentAmount);
      
      let computedFlair = '';
      if (taskType === 'post') computedFlair = postType;
      else if (taskType === 'like') computedFlair = reactionType;
      else if (taskType === 'repost') computedFlair = repostType;
      else if (taskType === 'share') computedFlair = shareMethod;

      if (computedFlair) formData.append('flair', computedFlair);

      // Auto-set slots for Admin provided content
      let computedSlots = maxClaims;
      if (taskType === 'post' && contentSource === 'admin_provided') {
        computedSlots = '1';
      } else if (taskType === 'comment' && contentSource === 'admin_provided') {
        const commentList = parseCommentItems(contentBody);
        computedSlots = commentList.length > 0 ? commentList.length.toString() : '1';
      }
      formData.append('max_claims', computedSlots);

      if (postLink) formData.append('post_link', postLink.trim());
      if (instructions) formData.append('instructions', instructions.trim());
      
      let finalContentBody = contentBody.trim();
      if (taskType === 'connect' && connectionNote.trim()) {
        finalContentBody = connectionNote.trim();
      }
      if (finalContentBody) formData.append('content_body', finalContentBody);
      if (serializedMedia) formData.append('image_url', serializedMedia);

      if (isScheduled && scheduledFor) {
        formData.append('scheduled_for', new Date(scheduledFor).toISOString());
      }

      let res: any;
      if (editingTaskId) {
        res = await updateTask(editingTaskId, formData);
      } else {
        res = await createTask(formData);
      }

      if (res && res.error) {
        alert('Error saving task: ' + res.error);
      } else {
        setIsModalOpen(false);
        resetForm();
        window.location.reload();
      }
    } catch (err: any) {
      alert('Submission failed: ' + err.message);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setDeletingId(id);
    const res = await deleteTask(id);
    if (!res.error) {
      setTasks(prev => prev.filter(t => t.id !== id));
    } else {
      alert('Error deleting: ' + res.error);
    }
    setDeletingId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#0A66C2', color: '#fff'
            }}>
              <LinkedInIcon size={20} color="#ffffff" />
            </span>
            Manage LinkedIn Tasks
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Create and manage tasks for workers.
          </p>
        </div>

        <button
          onClick={() => openCreateModal('post')}
          style={{
            padding: '10px 20px', borderRadius: '10px',
            background: '#0A66C2', color: '#fff',
            border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 12px rgba(10, 102, 194, 0.3)',
            transition: 'all 0.15s ease'
          }}
        >
          <Plus size={16} /> Create LinkedIn Task
        </button>
      </div>

      {/* 4-Card Aggregate Stats Row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', flexWrap: 'wrap' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: activeTab === 'active' ? '#0A66C2' : 'transparent',
              color: activeTab === 'active' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'active' ? '0 2px 8px rgba(10, 102, 194, 0.25)' : 'none'
            }}
          >
            Active Tasks
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: activeTab === 'completed' ? '#0A66C2' : 'transparent',
              color: activeTab === 'completed' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'completed' ? '0 2px 8px rgba(10, 102, 194, 0.25)' : 'none'
            }}
          >
            Completed
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '400px', flex: '1 1 260px' }}>
          <input
            type="text"
            placeholder="Search tasks or links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Task Type Filters */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {LINKEDIN_TAB_TYPES.map(tab => {
          const isSelected = selectedType === tab.key;
          const Icon = tab.icon;
          const count = tab.key === 'all' 
            ? displayedTasks.length 
            : displayedTasks.filter(t => t.task_type === tab.key).length;

          return (
            <button
              key={tab.key}
              onClick={() => setSelectedType(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: isSelected ? '1px solid #0A66C2' : '1px solid var(--border-subtle)',
                background: isSelected ? 'rgba(10, 102, 194, 0.12)' : 'var(--bg-elevated)',
                color: isSelected ? '#0A66C2' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              <span style={{
                fontSize: '11px',
                background: isSelected ? '#0A66C2' : 'var(--border-subtle)',
                color: isSelected ? '#fff' : 'var(--text-muted)',
                padding: '1px 6px',
                borderRadius: '10px',
                fontWeight: 600
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
                  No LinkedIn tasks found. Click "Create LinkedIn Task" above to publish a new one.
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
                          style={{ color: '#0A66C2', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600, fontSize: '13px' }}
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
                        background: 'rgba(10, 102, 194, 0.1)',
                        color: '#0A66C2',
                        border: '1px solid rgba(10, 102, 194, 0.25)'
                      }}>
                        {t.task_type}
                        {t.reaction_type && ` • ${t.reaction_type}`}
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
                          onClick={() => openEditModal(t)}
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
            No LinkedIn tasks found matching your search.
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
                      style={{ color: '#0A66C2', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Target Link ↗
                    </a>
                  ) : (
                    <span>LinkedIn</span>
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
                    color: '#0A66C2'
                  }}>
                    {t.task_type}
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
                  onClick={() => openEditModal(t)}
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

      {/* CREATE / EDIT MODAL */}
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
            padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: '20px',
                padding: '28px',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <LinkedInIcon size={24} />
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {editingTaskId ? 'Edit LinkedIn Task' : 'Create LinkedIn Task'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* Task Type Select */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Task Category *
                  </label>
                  <select
                    value={taskType}
                    onChange={(e) => handleTaskTypeChange(e.target.value as LinkedInTaskType)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  >
                    {LINKEDIN_TASK_TYPES.map(t => (
                      <option key={t.type} value={t.type}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Post Subtype (Only for Post) */}
                {taskType === 'post' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Post Type *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {LINKEDIN_POST_TYPES.map(pt => (
                        <button
                          key={pt.type}
                          type="button"
                          onClick={() => handlePostTypeChange(pt.type)}
                          style={{
                            padding: '8px',
                            borderRadius: '8px',
                            border: postType === pt.type ? '1px solid #0A66C2' : '1px solid var(--border-subtle)',
                            background: postType === pt.type ? 'rgba(10, 102, 194, 0.12)' : 'var(--bg-card)',
                            color: postType === pt.type ? '#0A66C2' : 'var(--text-secondary)',
                            fontWeight: postType === pt.type ? 700 : 500,
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          {pt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Source (For Post and Comment) */}
                {(taskType === 'post' || taskType === 'comment') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Content Source *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleContentSourceChange('admin_provided')}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: contentSource === 'admin_provided' ? '1px solid #0A66C2' : '1px solid var(--border-subtle)',
                          background: contentSource === 'admin_provided' ? 'rgba(10, 102, 194, 0.12)' : 'var(--bg-card)',
                          color: contentSource === 'admin_provided' ? '#0A66C2' : 'var(--text-secondary)',
                          fontWeight: contentSource === 'admin_provided' ? 700 : 500,
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        Admin Provided {taskType === 'post' ? 'Content' : 'Comment'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleContentSourceChange('ugc')}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: contentSource === 'ugc' ? '1px solid #0A66C2' : '1px solid var(--border-subtle)',
                          background: contentSource === 'ugc' ? 'rgba(10, 102, 194, 0.12)' : 'var(--bg-card)',
                          color: contentSource === 'ugc' ? '#0A66C2' : 'var(--text-secondary)',
                          fontWeight: contentSource === 'ugc' ? 700 : 500,
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        User Generated {taskType === 'post' ? 'Content' : 'Comment'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Reaction Type (Only for Like / Reaction) */}
                {taskType === 'like' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Reaction Type *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {LINKEDIN_REACTION_OPTIONS.map(opt => (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => handleReactionTypeChange(opt.type)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: reactionType === opt.type ? `1px solid ${opt.color}` : '1px solid var(--border-subtle)',
                            background: reactionType === opt.type ? 'var(--bg-card)' : 'transparent',
                            color: reactionType === opt.type ? opt.color : 'var(--text-secondary)',
                            fontWeight: reactionType === opt.type ? 700 : 500,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            justifyContent: 'center'
                          }}
                        >
                          <span>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Repost Type (Only for Repost) */}
                {taskType === 'repost' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Repost Type *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {LINKEDIN_REPOST_OPTIONS.map(opt => (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => handleRepostTypeChange(opt.type)}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: repostType === opt.type ? '1px solid #0A66C2' : '1px solid var(--border-subtle)',
                            background: repostType === opt.type ? 'rgba(10, 102, 194, 0.12)' : 'var(--bg-card)',
                            color: repostType === opt.type ? '#0A66C2' : 'var(--text-secondary)',
                            fontWeight: repostType === opt.type ? 700 : 500,
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share Method (Only for Share) */}
                {taskType === 'share' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Share Method *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {LINKEDIN_SHARE_OPTIONS.map(opt => (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => handleShareMethodChange(opt.type)}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: shareMethod === opt.type ? '1px solid #0A66C2' : '1px solid var(--border-subtle)',
                            background: shareMethod === opt.type ? 'rgba(10, 102, 194, 0.12)' : 'var(--bg-card)',
                            color: shareMethod === opt.type ? '#0A66C2' : 'var(--text-secondary)',
                            fontWeight: shareMethod === opt.type ? 700 : 500,
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Share insights on modern engineering leadership..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Target URL (for comment, like, repost, follow, connect, share) */}
                {taskType !== 'post' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {taskType === 'follow' ? 'LinkedIn Page / Profile URL *' :
                       taskType === 'connect' ? 'LinkedIn Profile URL *' : 'Target Post URL *'}
                    </label>
                    <input
                      type="url"
                      required
                      placeholder={taskType === 'follow' || taskType === 'connect' ? 'https://www.linkedin.com/in/username' : 'https://www.linkedin.com/posts/...'}
                      value={postLink}
                      onChange={(e) => setPostLink(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                )}

                {/* Connection Note (Optional, only for connect) */}
                {taskType === 'connect' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Connection Note (Optional)
                    </label>
                    <textarea
                      placeholder="e.g. Hi! I'd love to connect and follow your industry updates..."
                      value={connectionNote}
                      onChange={(e) => setConnectionNote(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        minHeight: '70px'
                      }}
                    />
                  </div>
                )}

                {/* Content / Comment Body (When Admin Provided) */}
                {contentSource === 'admin_provided' && (taskType === 'post' || taskType === 'comment') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {taskType === 'post' ? 'Post Content *' : 'Comment Content (separate multiple variations by ---) *'}
                    </label>
                    <textarea
                      required
                      placeholder={taskType === 'post' ? 'Enter exact LinkedIn post copy...' : 'First comment variation\n---\nSecond comment variation'}
                      value={contentBody}
                      onChange={(e) => setContentBody(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        minHeight: '90px'
                      }}
                    />
                  </div>
                )}

                {/* Media Attachment Upload for Post (Image / Video) */}
                {taskType === 'post' && (postType === 'image' || postType === 'video') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Media Attachments (Images / Videos)
                    </label>
                    
                    <div style={{
                      border: '2px dashed var(--border-medium)',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center',
                      background: 'var(--bg-card)',
                      cursor: 'pointer'
                    }}
                    onClick={() => mediaInputRef.current?.click()}
                    >
                      <Upload size={24} style={{ color: '#0A66C2', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Click to upload images or videos
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Supports PNG, JPG, WEBP, MP4, MOV
                      </p>
                      <input
                        ref={mediaInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleMediaSelect(e.target.files)}
                      />
                    </div>

                    {/* Previews */}
                    {(mediaFiles.length > 0 || existingMediaUrls.length > 0) && (
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                        {existingMediaUrls.map((url, i) => (
                          <div key={i} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                            <img src={url} alt="existing" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => setExistingMediaUrls(prev => prev.filter((_, idx) => idx !== i))}
                              style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer' }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        {mediaFiles.map(item => (
                          <div key={item.id} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                            <img src={item.previewUrl} alt="new" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => handleRemoveMediaFile(item.id)}
                              style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer' }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Instructions / Guidance */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Instructions / Requirements for Workers
                    </label>
                    <button
                      type="button"
                      onClick={() => setInstructions(getDefaultLinkedInInstructions(taskType, postType, contentSource, reactionType, repostType, shareMethod))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0A66C2',
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
                    rows={4}
                    placeholder="Provide clear steps for the worker (e.g. React thoughtfully, submit screenshot proof with visible reaction)..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      minHeight: '100px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Price & Slots Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Payment per worker ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Show Slots ONLY for UGC or Action Tasks */}
                  {!(
                    (taskType === 'post' && contentSource === 'admin_provided') ||
                    (taskType === 'comment' && contentSource === 'admin_provided')
                  ) && (
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Number of Slots *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={maxClaims}
                        onChange={(e) => setMaxClaims(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-medium)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Submit / Cancel Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
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
                      borderRadius: '10px',
                      background: '#0A66C2',
                      color: '#fff',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(10, 102, 194, 0.3)'
                    }}
                  >
                    {isSubmitting ? 'Saving...' : editingTaskId ? 'Update Task' : 'Publish Task'}
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
