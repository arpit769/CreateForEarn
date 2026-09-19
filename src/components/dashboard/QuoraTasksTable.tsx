'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Pencil, Calendar, ExternalLink, Sparkles, 
  MessageSquare, ThumbsUp, Share2, UserPlus, Hash, HelpCircle,
  Link2, X, FileText, CheckCircle2, Clock
} from 'lucide-react';
import { createTask, updateTask, deleteTask } from '@/actions/tasks';
import { useSearchParams } from 'next/navigation';
import { parseCommentItems } from '@/utils/comments';

export default function QuoraTasksTable({ 
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

  const QUORA_TYPES = [
    { key: 'all', label: 'All Tasks' },
    { key: 'answer', label: 'Answers' },
    { key: 'upvote', label: 'Upvotes' },
    { key: 'follow', label: 'Follow Profile' },
    { key: 'follow_topic', label: 'Follow Topic' },
    { key: 'comment', label: 'Comments' },
    { key: 'share', label: 'Shares' },
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
  const [mainCategory, setMainCategory] = useState<'answer' | 'upvote' | 'follow' | 'follow_topic' | 'comment' | 'share'>('answer');
  const [contentOrigin, setContentOrigin] = useState<'admin' | 'ugc'>('admin');
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [postLink, setPostLink] = useState('');
  const [slots, setSlots] = useState('1');
  const [instructions, setInstructions] = useState('');

  // Payment State (Default vs Custom, reflecting previous task amount)
  const [paymentType, setPaymentType] = useState<'base' | 'custom'>('base');
  const [savedLastAmount, setSavedLastAmount] = useState('0.20');
  const [customPaymentAmount, setCustomPaymentAmount] = useState('0.20');

  // Load previous payment settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAmount = localStorage.getItem('admin_last_quora_payment_amount');
      const savedType = localStorage.getItem('admin_last_quora_payment_type');
      if (savedAmount) {
        setSavedLastAmount(savedAmount);
        setCustomPaymentAmount(savedAmount);
      }
      if (savedType === 'base' || savedType === 'custom') {
        setPaymentType(savedType);
      }
    }
  }, []);

  // Default tailored instructions based on task category and origin
  const getDefaultInstructions = (category: string, origin: 'admin' | 'ugc' = 'admin') => {
    switch (category) {
      case 'answer':
        return origin === 'admin'
          ? 'Go to the target Quora question link and post the provided answer verbatim. Ensure proper formatting and clean paragraphs. Do not alter the key message. Submit your answer URL as proof.'
          : 'Write a detailed, high-quality, and helpful answer to the question in your own words. Keep it natural, relevant, and engaging. Submit your answer URL as proof.';
      case 'upvote':
        return 'Open the target Quora answer link, upvote the answer, take a clear screenshot of your screen showing your upvote, and upload proof.';
      case 'follow':
        return 'Open the Quora profile link, click Follow, take a screenshot of your screen showing the button as "Following", and upload proof.';
      case 'follow_topic':
        return 'Open the Quora topic link, click Follow, take a screenshot showing that you are following the topic, and upload proof.';
      case 'comment':
        return origin === 'admin'
          ? 'Open the target Quora answer link and post the exact comment provided below. Submit your comment URL as proof.'
          : 'Open the target Quora answer link and write a thoughtful, natural comment related to the answer. Submit your comment URL as proof.';
      case 'share':
        return 'Open the target Quora question/answer, share it to your Quora Space or profile, take a screenshot of your share action, and upload proof.';
      default:
        return 'Follow the specified instructions and submit proof.';
    }
  };

  // Compute the standard base/default amount based on task type and previous amounts
  const getCategoryDefaultAmount = () => {
    // If we have a saved previous amount from task 1, default to it
    if (savedLastAmount && Number(savedLastAmount) > 0) {
      return savedLastAmount;
    }
    // Fallback standard defaults
    if (mainCategory === 'answer') return contentOrigin === 'admin' ? '0.20' : '0.25';
    if (mainCategory === 'comment') return contentOrigin === 'admin' ? '0.05' : '0.10';
    if (mainCategory === 'share') return '0.10';
    return '0.05';
  };

  const defaultDisplayAmount = getCategoryDefaultAmount();

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');

  const handleCategoryChange = (cat: 'answer' | 'upvote' | 'follow' | 'follow_topic' | 'comment' | 'share') => {
    setMainCategory(cat);
    setInstructions(getDefaultInstructions(cat, contentOrigin));
  };

  const handleOriginChange = (origin: 'admin' | 'ugc') => {
    setContentOrigin(origin);
    setInstructions(getDefaultInstructions(mainCategory, origin));
  };

  const handleOpenCreateModal = () => {
    setEditingTaskId(null);
    setTitle('');
    setBody('');
    setPostLink('');
    setSlots('1');
    setMainCategory('answer');
    setContentOrigin('admin');
    setInstructions(getDefaultInstructions('answer', 'admin'));
    setIsScheduled(false);
    setScheduledFor('');

    if (typeof window !== 'undefined') {
      const savedAmount = localStorage.getItem('admin_last_quora_payment_amount') || '0.20';
      const savedType = localStorage.getItem('admin_last_quora_payment_type') as 'base' | 'custom' | null;
      setSavedLastAmount(savedAmount);
      setCustomPaymentAmount(savedAmount);
      setPaymentType(savedType || 'base');
    }

    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: any) => {
    setEditingTaskId(task.id);
    setTitle(task.title || '');
    setBody(task.content_body || '');
    setPostLink(task.post_link || '');
    setSlots(String(task.max_claims || 1));
    const orig = task.title?.startsWith('User-Generated') ? 'ugc' : 'admin';
    const cat = task.task_type || 'answer';
    setMainCategory(cat);
    setContentOrigin(orig);
    setInstructions(task.instructions || getDefaultInstructions(cat, orig));
    
    const amt = String(task.payment_amount || '0.20');
    setCustomPaymentAmount(amt);
    setPaymentType('custom');

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
      const finalAmount = paymentType === 'base' ? defaultDisplayAmount : customPaymentAmount;

      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_last_quora_payment_amount', finalAmount);
        localStorage.setItem('admin_last_quora_payment_type', paymentType);
        setSavedLastAmount(finalAmount);
      }

      let finalTitle = title.trim();
      if (!finalTitle) {
        if (mainCategory === 'answer') {
          finalTitle = contentOrigin === 'ugc' ? 'User-Generated Quora Answer Task' : 'Quora Answer Task';
        } else if (mainCategory === 'comment') {
          finalTitle = contentOrigin === 'ugc' ? 'User-Generated Quora Comment Task' : 'Quora Comment Task';
        } else if (mainCategory === 'upvote') {
          finalTitle = 'Quora Upvote Task';
        } else if (mainCategory === 'follow') {
          finalTitle = 'Quora Profile Follow Task';
        } else if (mainCategory === 'follow_topic') {
          finalTitle = 'Quora Topic Follow Task';
        } else if (mainCategory === 'share') {
          finalTitle = 'Quora Share Task';
        } else {
          finalTitle = 'Quora Task';
        }
      }

      const showSlotsInput = (mainCategory !== 'answer' && mainCategory !== 'comment') || contentOrigin === 'ugc';
      let finalSlots = slots;
      if (!showSlotsInput) {
        if (mainCategory === 'comment' && body.includes('||')) {
          finalSlots = String(parseCommentItems(body).length || 1);
        } else {
          finalSlots = '1';
        }
      }

      const formData = new FormData();
      formData.append('title', finalTitle);
      formData.append('instructions', instructions.trim() || 'Follow the specified instructions and submit proof.');
      formData.append('task_type', mainCategory);
      formData.append('platform', 'quora');
      formData.append('payment_amount', finalAmount);
      formData.append('max_claims', finalSlots);
      formData.append('content_mode', 'text');
      formData.append('task_category', 'standard');

      if (postLink.trim()) {
        formData.append('post_link', postLink.trim());
      }
      if (body.trim()) {
        formData.append('content_body', body.trim());
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

  const getCategoryCount = (typeKey: string) => {
    if (typeKey === 'all') return displayedTasks.length;
    return displayedTasks.filter(t => t.task_type === typeKey).length;
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
              width: '32px', height: '32px', borderRadius: '8px', 
              background: '#b92b27', color: '#fff', fontSize: '18px', fontWeight: 900 
            }}>
              Q
            </span>
            Quora Tasks
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Create and manage all 6 categories of Quora tasks (Answer, Upvote, Follow, Topic, Comment, Share) for workers.</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          style={{
            padding: '10px 20px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #b92b27, #aa221e)',
            color: '#ffffff', border: 'none', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 12px rgba(185, 43, 39, 0.3)'
          }}
        >
          <Plus size={18} /> Create Quora Task
        </button>
      </div>

      {/* 4-Card Aggregate Stats Row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Approved Tasks</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{totalApprovedTasks}</p>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <CheckCircle2 size={20} />
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              background: activeTab === 'active' ? '#b92b27' : 'transparent',
              color: activeTab === 'active' ? '#fff' : 'var(--text-secondary)',
              border: 'none', cursor: 'pointer', transition: 'all 0.15s ease'
            }}
          >
            Active Tasks
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              background: activeTab === 'completed' ? '#b92b27' : 'transparent',
              color: activeTab === 'completed' ? '#fff' : 'var(--text-secondary)',
              border: 'none', cursor: 'pointer', transition: 'all 0.15s ease'
            }}
          >
            Completed / Claimed
          </button>
        </div>

        {/* Search Input Bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '380px', flex: '1 1 260px' }}>
          <input
            type="text"
            placeholder="Search Quora tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', padding: '10px 16px', 
              background: 'var(--bg-card)', border: '1px solid var(--border-medium)', 
              borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' 
            }}
          />
        </div>
      </div>

      {/* Task Type Filters */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px', alignItems: 'center' }}>
        {QUORA_TYPES.map(t => {
          const count = getCategoryCount(t.key);
          const isSelected = selectedType === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setSelectedType(t.key)}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                whiteSpace: 'nowrap', cursor: 'pointer',
                background: isSelected ? 'rgba(185, 43, 39, 0.15)' : 'var(--bg-card)',
                color: isSelected ? '#ef4444' : 'var(--text-secondary)',
                border: isSelected ? '1px solid rgba(185, 43, 39, 0.3)' : '1px solid var(--border-subtle)',
                transition: 'all 0.15s ease',
                display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}
            >
              <span>{t.label}</span>
              <span style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: isSelected ? 'rgba(185, 43, 39, 0.25)' : 'rgba(255,255,255,0.06)',
                color: isSelected ? '#fca5a5' : 'var(--text-muted)'
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
            {visibleTasks.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No Quora tasks found in this section.
                </td>
              </tr>
            ) : (
              visibleTasks.map(t => {
                const slotsRemaining = Math.max(0, (t.max_claims || 1) - (t.active_claims_count || 0));
                const isCompleted = t.status === 'completed' || t.status === 'claimed' || slotsRemaining === 0;
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
                          style={{ color: 'var(--accent-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600, fontSize: '13px' }}
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
                        background: isCompleted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.06)',
                        color: isCompleted ? '#ef4444' : 'var(--text-primary)',
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
                        background: 'rgba(185, 43, 39, 0.12)',
                        color: '#b92b27'
                      }}>
                        {t.task_type?.replace('_', ' ')}
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
        {visibleTasks.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
            No Quora tasks found in this section.
          </div>
        ) : (
          visibleTasks.map(t => (
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
                      style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Target Link ↗
                    </a>
                  ) : (
                    <span>Quora</span>
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
                    color: '#b92b27'
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

              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
                  width: '28px', height: '28px', borderRadius: '6px', 
                  background: '#b92b27', color: '#fff', fontSize: '15px', fontWeight: 900 
                }}>
                  Q
                </span>
                {editingTaskId ? 'Edit Quora Task' : 'Create New Quora Task'}
              </h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Main Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Quora Task Category *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    {[
                      { id: 'answer', label: 'Answer', icon: <HelpCircle size={14} /> },
                      { id: 'upvote', label: 'Upvote', icon: <ThumbsUp size={14} /> },
                      { id: 'follow', label: 'Follow Profile', icon: <UserPlus size={14} /> },
                      { id: 'follow_topic', label: 'Follow Topic', icon: <Hash size={14} /> },
                      { id: 'comment', label: 'Comment', icon: <MessageSquare size={14} /> },
                      { id: 'share', label: 'Share', icon: <Share2 size={14} /> },
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryChange(cat.id as any)}
                        style={{
                          padding: '10px', borderRadius: '10px',
                          border: mainCategory === cat.id ? '2px solid #b92b27' : '1px solid var(--border-subtle)',
                          background: mainCategory === cat.id ? 'rgba(185, 43, 39, 0.12)' : 'var(--bg-card)',
                          color: mainCategory === cat.id ? '#ef4444' : 'var(--text-primary)', fontSize: '13px', fontWeight: 600,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Origin for Answer and Comment */}
                {(mainCategory === 'answer' || mainCategory === 'comment') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      Content Source *
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => handleOriginChange('admin')}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '8px',
                          border: contentOrigin === 'admin' ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                          background: contentOrigin === 'admin' ? 'rgba(59,130,246,0.1)' : 'var(--bg-card)',
                          color: contentOrigin === 'admin' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                          fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        {mainCategory === 'answer' ? 'Admin Provided Content' : 'Admin Provided Comment'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOriginChange('ugc')}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '8px',
                          border: contentOrigin === 'ugc' ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                          background: contentOrigin === 'ugc' ? 'rgba(59,130,246,0.1)' : 'var(--bg-card)',
                          color: contentOrigin === 'ugc' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                          fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        {mainCategory === 'answer' ? 'User Generated Content (UGC)' : 'User Generated Comment'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Question / Target URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    {mainCategory === 'answer' ? 'Quora Question URL *' : 
                     mainCategory === 'follow' ? 'Quora Profile URL to Follow *' :
                     mainCategory === 'follow_topic' ? 'Quora Topic URL to Follow *' :
                     mainCategory === 'comment' ? 'Target Quora Answer URL *' :
                     mainCategory === 'share' ? 'Target Quora Answer/Question URL *' :
                     'Target Quora Answer URL *'}
                  </label>
                  <input
                    type="url"
                    required
                    placeholder={
                      mainCategory === 'follow' ? 'https://www.quora.com/profile/Username' :
                      mainCategory === 'follow_topic' ? 'https://www.quora.com/topic/Topic-Name' :
                      mainCategory === 'answer' ? 'https://www.quora.com/What-is-your-question' :
                      'https://www.quora.com/Question-Title/answer/Author-Name'
                    }
                    value={postLink}
                    onChange={e => setPostLink(e.target.value)}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '8px',
                      background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
                    }}
                  />
                </div>

                {/* Task Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Task Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. ${mainCategory === 'answer' ? 'Answer question on Quora' : `Perform ${mainCategory.replace('_', ' ')} on Quora`}`}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '8px',
                      background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
                    }}
                  />
                </div>

                {/* Admin Provided Answer / Comment Content */}
                {((mainCategory === 'answer' || mainCategory === 'comment') && contentOrigin === 'admin') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {mainCategory === 'answer' ? 'Answer Content (Text to be posted) *' : 'Comment Content (Separate with || for multiple variations) *'}
                    </label>
                    <textarea
                      rows={5}
                      required
                      placeholder={mainCategory === 'answer' ? 'Type the exact answer workers should post...' : 'Type comment 1 || Type comment 2'}
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

                {/* Instructions / Guidelines */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {mainCategory === 'answer' && contentOrigin === 'ugc' ? 'Answer Guidelines & Instructions *' :
                       mainCategory === 'comment' && contentOrigin === 'ugc' ? 'Comment Guidelines & Instructions *' :
                       mainCategory === 'share' ? 'Share Instructions *' :
                       'Special Instructions for Worker *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setInstructions(getDefaultInstructions(mainCategory, contentOrigin))}
                      style={{
                        background: 'none', border: 'none', color: 'var(--accent-blue)',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <Sparkles size={12} /> Reset to task template
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder={getDefaultInstructions(mainCategory, contentOrigin)}
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '8px',
                      background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)', fontSize: '14px', outline: 'none', lineHeight: 1.5
                    }}
                  />
                </div>

                {/* Slots and Payment Section */}
                {(() => {
                  const showSlotsInput = (mainCategory !== 'answer' && mainCategory !== 'comment') || contentOrigin === 'ugc';
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: showSlotsInput ? '1fr 1fr' : '1fr', gap: '16px' }}>
                      {showSlotsInput && (
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                            Number of Slots (Claims) *
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
                      )}

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                          Payment per Claim ($ USD) *
                        </label>

                        {/* Default vs Custom Toggle */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentType('base');
                              if (typeof window !== 'undefined') localStorage.setItem('admin_last_quora_payment_type', 'base');
                            }}
                            style={{
                              flex: 1, padding: '8px', borderRadius: '8px',
                              border: `1px solid ${paymentType === 'base' ? 'var(--accent-blue)' : 'var(--border-medium)'}`,
                              background: paymentType === 'base' ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card)',
                              color: paymentType === 'base' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                              fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            Default (${Number(defaultDisplayAmount).toFixed(2)})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentType('custom');
                              if (typeof window !== 'undefined') {
                                localStorage.setItem('admin_last_quora_payment_type', 'custom');
                                localStorage.setItem('admin_last_quora_payment_amount', customPaymentAmount);
                              }
                            }}
                            style={{
                              flex: 1, padding: '8px', borderRadius: '8px',
                              border: `1px solid ${paymentType === 'custom' ? 'var(--accent-blue)' : 'var(--border-medium)'}`,
                              background: paymentType === 'custom' ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card)',
                              color: paymentType === 'custom' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                              fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            Custom Amount
                          </button>
                        </div>

                        {paymentType === 'custom' && (
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={customPaymentAmount}
                            onChange={e => {
                              setCustomPaymentAmount(e.target.value);
                              if (typeof window !== 'undefined') {
                                localStorage.setItem('admin_last_quora_payment_amount', e.target.value);
                                localStorage.setItem('admin_last_quora_payment_type', 'custom');
                              }
                            }}
                            style={{
                              width: '100%', padding: '10px 12px', borderRadius: '8px',
                              background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                              color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })()}

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

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px',
                      background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                      color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      flex: 2, padding: '12px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #b92b27, #aa221e)',
                      color: '#ffffff', border: 'none', fontSize: '14px', fontWeight: 600,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(185, 43, 39, 0.3)'
                    }}
                  >
                    {isSubmitting ? 'Saving...' : (editingTaskId ? 'Update Task' : 'Publish Task')}
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
