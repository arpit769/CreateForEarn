'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { claimTask } from '@/actions/tasks';
import { PlusCircle, Search, Clock, DollarSign, Image as ImageIcon, MessageSquare, AlertCircle, Link as LinkIcon, X, Eye, Download, Copy, Check, Type, ExternalLink, ArrowBigUp, Share2, Film, Video, Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { parseMediaItems, downloadMediaAsset } from '@/utils/media';
import { parseCommentItems, isMultiCommentTask } from '@/utils/comments';

function CooldownBanner({ nextAvailableAt, title, description, accentColor = '#ef4444' }: { nextAvailableAt: string, title: string, description: string, accentColor?: string }) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(nextAvailableAt).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('');
        window.location.reload();
      } else {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((diff % (60 * 1000)) / 1000);
        setTimeLeft(hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [nextAvailableAt]);

  if (!timeLeft) return null;

  return (
    <div style={{
      background: `${accentColor}11`,
      border: `1px solid ${accentColor}33`,
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      color: accentColor
    }}>
      <Clock size={20} style={{ flexShrink: 0 }} />
      <div>
        <p style={{ fontWeight: 700, margin: 0, fontSize: '14px' }}>{title}</p>
        <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {description} <strong style={{ color: accentColor }}>{timeLeft}</strong>
        </p>
      </div>
    </div>
  );
}

export default function WorkerAvailableTasks({ 
  initialTasks, 
  postNextAvailableAt, 
  commentNextAvailableAt,
  crosspostNextAvailableAt,
  upvoteNextAvailableAt,
  isKarmaFarm = false
}: { 
  initialTasks: any[], 
  postNextAvailableAt?: string | null, 
  commentNextAvailableAt?: string | null,
  crosspostNextAvailableAt?: string | null,
  upvoteNextAvailableAt?: string | null,
  isKarmaFarm?: boolean
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'admin' | 'user'>('admin');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearch(query);
    }
  }, [searchParams]);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadImage = async (imageUrl: string, filename = 'reddit-task-asset.png') => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      window.open(imageUrl, '_blank');
    }
  };

  const isTaskOnCooldown = (task: any) => {
    if (task.task_type === 'post' && postNextAvailableAt) return true;
    if (task.task_type === 'comment' && commentNextAvailableAt) return true;
    if (task.task_type === 'crosspost' && crosspostNextAvailableAt) return true;
    if (task.task_type === 'upvote' && upvoteNextAvailableAt) return true;
    return false;
  };

  const getCooldownLabel = (task: any) => {
    if (task.task_type === 'post' && postNextAvailableAt) return 'Post Cooldown';
    if (task.task_type === 'comment' && commentNextAvailableAt) return 'Comment Cooldown';
    if (task.task_type === 'crosspost' && crosspostNextAvailableAt) return 'Crosspost Cooldown';
    if (task.task_type === 'upvote' && upvoteNextAvailableAt) return 'Upvote Cooldown';
    return 'On Cooldown';
  };

  const handleClaim = async (taskId: string) => {
    const taskToClaim = tasks.find(t => t.id === taskId);
    if (taskToClaim && isTaskOnCooldown(taskToClaim)) {
      alert(`Cannot claim task: ${getCooldownLabel(taskToClaim)} is currently active. Please wait for the cooldown timer to finish.`);
      return;
    }

    if (!confirm('Are you sure you want to claim this task? You will have 1 hour to complete it.')) return;
    setClaimingId(taskId);
    
    const res = await claimTask(taskId);
    if (res.error) {
      alert("Failed to claim task: " + res.error);
      setClaimingId(null);
    } else {
      setTasks(tasks.filter(t => t.id !== taskId));
      setClaimingId(null);
      setSelectedTask(null);
      alert("Task claimed successfully!");
      if (isKarmaFarm) {
        window.location.reload();
      } else {
        router.push('/worker/my-tasks');
      }
    }
  };

  const getInstructions = (t: any) => {
    if (t.task_type === 'post' && (!t.content_body && !t.image_url && !t.post_link)) {
      return 'User will use their own content';
    }
    return t.instructions || 'No special instructions.';
  };

  const [selectedType, setSelectedType] = useState<string>('all');

  const REDDIT_TYPES = [
    { key: 'all', label: 'All Tasks' },
    { key: 'post', label: 'Posts' },
    { key: 'comment', label: 'Comments' },
    { key: 'upvote', label: 'Upvotes' },
    { key: 'crosspost', label: 'Crossposts' },
  ];

  const isRedditTypeMatch = (t: any, type: string) => {
    if (!type || type === 'all') return true;
    const rawType = (t.task_type || '').toLowerCase().trim();
    const rawCat = (t.task_category || '').toLowerCase().trim();

    if (type === 'comment') {
      return (
        rawType === 'comment' ||
        rawType === 'comment_reply' ||
        rawType === 'comments' ||
        rawCat === 'comment' ||
        isMultiCommentTask(t)
      );
    }
    if (type === 'post') {
      return (
        rawType === 'post' ||
        rawType === 'text' ||
        rawType === 'image' ||
        rawType === 'video' ||
        (!rawType && rawCat !== 'karma_farm')
      );
    }
    if (type === 'upvote') {
      return rawType === 'upvote' || rawType === 'upvotes';
    }
    if (type === 'crosspost') {
      return rawType === 'crosspost' || rawType === 'crossposts';
    }
    return rawType === type.toLowerCase();
  };

  const filteredTasks = tasks.filter(t => {
    const isUserGenerated = t.title?.startsWith('User-Generated');
    const matchesTab = activeTab === 'user' ? isUserGenerated : !isUserGenerated;
    if (!matchesTab) return false;

    if (!isRedditTypeMatch(t, selectedType)) return false;

    return t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.instructions?.toLowerCase().includes(search.toLowerCase()) ||
      t.subreddits?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (t.task_seq_id && `task id: ${t.task_seq_id}`.toLowerCase().includes(search.toLowerCase())) ||
      (t.task_seq_id && String(t.task_seq_id).includes(search.toLowerCase()));
  });

  // Infinite Scroll State (Loads 30 tasks initially, smoothly loads 30 more as you scroll)
  const [visibleCount, setVisibleCount] = useState(30);

  useEffect(() => {
    setVisibleCount(30);
  }, [activeTab, search, selectedType]);

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

  const getCategoryCount = (typeKey: string) => {
    const tabFiltered = tasks.filter(t => {
      const isKarmaFarmTask = t.task_category === 'karma_farm';
      if (isKarmaFarm) return isKarmaFarmTask;
      if (isKarmaFarmTask) return false;
      const isUgc = t.title?.toLowerCase().startsWith('user-generated') || t.title?.toLowerCase().startsWith('ugc') || t.task_category === 'ugc';
      return activeTab === 'user' ? isUgc : !isUgc;
    });
    if (typeKey === 'all') return tabFiltered.length;
    return tabFiltered.filter(t => isRedditTypeMatch(t, typeKey)).length;
  };

  return (
    <div className="dashboard-content-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#ff4500', color: '#fff'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
              </svg>
            </span>
            {isKarmaFarm ? 'Karma Farm' : 'Reddit Tasks'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            {isKarmaFarm ? 'Grow your karma by completing these unpaid tasks. (These tasks do not pay out)' : 'Browse and claim tasks matching your verified subreddits.'}
          </p>
        </div>
      </div>

       {postNextAvailableAt && (
        <CooldownBanner 
          nextAvailableAt={postNextAvailableAt}
          title="Post Task Limit (1 per 20 Hours)"
          description="You recently submitted/completed a post task. Next post task available in:"
          accentColor="#ef4444"
        />
      )}
      {crosspostNextAvailableAt && (
        <CooldownBanner 
          nextAvailableAt={crosspostNextAvailableAt}
          title="Crosspost Task Limit (1 per 24 Hours)"
          description="You've completed your 1 crosspost task for today. Next crosspost task available in:"
          accentColor="#a855f7"
        />
      )}
      {upvoteNextAvailableAt && (
        <CooldownBanner 
          nextAvailableAt={upvoteNextAvailableAt}
          title="Upvote Task Limit (5 per Hour)"
          description="You've completed 5 upvote tasks in the last hour. Next upvote task available in:"
          accentColor="#f97316"
        />
      )}
      {commentNextAvailableAt && (
        <CooldownBanner 
          nextAvailableAt={commentNextAvailableAt}
          title="Comment Task Limit (2 per Hour)"
          description="You've completed 2 comment tasks in the last hour. Next comment task available in:"
          accentColor="#f59e0b"
        />
      )}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '12px', padding: '4px' }}>
            <button
              onClick={() => setActiveTab('admin')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeTab === 'admin' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                background: activeTab === 'admin' ? 'var(--bg-primary)' : 'transparent',
                color: activeTab === 'admin' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'admin' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Admin Given
            </button>
            <button
              onClick={() => setActiveTab('user')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeTab === 'user' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                background: activeTab === 'user' ? 'var(--bg-primary)' : 'transparent',
                color: activeTab === 'user' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'user' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              User Generated
            </button>
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search tasks or subreddits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ 
                width: '100%', padding: '12px 14px 12px 40px', 
                background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', 
                borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' 
              }}
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', alignItems: 'center' }}>
          {REDDIT_TYPES.map(cat => {
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
                  border: isActive ? '1px solid rgba(255, 69, 0, 0.4)' : '1px solid var(--border-subtle)',
                  background: isActive ? 'rgba(255, 69, 0, 0.15)' : 'var(--bg-elevated)',
                  color: isActive ? '#ff4500' : 'var(--text-secondary)',
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
                  background: isActive ? 'rgba(255, 69, 0, 0.25)' : 'rgba(255,255,255,0.06)',
                  color: isActive ? '#ff8a65' : 'var(--text-muted)'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '64px 24px',
          textAlign: 'center'
        }}>
          <AlertCircle size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No Tasks Available</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', fontSize: '14px' }}>
            There are currently no tasks available matching your active reddit account or subreddit permissions. Check back soon!
          </p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{ 
          background: 'var(--bg-elevated)', borderRadius: '16px', padding: '64px', 
          textAlign: 'center', border: '1px solid var(--border-subtle)' 
        }}>
          <p style={{ color: 'var(--text-secondary)' }}>No tasks match your search criteria.</p>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
          {visibleTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
                    {task.post_link || task.subreddits?.name ? (
                      <a 
                        href={task.post_link || `https://www.reddit.com/r/${task.subreddits.name}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                          background: task.subreddits?.name ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: task.subreddits?.name ? 'var(--accent-blue)' : '#10b981',
                          border: `1px solid ${task.subreddits?.name ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px'
                        }}
                      >
                        {task.subreddits?.name ? `r/${task.subreddits.name}` : 'Reddit Link'}
                        <ExternalLink size={10} />
                      </a>
                    ) : null}


                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 700, fontSize: '16px' }}>
                    <DollarSign size={16} />
                    {task.payment_amount.toFixed(2)}
                  </div>
                </div>

                <div style={{ margin: '14px 0 8px 0' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: '1.4' }}>
                    {task.task_seq_id && !task.title?.startsWith('User-Generated') ? `Task ID: ${task.task_seq_id} - ` : ''}{task.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {task.flair && (
                      <span style={{ 
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                        background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-secondary)'
                      }}>
                        {task.flair}
                      </span>
                    )}
                    {task.task_type === 'comment' ? (
                      <span style={{ 
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                        background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        <MessageSquare size={12} /> Comment
                      </span>
                    ) : task.task_type === 'upvote' ? (
                      <span style={{ 
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                        background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        <ArrowBigUp size={12} /> Upvote
                      </span>
                    ) : task.task_type === 'crosspost' ? (
                      <span style={{ 
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                        background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        <Share2 size={12} /> Crosspost
                      </span>
                    ) : (task.content_mode === 'video' || (parseMediaItems(task.image_url, task.content_mode).length > 0 && parseMediaItems(task.image_url, task.content_mode)[0].type === 'video')) ? (
                      <span style={{ 
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                        background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        <Film size={12} /> Video Post
                      </span>
                    ) : (task.content_mode === 'image' || Boolean(task.image_url)) ? (
                      <span style={{ 
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                        background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        <ImageIcon size={12} /> Image Post
                      </span>
                    ) : (
                      <span style={{ 
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                        background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        <Type size={12} /> Text Post
                      </span>
                    )}

                    {/* Bonus Badge */}
                    {task.task_category !== 'karma_farm' && (
                      <span style={{ 
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                        background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', display: 'inline-flex', alignItems: 'center', gap: '3px'
                      }}>
                        <Sparkles size={11} /> +Bonus Eligible
                      </span>
                    )}
                  </div>
                </div>

                <p style={{ 
                  color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5',
                  overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '16px'
                }}>
                  {getInstructions(task)}
                </p>

              </div>

              {/* Card Footer */}
              <div style={{ 
                padding: '12px 24px', 
                borderTop: '1px solid var(--border-subtle)', 
                background: 'rgba(0,0,0,0.1)',
                display: 'flex', gap: '10px'
              }}>
                <button
                  onClick={() => setSelectedTask(task)}
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: '8px',
                    background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                    border: '1px solid var(--border-medium)', fontSize: '13px', fontWeight: 500,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    transition: 'background 0.2s'
                  }}
                >
                  <Eye size={14} />
                  View Details
                </button>
                {isTaskOnCooldown(task) ? (
                  <button
                    disabled
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: '12px', fontWeight: 600,
                      cursor: 'not-allowed', opacity: 0.85,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >
                    <Clock size={14} />
                    {getCooldownLabel(task)} Active
                  </button>
                ) : (
                  <button
                    onClick={() => handleClaim(task.id)}
                    disabled={claimingId === task.id}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: '8px',
                      background: 'var(--accent-blue)', color: '#fff',
                      border: 'none', fontSize: '13px', fontWeight: 600,
                      cursor: claimingId === task.id ? 'not-allowed' : 'pointer',
                      opacity: claimingId === task.id ? 0.7 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      transition: 'opacity 0.2s'
                    }}
                  >
                    <PlusCircle size={14} />
                    {claimingId === task.id ? 'Claiming...' : 'Claim Task'}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

          {/* Infinite Scroll Sentinel / Loading Indicator */}
          {visibleCount < filteredTasks.length && (
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
              <span>Showing {visibleTasks.length} of {filteredTasks.length} tasks (scroll for more)</span>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {selectedTask && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '20px',
                width: '100%', maxWidth: '650px',
                maxHeight: '90vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                overflow: 'hidden'
              }}
            >
              <div style={{
                padding: '24px 32px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {/* Subreddit / Target Link */}
                    {selectedTask.post_link || selectedTask.subreddits?.name ? (
                      <a 
                        href={selectedTask.post_link || `https://www.reddit.com/r/${selectedTask.subreddits.name}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                          background: selectedTask.subreddits?.name ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: selectedTask.subreddits?.name ? 'var(--accent-blue)' : '#10b981',
                          border: `1px solid ${selectedTask.subreddits?.name ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                        <LinkIcon size={12} />
                        {selectedTask.subreddits?.name ? `r/${selectedTask.subreddits.name}` : 'Open Reddit Link'}
                        <ExternalLink size={11} />
                      </a>
                    ) : null}
                    {selectedTask.flair && (
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                        background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        🏷️ Flair: {selectedTask.flair}
                      </span>
                    )}
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                      background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      👥 {selectedTask.slots_remaining !== undefined ? `${selectedTask.slots_remaining} / ${selectedTask.max_claims || 1} slots open` : `${selectedTask.max_claims || 1} slots`}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedTask.task_seq_id && selectedTask.task_category !== 'karma_farm' && !selectedTask.title?.startsWith('User-Generated') ? `Task ID: ${selectedTask.task_seq_id} - ` : ''}{selectedTask.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', padding: '4px', borderRadius: '6px'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '24px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                    background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-subtle)'
                  }}>
                    {selectedTask.task_type === 'comment' ? (
                      <>
                        <MessageSquare size={14} style={{ color: '#3b82f6' }} /> COMMENT
                      </>
                    ) : selectedTask.task_type === 'upvote' ? (
                      <>
                        <ArrowBigUp size={14} style={{ color: '#f97316' }} /> UPVOTE
                      </>
                    ) : selectedTask.task_type === 'crosspost' ? (
                      <>
                        <Share2 size={14} style={{ color: '#a855f7' }} /> CROSSPOST
                      </>
                    ) : (selectedTask.content_mode === 'video' || (parseMediaItems(selectedTask.image_url, selectedTask.content_mode).length > 0 && parseMediaItems(selectedTask.image_url, selectedTask.content_mode)[0].type === 'video')) ? (
                      <>
                        <Film size={14} style={{ color: '#ec4899' }} /> {parseMediaItems(selectedTask.image_url, selectedTask.content_mode).length > 1 ? `${parseMediaItems(selectedTask.image_url, selectedTask.content_mode).length} VIDEOS` : 'VIDEO POST'}
                      </>
                    ) : (selectedTask.content_mode === 'image' || Boolean(selectedTask.image_url)) ? (
                      <>
                        <ImageIcon size={14} style={{ color: '#10b981' }} /> {parseMediaItems(selectedTask.image_url, selectedTask.content_mode).length > 1 ? `${parseMediaItems(selectedTask.image_url, selectedTask.content_mode).length} IMAGES` : 'IMAGE POST'}
                      </>
                    ) : (
                      <>
                        <Type size={14} style={{ color: '#8b5cf6' }} /> TEXT POST
                      </>
                    )}
                  </span>
                  <span style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                    background: selectedTask.title?.startsWith('User-Generated') ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)', 
                    color: selectedTask.title?.startsWith('User-Generated') ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {selectedTask.title?.startsWith('User-Generated') ? 'User Generated' : 'Admin Given'}
                  </span>
                  <span style={{ fontWeight: 700, color: '#10b981', fontSize: '18px', marginLeft: 'auto' }}>
                    ${selectedTask.payment_amount.toFixed(2)}
                  </span>
                </div>

                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <Clock size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                    <p style={{ fontWeight: 700, color: '#f59e0b', marginBottom: '2px' }}>1-Hour Completion Window</p>
                    Once you claim this, you have 1 hour to submit the task.
                  </div>
                </div>

                <div style={{ 
                  background: 'var(--bg-default)', padding: '20px', borderRadius: '14px', 
                  fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <p style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instructions</p>
                  {getInstructions(selectedTask)}

                </div>

                {(selectedTask.title || selectedTask.flair || selectedTask.content_body || selectedTask.image_url || selectedTask.post_link || selectedTask.subreddits?.name) && (
                  <div style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.02)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required Content Details</h4>
                    
                    {/* Target Subreddit / Post Link - AT TOP */}
                    {(selectedTask.post_link || selectedTask.subreddits?.name) && (
                      <div style={{ marginBottom: selectedTask.task_type === 'crosspost' ? '12px' : '18px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            🔗 {
                              selectedTask.task_type === 'upvote' ? 'Target Reddit Post Link:' :
                              selectedTask.task_type === 'crosspost' ? 'Original Reddit Post Link:' :
                              selectedTask.task_type === 'comment' ? 'Target Reddit Post Link:' :
                              'Target Subreddit Link:'
                            }
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedTask.post_link || `https://www.reddit.com/r/${selectedTask.subreddits?.name}`, 'modal_link')}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: copiedField === 'modal_link' ? '#10b981' : 'var(--accent-blue)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            {copiedField === 'modal_link' ? <Check size={13} /> : <Copy size={13} />}
                            {copiedField === 'modal_link' ? 'Copied' : 'Copy Link'}
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: 'var(--bg-default)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', wordBreak: 'break-all' }}>
                            {(selectedTask.post_link || `https://www.reddit.com/r/${selectedTask.subreddits?.name}`).replace(/^https?:\/\/(www\.)?reddit\.com\/r\//i, 'r/').replace(/^https?:\/\/(www\.)?reddit\.com\//i, '')}
                          </span>
                          <a
                            href={selectedTask.post_link || `https://www.reddit.com/r/${selectedTask.subreddits?.name}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              background: 'var(--accent-blue)', color: '#fff', padding: '6px 12px',
                              borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                              textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0
                            }}
                          >
                            Open Link <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Crosspost Destination Subreddit Link */}
                    {selectedTask.task_type === 'crosspost' && (() => {
                      const destUrl = selectedTask.content_body || (selectedTask.subreddits?.name ? `https://www.reddit.com/r/${selectedTask.subreddits.name}` : 'https://www.reddit.com');
                      return (
                        <div style={{ marginBottom: '18px', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '10px', padding: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              🎯 Crosspost Subreddit Link (Where to Crosspost):
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(destUrl, 'modal_crosspost_sub_link')}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: copiedField === 'modal_crosspost_sub_link' ? '#10b981' : '#a855f7', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                            >
                              {copiedField === 'modal_crosspost_sub_link' ? <Check size={13} /> : <Copy size={13} />}
                              {copiedField === 'modal_crosspost_sub_link' ? 'Copied' : 'Copy Link'}
                            </button>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: 'var(--bg-default)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {destUrl.replace(/^https?:\/\/(www\.)?reddit\.com\/r\//i, 'r/').replace(/^https?:\/\/(www\.)?reddit\.com\//i, '')}
                            </span>
                            <a
                              href={destUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                background: '#a855f7', color: '#fff', padding: '6px 12px',
                                borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0
                              }}
                            >
                              Open Subreddit <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Post Title to Use (Only for 'post' tasks) */}
                    {selectedTask.task_type === 'post' && selectedTask.title && !selectedTask.title.startsWith('User-Generated') && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>📌 Post Title:</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedTask.title, 'modal_title')}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: copiedField === 'modal_title' ? '#10b981' : 'var(--accent-blue)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            {copiedField === 'modal_title' ? <Check size={13} /> : <Copy size={13} />}
                            {copiedField === 'modal_title' ? 'Copied' : 'Copy Title'}
                          </button>
                        </div>
                        <div style={{ background: 'var(--bg-default)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                          {selectedTask.title}
                        </div>
                      </div>
                    )}

                    {selectedTask.flair && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>🏷️ Post Flair:</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedTask.flair, 'modal_flair')}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: copiedField === 'modal_flair' ? '#10b981' : 'var(--accent-blue)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            {copiedField === 'modal_flair' ? <Check size={13} /> : <Copy size={13} />}
                            {copiedField === 'modal_flair' ? 'Copied' : 'Copy Flair'}
                          </button>
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.06)', padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' }}>
                          {selectedTask.flair}
                        </div>
                      </div>
                    )}
                    
                    {/* Text Content to Use (Only for non-crosspost tasks) */}
                    {selectedTask.content_body && selectedTask.task_type !== 'crosspost' && (() => {
                      const isComment = selectedTask.task_type === 'comment' || selectedTask.task_type === 'comment_reply';
                      const isMulti = isComment && isMultiCommentTask(selectedTask);

                      if (isMulti) {
                        return (
                          <div style={{ marginBottom: selectedTask.image_url ? '16px' : '0' }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <MessageSquare size={16} style={{ color: 'var(--accent-blue)' }} />
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-blue)' }}>
                                  Multi-Comment Task ({selectedTask.slots_remaining} of {selectedTask.max_claims} comment slots remaining)
                                </span>
                              </div>
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                                A unique comment will be assigned to you when you claim this task. Once claimed, head to <strong>My Tasks</strong> to view and copy your assigned comment.
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div style={{ marginBottom: selectedTask.image_url ? '16px' : '0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                              {isComment ? '💬 Comment Text:' : '📝 Post Body Text:'}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(selectedTask.content_body, 'modal_body')}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: copiedField === 'modal_body' ? '#10b981' : 'var(--accent-blue)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                            >
                              {copiedField === 'modal_body' ? <Check size={13} /> : <Copy size={13} />}
                              {copiedField === 'modal_body' ? 'Copied' : 'Copy Text'}
                            </button>
                          </div>
                          <p style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', background: 'var(--bg-default)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', margin: 0 }}>{selectedTask.content_body}</p>
                        </div>
                      );
                    })()}
                    
                    {selectedTask.image_url && (() => {
                      const mediaItems = parseMediaItems(selectedTask.image_url, selectedTask.content_mode);
                      const imageItems = mediaItems.filter(m => m.type === 'image');
                      const videoItems = mediaItems.filter(m => m.type === 'video');

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
                          {/* Videos */}
                          {videoItems.length > 0 && (
                            <div style={{ background: 'rgba(236, 72, 153, 0.05)', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: '12px', padding: '16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  🎬 Attached Video Asset{videoItems.length > 1 ? `s (${videoItems.length})` : ''}:
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {videoItems.map((vid, idx) => (
                                  <div key={idx} style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#000' }}>
                                    <video controls src={vid.url} style={{ width: '100%', maxHeight: '320px', display: 'block' }} />
                                    <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Video {idx + 1}</span>
                                      <button
                                        type="button"
                                        onClick={() => downloadMediaAsset(vid.url, `video-${idx + 1}.mp4`)}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: '4px',
                                          background: '#ec4899', color: '#fff', border: 'none',
                                          padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                                        }}
                                      >
                                        <Download size={12} /> Download Video
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Images */}
                          {imageItems.length > 0 && (
                            <div style={{ 
                              background: selectedTask.task_type === 'upvote' ? 'rgba(99, 102, 241, 0.06)' : 'rgba(59, 130, 246, 0.05)', 
                              border: `1px solid ${selectedTask.task_type === 'upvote' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`, 
                              borderRadius: '12px', 
                              padding: '16px' 
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: selectedTask.task_type === 'upvote' ? '#818cf8' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {selectedTask.task_type === 'upvote' 
                                    ? '🎯 Target Comment Screenshot (Upvote This Comment):' 
                                    : `🖼️ Attached Image Asset${imageItems.length > 1 ? `s (${imageItems.length})` : ''}:`}
                                </span>
                                {imageItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => imageItems.forEach((img, idx) => downloadMediaAsset(img.url, `image-${idx + 1}.jpg`))}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '4px',
                                      background: 'var(--accent-blue)', color: '#fff', border: 'none',
                                      padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                                    }}
                                  >
                                    <Download size={12} /> Download All Images
                                  </button>
                                )}
                              </div>
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: imageItems.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '12px'
                              }}>
                                {imageItems.map((img, idx) => (
                                  <div key={idx} style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#000', position: 'relative' }}>
                                    <img src={img.url} alt={`Task Asset ${idx + 1}`} style={{ width: '100%', maxHeight: imageItems.length === 1 ? '350px' : '200px', objectFit: 'contain', display: 'block' }} />
                                    <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Image {idx + 1}</span>
                                      <button
                                        type="button"
                                        onClick={() => downloadMediaAsset(img.url, `image-${idx + 1}.jpg`)}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: '4px',
                                          background: 'var(--accent-blue)', color: '#fff', border: 'none',
                                          padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                                        }}
                                      >
                                        <Download size={11} /> Download
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div style={{
                padding: '20px 32px 28px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'rgba(0,0,0,0.01)',
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={() => setSelectedTask(null)}
                  style={{
                    flex: 1, padding: '13px', borderRadius: '10px',
                    background: 'transparent', color: 'var(--text-secondary)',
                    border: '1px solid var(--border-medium)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  Close
                </button>

                {selectedTask && isTaskOnCooldown(selectedTask) ? (
                  <button
                    disabled
                    style={{
                      flex: 1.5, padding: '13px', borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '14px', fontWeight: 600,
                      cursor: 'not-allowed',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                      opacity: 0.85
                    }}
                  >
                    <Clock size={18} />
                    {getCooldownLabel(selectedTask)} (Wait for Timer)
                  </button>
                ) : (
                  <button
                    onClick={() => handleClaim(selectedTask.id)}
                    disabled={claimingId === selectedTask.id}
                    style={{
                      flex: 1.5, padding: '13px', borderRadius: '10px',
                      background: 'var(--text-primary)', color: 'var(--bg-primary)',
                      border: 'none', fontSize: '14px', fontWeight: 600, cursor: claimingId === selectedTask.id ? 'not-allowed' : 'pointer',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                      opacity: claimingId === selectedTask.id ? 0.7 : 1, transition: 'all 0.2s'
                    }}
                  >
                    {claimingId === selectedTask.id ? 'Claiming...' : (
                      <>
                        <PlusCircle size={18} />
                        Claim & Start Task
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}



