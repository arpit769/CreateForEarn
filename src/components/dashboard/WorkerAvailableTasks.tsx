'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { claimTask } from '@/actions/tasks';
import { PlusCircle, Search, Clock, DollarSign, Image as ImageIcon, MessageSquare, AlertCircle, Type, ArrowBigUp, Share2, Film, Video, Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { parseMediaItems } from '@/utils/media';
import { isMultiCommentTask } from '@/utils/comments';

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
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearch(query);
    }
  }, [searchParams]);

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
    const isRedditPlatform = (t.platform || 'reddit') === 'reddit';
    if (!isRedditPlatform) return false;

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
      const isRedditPlatform = (t.platform || 'reddit') === 'reddit';
      if (!isRedditPlatform) return false;

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
                    {task.subreddits?.name && (
                      <span 
                        style={{ 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: 'var(--accent-blue)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          display: 'inline-flex', alignItems: 'center', gap: '3px'
                        }}
                      >
                        r/{task.subreddits.name}
                      </span>
                    )}
                    {task.task_seq_id && !task.title?.startsWith('User-Generated') && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        #{task.task_seq_id}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 700, fontSize: '16px' }}>
                    <DollarSign size={16} />
                    {task.payment_amount.toFixed(2)}
                  </div>
                </div>

                <div style={{ margin: '14px 0 8px 0' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: '1.4' }}>
                    {task.title}
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
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Slots: <strong style={{ color: 'var(--text-primary)' }}>{task.slots_remaining !== undefined ? task.slots_remaining : (task.max_claims || 1)} left</strong>
                </span>

                {isTaskOnCooldown(task) ? (
                  <button
                    disabled
                    style={{
                      padding: '8px 14px', borderRadius: '8px',
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
                    disabled={claimingId === task.id || (task.slots_remaining !== undefined && task.slots_remaining <= 0)}
                    style={{
                      padding: '8px 16px', borderRadius: '8px',
                      background: 'var(--accent-blue)', color: '#fff',
                      border: 'none', fontSize: '13px', fontWeight: 600,
                      cursor: claimingId === task.id || (task.slots_remaining !== undefined && task.slots_remaining <= 0) ? 'not-allowed' : 'pointer',
                      opacity: claimingId === task.id ? 0.7 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      transition: 'opacity 0.2s'
                    }}
                  >
                    <PlusCircle size={14} />
                    {claimingId === task.id ? 'Claiming...' : (task.slots_remaining !== undefined && task.slots_remaining <= 0) ? 'Full' : 'Claim Task'}
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
    </div>
  );
}




