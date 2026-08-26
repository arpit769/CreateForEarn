'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, Pencil, Calendar, ExternalLink, Sparkles, PlaySquare, ThumbsUp, MessageSquare, CornerDownRight, Video, UserPlus, UploadCloud, Link2, X, PlusCircle, Film } from 'lucide-react';
import { createTask, updateTask, deleteTask } from '@/actions/tasks';
import { useSearchParams } from 'next/navigation';
import { parseMediaItems, serializeMediaUrls, isVideoUrl } from '@/utils/media';

export default function YoutubeTasksTable({ initialTasks, taskCategory = 'standard' }: { initialTasks: any[], taskCategory?: 'standard' | 'karma_farm' }) {
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

  const displayedTasks = tasks.filter(t => {
    const isCompleted = t.status === 'completed' || (t.active_claims_count || 0) >= (t.max_claims || 1);
    if (searchQuery.trim()) return true;
    return activeTab === 'completed' ? isCompleted : !isCompleted;
  });

  const filteredTasks = displayedTasks.filter(t => 
    (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.instructions || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.task_seq_id && `task id: ${t.task_seq_id}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.task_seq_id && String(t.task_seq_id).includes(searchQuery.toLowerCase()))
  );

  const totalApprovedTasks = tasks.reduce((sum, t) => sum + (t.approved_claims_count || 0), 0);
  const totalBaseMoneyGiven = tasks.reduce((sum, t) => sum + ((t.approved_claims_count || 0) * (Number(t.payment_amount) || 0)), 0);
  const totalBonusGiven = tasks.reduce((sum, t) => sum + (t.total_bonus_amount || 0), 0);
  const totalMoneyGiven = totalBaseMoneyGiven + totalBonusGiven;

  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  
  // Multi-video state
  const [videoInputMode, setVideoInputMode] = useState<'upload' | 'url'>('upload');
  const [videoFiles, setVideoFiles] = useState<Array<{ id: string; file: File; previewUrl: string; name: string; size: number }>>([]);
  const [existingVideoUrls, setExistingVideoUrls] = useState<string[]>([]);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  
  const [mainCategory, setMainCategory] = useState<'like' | 'comment' | 'comment_reply' | 'subscribe' | 'post'>('like');
  const [postLink, setPostLink] = useState('');
  const [slots, setSlots] = useState('1');
  const [instructions, setInstructions] = useState('');
  
  const [paymentType, setPaymentType] = useState<'base' | 'custom'>('base');
  const [paymentAmount, setPaymentAmount] = useState('0.20');

  // Scheduling state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');

  const handleVideoFilesSelect = (incoming: FileList | File[] | null) => {
    if (!incoming || incoming.length === 0) return;
    const fileList = Array.from(incoming);
    const newItems: Array<{ id: string; file: File; previewUrl: string; name: string; size: number }> = [];

    fileList.forEach(file => {
      if (!file.type.startsWith('video/') && !isVideoUrl(file.name)) {
        alert(`"${file.name}" is not a valid video file. Please choose MP4, WEBM, MOV, etc.`);
        return;
      }
      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: file.size
      });
    });

    if (newItems.length > 0) {
      setVideoFiles(prev => [...prev, ...newItems]);
    }
  };

  const handleRemoveVideoFile = (id: string) => {
    setVideoFiles(prev => {
      const target = prev.find(item => item.id === id);
      if (target?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const handleAddVideoUrl = () => {
    const trimmed = videoUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      alert('Please enter a valid URL starting with http:// or https://');
      return;
    }
    setExistingVideoUrls(prev => [...prev, trimmed]);
    setVideoUrlInput('');
  };

  const resetForm = () => {
    setEditingTaskId(null);
    setTitle('Like YouTube Video');
    setBody('');
    setInstructions('Open the YouTube video link, like the video, and submit a screenshot as proof.');
    setMainCategory('like');
    setSlots('1');
    setPaymentType('base');
    setPaymentAmount('0.20');
    setVideoInputMode('upload');
    
    videoFiles.forEach(f => {
      if (f.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(f.previewUrl);
    });
    setVideoFiles([]);
    setExistingVideoUrls([]);
    setVideoUrlInput('');
    setIsScheduled(false);
    setScheduledFor('');
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTaskId(task.id);
    setTitle(task.title || '');
    setBody(task.content_body || '');
    
    if (task.task_type === 'like') {
      setMainCategory('like');
    } else if (task.task_type === 'comment') {
      setMainCategory('comment');
    } else if (task.task_type === 'comment_reply') {
      setMainCategory('comment_reply');
    } else if (task.task_type === 'subscribe') {
      setMainCategory('subscribe');
    } else {
      setMainCategory('post');
    }

    // Parse attached media
    const parsed = parseMediaItems(task.image_url, task.content_mode);
    setExistingVideoUrls(parsed.map(m => m.url));
    setVideoFiles([]);
    setVideoUrlInput('');
    setVideoInputMode(parsed.length > 0 ? 'url' : 'upload');

    setPostLink(task.post_link || '');
    setSlots(task.max_claims?.toString() || '1');
    setInstructions(task.instructions || '');
    
    // Check if the amount is exactly 0.20 to set 'base', else 'custom'
    if (task.payment_amount && task.payment_amount.toString() === '0.2') {
      setPaymentType('base');
      setPaymentAmount('0.20');
    } else {
      setPaymentType('custom');
      setPaymentAmount(task.payment_amount?.toString() || '0.20');
    }
    if (task.scheduled_for) {
      setIsScheduled(true);
      const d = new Date(task.scheduled_for);
      const pad = (n: number) => n.toString().padStart(2, '0');
      setScheduledFor(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } else {
      setIsScheduled(false);
      setScheduledFor('');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setDeletingId(taskId);
    const res = await deleteTask(taskId);
    if (res?.error) {
      alert('Failed to delete task: ' + res.error);
    } else {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      alert('Task deleted successfully.');
    }
    setDeletingId(null);
  };

  const handleCategoryChange = (cat: 'like' | 'comment' | 'comment_reply' | 'subscribe' | 'post') => {
    setMainCategory(cat);
    if (cat === 'like') {
      setTitle('Like YouTube Video');
      setPaymentAmount('0.05');
      setInstructions('Open the YouTube video link, like the video, and submit a screenshot as proof.');
    } else if (cat === 'comment') {
      setTitle('Comment on YouTube Video');
      setPaymentAmount('0.10');
      setInstructions('Open the YouTube video link, post a relevant comment, and submit a screenshot as proof.');
    } else if (cat === 'comment_reply') {
      setTitle('Reply to a Comment on YouTube');
      setPaymentAmount('0.10');
      setInstructions('Open the YouTube video link, find the specified comment, reply to it, and submit a screenshot as proof.');
    } else if (cat === 'subscribe') {
      setTitle('Subscribe to YouTube Channel');
      setPaymentAmount('0.10');
      setInstructions('Open the YouTube channel link, subscribe to the channel, and submit a screenshot as proof.');
    } else if (cat === 'post') {
      setTitle('Create a YouTube Post/Short');
      setPaymentAmount('0.50');
      setInstructions('Create and publish a YouTube Short/Video as per the instructions, and submit the link to your video.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalTitle = title.trim();
    if (!finalTitle) {
      alert('Please fill all the details first: Task title is compulsory.');
      return;
    }

    if (mainCategory !== 'post' && !postLink.trim()) {
      alert(mainCategory === 'subscribe' ? 'Target YouTube channel link is required.' : 'Target YouTube video link is required.');
      return;
    }

    if (!slots || parseInt(slots) <= 0) {
      alert('Number of slots must be at least 1.');
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', finalTitle);
    formData.append('post_link', postLink.trim());
    formData.append('task_category', 'standard');
    formData.append('platform', 'youtube');
    formData.append('content_mode', 'provided');
    formData.append('subreddit_id', 'open_for_all');
    formData.append('task_type', mainCategory);
    formData.append('max_claims', (mainCategory === 'like' || mainCategory === 'subscribe') ? slots : '1');
    formData.append('instructions', instructions.trim());
    formData.append('payment_amount', Number(paymentType === 'base' ? '0.20' : paymentAmount).toString());
    
    if (mainCategory === 'post') {
      const uploadedUrls: string[] = [];
      if (videoFiles.length > 0) {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        for (const vItem of videoFiles) {
          const fileExt = vItem.file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('task_images')
            .upload(filePath, vItem.file);
            
          if (uploadError) {
            alert(`Error uploading ${vItem.name}: ` + uploadError.message);
            setIsSubmitting(false);
            return;
          }
          
          const { data } = supabase.storage.from('task_images').getPublicUrl(filePath);
          uploadedUrls.push(data.publicUrl);
        }
      }

      const allUrls = [...existingVideoUrls, ...uploadedUrls];
      if (videoUrlInput.trim() && (videoUrlInput.trim().startsWith('http://') || videoUrlInput.trim().startsWith('https://'))) {
        allUrls.push(videoUrlInput.trim());
      }

      if (allUrls.length === 0) {
        alert('Please attach at least one video file or direct video URL.');
        setIsSubmitting(false);
        return;
      }

      formData.append('image_url', serializeMediaUrls(allUrls));
    }

    if (body.trim()) {
      formData.append('content_body', body.trim());
    }

    if (isScheduled && scheduledFor) {
      formData.append('scheduled_for', new Date(scheduledFor).toISOString());
    }
    
    let res;
    if (editingTaskId) {
      res = await updateTask(editingTaskId, formData);
    } else {
      res = await createTask(formData);
    }
    
    if (res.error) {
      alert("Error: " + res.error);
    } else {
      alert(editingTaskId ? 'Task updated successfully!' : 'Task created successfully!');
      resetForm();
      setIsModalOpen(false);
      window.location.reload();
    }
    
    setIsSubmitting(false);
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Manage YouTube Tasks
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Create and manage YouTube tasks (Like, Comment, Reply, Post) for workers.
          </p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="btn-primary"
        >
          <Plus size={18} /> Create YouTube Task
        </button>
      </div>

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
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <PlaySquare size={20} />
          </div>
        </div>
        <div style={{ flex: '1 1 200px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Bonus Given</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>${totalBonusGiven.toFixed(2)}</p>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
            <Sparkles size={20} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', padding: '4px' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'active' ? 'var(--hero-glow-2)' : 'transparent',
              color: activeTab === 'active' ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            Active Tasks
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'completed' ? 'var(--hero-glow-2)' : 'transparent',
              color: activeTab === 'completed' ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            Completed
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '400px', flex: '1 1 300px' }}>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', padding: '12px 16px', 
              background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', 
              borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' 
            }}
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="admin-desktop-table" style={{ background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
          <thead>
            <tr style={{ background: 'var(--hero-glow-2)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ borderTopLeftRadius: '16px', padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>ID</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Task</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Link</th>
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
                <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No tasks found matching your search.</td>
              </tr>
            ) : filteredTasks.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '13px' }}>
                  {t.task_seq_id ? `${t.task_seq_id}` : '—'}
                </td>
                <td style={{ padding: '12px 14px', maxWidth: '240px' }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.3' }}>{t.title}</p>
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '13px' }}>
                  {t.post_link ? (
                    <a 
                      href={t.post_link} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ color: 'var(--accent-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600, fontSize: '13px' }}
                    >
                      Video Link ↗
                    </a>
                  ) : 'N/A'}
                </td>
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '4px', 
                    padding: '3px 8px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
                    background: (t.active_claims_count || 0) >= (t.max_claims || 1) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.06)',
                    color: (t.active_claims_count || 0) >= (t.max_claims || 1) ? '#ef4444' : 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    whiteSpace: 'nowrap'
                  }}>
                    👥 {t.active_claims_count || 0}/{t.max_claims || 1}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap', fontSize: '13px' }}>${t.payment_amount?.toFixed(2)}</td>
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {t.task_type === 'like' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#ef4444', fontSize: '12px', fontWeight: 600 }}><ThumbsUp size={14} /> Like</span>
                    ) : t.task_type === 'comment' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#3b82f6', fontSize: '12px', fontWeight: 600 }}><MessageSquare size={14} /> Comment</span>
                    ) : t.task_type === 'comment_reply' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#a855f7', fontSize: '12px', fontWeight: 600 }}><CornerDownRight size={14} /> Reply</span>
                    ) : t.task_type === 'subscribe' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#ec4899', fontSize: '12px', fontWeight: 600 }}><UserPlus size={14} /> Subscribe</span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#10b981', fontSize: '12px', fontWeight: 600 }}><Video size={14} /> Post</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {t.scheduled_for && new Date(t.scheduled_for) > new Date() ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px', background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', borderRadius: '4px', fontSize: '10px', fontWeight: 600, width: 'fit-content' }}>
                        <PlaySquare size={12} /> Scheduled
                      </span>
                      <span style={{ fontSize: '11px' }}>{new Date(t.scheduled_for).toLocaleString()}</span>
                    </div>
                  ) : (
                    new Date(t.created_at).toLocaleDateString()
                  )}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    <button
                      onClick={() => handleEditTask(t)}
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
                      onClick={() => handleDeleteTask(t.id)}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '12px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="admin-modal-box" style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editingTaskId ? 'Edit YouTube Task' : 'Create YouTube Task'}
                </h2>
                <button onClick={() => { resetForm(); setIsModalOpen(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
              </div>

              <form onSubmit={handleFormSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Task Type</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(['like', 'comment', 'comment_reply', 'subscribe', 'post'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryChange(cat)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${mainCategory === cat ? '#ef4444' : 'var(--border-medium)'}`,
                          background: mainCategory === cat ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-elevated)',
                          color: mainCategory === cat ? '#ef4444' : 'var(--text-secondary)',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        {cat === 'like' && <ThumbsUp size={16} />}
                        {cat === 'comment' && <MessageSquare size={16} />}
                        {cat === 'comment_reply' && <CornerDownRight size={16} />}
                        {cat === 'subscribe' && <UserPlus size={16} />}
                        {cat === 'post' && <Video size={16} />}
                        {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Task Title *</label>
                  <input 
                    type="text" 
                    required 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    placeholder="E.g., Like this specific video"
                    style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  />
                </div>

                {mainCategory !== 'post' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {mainCategory === 'subscribe' ? 'YouTube Channel URL *' : 'YouTube Video URL *'}
                    </label>
                    <input 
                      type="url" 
                      required 
                      value={postLink} 
                      onChange={e => setPostLink(e.target.value)}
                      placeholder={mainCategory === 'subscribe' ? 'https://www.youtube.com/@channel or https://www.youtube.com/channel/...' : 'https://www.youtube.com/watch?v=...'}
                      style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    />
                  </div>
                )}

                {mainCategory === 'post' && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-medium)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Video File(s) to Post *</label>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Provide the video(s) the worker should download and upload to YouTube.</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '8px' }}>
                        <button type="button" onClick={() => setVideoInputMode('upload')} style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', background: videoInputMode === 'upload' ? 'var(--bg-card)' : 'transparent', color: videoInputMode === 'upload' ? 'var(--text-primary)' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>Upload Files</button>
                        <button type="button" onClick={() => setVideoInputMode('url')} style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', background: videoInputMode === 'url' ? 'var(--bg-card)' : 'transparent', color: videoInputMode === 'url' ? 'var(--text-primary)' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>Direct URLs</button>
                      </div>
                    </div>

                    {videoInputMode === 'upload' ? (
                      <div>
                        <input 
                          type="file" 
                          ref={videoInputRef}
                          multiple
                          accept="video/*" 
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files) {
                              handleVideoFilesSelect(e.target.files);
                            }
                          }}
                        />

                        <div
                          onClick={() => videoInputRef.current?.click()}
                          style={{
                            border: '2px dashed var(--border-medium)',
                            borderRadius: '10px',
                            padding: '20px 16px',
                            textAlign: 'center',
                            background: 'var(--bg-elevated)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <UploadCloud size={22} style={{ color: 'var(--accent-blue)' }} />
                          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                            Click to browse or drag & drop video files
                          </p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                            Select multiple MP4, WEBM, MOV files (Max 50MB each)
                          </p>
                        </div>

                        {videoFiles.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                              Selected Videos ({videoFiles.length}):
                            </p>
                            {videoFiles.map(vf => (
                              <div
                                key={vf.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '8px 12px',
                                  background: 'var(--bg-elevated)',
                                  border: '1px solid var(--border-medium)',
                                  borderRadius: '8px'
                                }}
                              >
                                <Video size={18} style={{ color: '#ec4899', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {vf.name}
                                  </p>
                                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>
                                    {(vf.size / (1024 * 1024)).toFixed(2)} MB
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVideoFile(vf.id)}
                                  style={{
                                    padding: '4px 6px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                          <input 
                            type="url" 
                            placeholder="https://example.com/video.mp4" 
                            value={videoUrlInput} 
                            onChange={(e) => setVideoUrlInput(e.target.value)} 
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddVideoUrl();
                              }
                            }}
                            style={{ flex: 1, padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }}
                          />
                          <button
                            type="button"
                            onClick={handleAddVideoUrl}
                            style={{
                              padding: '10px 14px',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'var(--accent-blue)',
                              color: '#fff',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <PlusCircle size={14} /> Add
                          </button>
                        </div>

                        {existingVideoUrls.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {existingVideoUrls.map((url, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '8px 12px',
                                  background: 'var(--bg-elevated)',
                                  border: '1px solid var(--border-medium)',
                                  borderRadius: '8px'
                                }}
                              >
                                <Video size={16} style={{ color: '#ec4899', flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {url}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setExistingVideoUrls(prev => prev.filter((_, i) => i !== idx))}
                                  style={{
                                    padding: '4px 6px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Instructions for Worker *</label>
                  <textarea 
                    required 
                    value={instructions} 
                    onChange={e => setInstructions(e.target.value)}
                    placeholder="Step-by-step instructions..."
                    rows={4}
                    style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', resize: 'vertical' }}
                  />
                </div>

                {(mainCategory === 'comment' || mainCategory === 'comment_reply') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Comment Text (Optional)</label>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Provide the exact comment the user should post, or leave blank if they can write their own.</p>
                    <textarea 
                      value={body} 
                      onChange={e => setBody(e.target.value)}
                      placeholder="Enter the specific comment text..."
                      rows={3}
                      style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', resize: 'vertical' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '16px' }}>
                  {(mainCategory === 'like' || mainCategory === 'subscribe') && (
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Number of Slots *</label>
                      <input 
                        type="number" 
                        min="1"
                        required 
                        value={slots} 
                        onChange={e => setSlots(e.target.value)}
                        style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }}
                      />
                    </div>
                  )}
                  <div style={{ flex: (mainCategory === 'like' || mainCategory === 'subscribe') ? 1 : 'none', width: (mainCategory === 'like' || mainCategory === 'subscribe') ? 'auto' : '100%' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Payment per Task ($) *</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setPaymentType('base')}
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: '8px',
                          border: `1px solid ${paymentType === 'base' ? 'var(--accent-blue)' : 'var(--border-medium)'}`,
                          background: paymentType === 'base' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-elevated)',
                          color: paymentType === 'base' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                          fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        Default ($0.20)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentType('custom')}
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: '8px',
                          border: `1px solid ${paymentType === 'custom' ? 'var(--accent-blue)' : 'var(--border-medium)'}`,
                          background: paymentType === 'custom' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-elevated)',
                          color: paymentType === 'custom' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                          fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        Manual Amount
                      </button>
                    </div>
                    {paymentType === 'custom' && (
                      <input 
                        type="number" 
                        step="0.01"
                        min="0.01"
                        required 
                        value={paymentAmount} 
                        onChange={e => setPaymentAmount(e.target.value)}
                        style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }}
                      />
                    )}
                  </div>
                </div>

                {/* Schedule Task Option */}
                <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '12px', border: `1px solid ${isScheduled ? 'rgba(168, 85, 247, 0.4)' : 'var(--border-medium)'}`, transition: 'border-color 0.2s' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => {
                        setIsScheduled(e.target.checked);
                        if (!e.target.checked) setScheduledFor('');
                      }}
                      style={{ accentColor: '#a855f7', width: '18px', height: '18px' }}
                    />
                    <Calendar size={16} style={{ color: isScheduled ? '#a855f7' : 'var(--text-muted)' }} />
                    Schedule this task for later
                  </label>
                  {isScheduled && (
                    <div style={{ marginTop: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Publish Date & Time *</label>
                      <input
                        type="datetime-local"
                        required={isScheduled}
                        value={scheduledFor}
                        onChange={(e) => setScheduledFor(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px' }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-medium)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="btn-primary"
                    style={{ opacity: isSubmitting ? 0.7 : 1 }}
                  >
                    {isSubmitting ? 'Saving...' : (editingTaskId ? 'Update Task' : 'Create Task')}
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
