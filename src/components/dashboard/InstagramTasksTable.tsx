'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Pencil, Calendar, ExternalLink, Sparkles, 
  MessageSquare, Heart, Bookmark, UserPlus, Eye, Film,
  Link2, X, FileText, CheckCircle2, Clock, Check
} from 'lucide-react';
import { createTask, updateTask, deleteTask } from '@/actions/tasks';
import { useSearchParams } from 'next/navigation';
import { InstagramIcon, getDefaultInstagramInstructions, getDefaultInstagramPayment } from '@/utils/instagram';

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
    setViewDuration(task.image_url || ''); // Reused image_url for duration if any
    setIsScheduled(!!task.scheduled_for);
    setScheduledFor(task.scheduled_for ? new Date(task.scheduled_for).toISOString().slice(0, 16) : '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('task_type', taskType);
    formData.append('task_category', 'standard');
    formData.append('content_mode', contentMode);
    formData.append('platform', 'instagram');
    formData.append('payment_amount', paymentAmount);
    formData.append('max_claims', maxClaims);
    formData.append('post_link', postLink);
    formData.append('instructions', instructions);
    formData.append('content_body', contentBody);
    formData.append('flair', taskType === 'post' ? postSubtype : '');
    formData.append('image_url', viewDuration);

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
      alert(res.error);
    } else {
      setIsModalOpen(false);
      window.location.reload();
    }
    setIsSubmitting(false);
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

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div style={{ background: 'var(--bg-elevated)', borderRadius: '16px', padding: '64px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>No Instagram tasks found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredTasks.map(task => {
            const isCompleted = task.status === 'completed' || (task.active_claims_count || 0) >= (task.max_claims || 1);
            return (
              <div 
                key={task.id} 
                style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '16px', 
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '4px 10px', borderRadius: '20px',
                      background: 'rgba(225, 48, 108, 0.1)', color: '#e1306c',
                      fontSize: '11px', fontWeight: 700, textTransform: 'uppercase'
                    }}>
                      <InstagramIcon size={12} color="#e1306c" /> {task.task_type?.replace('_', ' ')}
                    </span>

                    <span style={{
                      padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                      background: isCompleted ? 'rgba(107, 114, 128, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: isCompleted ? '#6b7280' : '#10b981'
                    }}>
                      ${Number(task.payment_amount).toFixed(2)}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: '1.3' }}>
                    {task.title}
                  </h3>

                  {task.instructions && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {task.instructions}
                    </p>
                  )}

                  {task.post_link && (
                    <div style={{ marginBottom: '12px' }}>
                      <a 
                        href={task.post_link} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ fontSize: '12px', color: '#e1306c', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', wordBreak: 'break-all' }}
                      >
                        Target URL <ExternalLink size={11} />
                      </a>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    <span>Slots: {task.active_claims_count || 0}/{task.max_claims || 1}</span>
                    <span>•</span>
                    <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => handleOpenEditModal(task)}
                    style={{
                      padding: '6px 12px', borderRadius: '8px',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    disabled={deletingId === task.id}
                    style={{
                      padding: '6px 12px', borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444', fontSize: '12px', fontWeight: 600,
                      cursor: deletingId === task.id ? 'not-allowed' : 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                </div>

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
