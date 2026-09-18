'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { claimTask } from '@/actions/tasks';
import { 
  PlusCircle, Search, Clock, DollarSign,
  MessageSquare, AlertCircle, Link as LinkIcon, X, Eye, 
  Copy, Check, ExternalLink, UserPlus, Heart, Bookmark,
  Video, Compass, CheckCircle2, ArrowRight, Image as ImageIcon
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { InstagramIcon } from '@/utils/instagram';

const getInstagramTypeIcon = (type: string) => {
  switch (type) {
    case 'post': return <ImageIcon size={14} style={{ color: '#E1306C' }} />;
    case 'comment': return <MessageSquare size={14} style={{ color: '#833AB4' }} />;
    case 'like': return <Heart size={14} style={{ color: '#FD1D1D' }} />;
    case 'follow': return <UserPlus size={14} style={{ color: '#F77737' }} />;
    case 'save': return <Bookmark size={14} style={{ color: '#FFDC80' }} />;
    case 'reel_view': return <Video size={14} style={{ color: '#405DE6' }} />;
    case 'story_view': return <Compass size={14} style={{ color: '#5851DB' }} />;
    default: return <InstagramIcon size={14} color="#E1306C" />;
  }
};

const getInstagramTypeLabel = (type: string) => {
  switch (type) {
    case 'post': return 'Post / Reel';
    case 'comment': return 'Comment';
    case 'like': return 'Like Post/Reel';
    case 'follow': return 'Follow Profile';
    case 'save': return 'Save Post/Reel';
    case 'reel_view': return 'Watch Reel';
    case 'story_view': return 'View Story';
    default: return 'Instagram Task';
  }
};

export default function WorkerInstagramTasks({ 
  initialTasks
}: { 
  initialTasks: any[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearch(query);
    }
  }, [searchParams]);

  const handleClaim = async (taskId: string) => {
    if (!confirm('Are you sure you want to claim this Instagram task? You will have 1 hour to complete and submit proof.')) return;
    setClaimingId(taskId);
    
    const res = await claimTask(taskId);
    if (res.error) {
      alert("Failed to claim task: " + res.error);
      setClaimingId(null);
    } else {
      setTasks(tasks.filter(t => t.id !== taskId));
      setClaimingId(null);
      router.push('/worker/my-tasks');
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (t.platform !== 'instagram') return false;

    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.instructions?.toLowerCase().includes(search.toLowerCase()) ||
      (t.task_seq_id && `task id: ${t.task_seq_id}`.toLowerCase().includes(search.toLowerCase())) ||
      (t.task_seq_id && String(t.task_seq_id).includes(search.toLowerCase()));

    const matchesType = typeFilter === 'all' || t.task_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getCategoryCount = (typeId: string) => {
    const igTasks = tasks.filter(t => t.platform === 'instagram');
    if (typeId === 'all') return igTasks.length;
    return igTasks.filter(t => t.task_type === typeId).length;
  };

  return (
    <div className="dashboard-content-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
              width: '32px', height: '32px', borderRadius: '8px', 
              background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)', color: '#fff' 
            }}>
              <InstagramIcon size={18} color="#ffffff" />
            </span>
            Instagram Tasks
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Browse and claim Instagram tasks (Post, Comment, Like, Follow, Save, Reel View, Story View). Cooldown: 1 post per 20 hrs, 3 per hr for other tasks.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search Instagram tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '14px 14px 14px 40px', 
              background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', 
              borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' 
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%', alignItems: 'center' }}>
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'post', label: 'Posts / Reels' },
            { id: 'comment', label: 'Comments' },
            { id: 'like', label: 'Likes' },
            { id: 'follow', label: 'Follows' },
            { id: 'save', label: 'Saves' },
            { id: 'reel_view', label: 'Reel Views' },
            { id: 'story_view', label: 'Story Views' },
          ].map(f => {
            const count = getCategoryCount(f.id);
            const isSelected = typeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                  whiteSpace: 'nowrap', cursor: 'pointer',
                  background: isSelected ? 'rgba(225, 48, 108, 0.15)' : 'var(--bg-card)',
                  color: isSelected ? '#E1306C' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid rgba(225, 48, 108, 0.35)' : '1px solid var(--border-subtle)',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex', alignItems: 'center', gap: '6px'
                }}
              >
                <span>{f.label}</span>
                <span style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(225, 48, 108, 0.25)' : 'rgba(255,255,255,0.06)',
                  color: isSelected ? '#E1306C' : 'var(--text-muted)'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px', background: 'var(--bg-card)',
          borderRadius: '20px', border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, rgba(131,58,180,0.1), rgba(253,29,29,0.1))', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto',
            color: '#E1306C'
          }}>
            <InstagramIcon size={28} color="#E1306C" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Instagram Tasks Available
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Check back later for new Instagram posts, comments, likes, saves, and follow tasks.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {filteredTasks.map((task) => {
            const isUgc = task.title?.startsWith('User-Generated');
            const slotsRemaining = task.slots_remaining !== undefined ? task.slots_remaining : Math.max(0, (task.max_claims || 1) - (task.active_claims_count || 0));

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'var(--bg-card)', borderRadius: '16px',
                  border: '1px solid var(--border-subtle)', padding: '20px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  gap: '16px', transition: 'all 0.2s ease', position: 'relative'
                }}
              >
                <div>
                  {/* Card Header: Type Badge, Seq ID, and Payment */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 700,
                        background: 'rgba(225, 48, 108, 0.12)', color: '#E1306C',
                        padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {getInstagramTypeIcon(task.task_type)}
                        {task.task_type?.replace('_', ' ')}
                      </span>

                      {task.task_seq_id && (
                        <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '4px 8px', borderRadius: '6px' }}>
                          #{task.task_seq_id}
                        </span>
                      )}

                      {isUgc && (
                        <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', padding: '4px 8px', borderRadius: '6px' }}>
                          UGC
                        </span>
                      )}
                    </div>

                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '2px',
                      fontSize: '18px', fontWeight: 800, color: '#10b981'
                    }}>
                      <DollarSign size={16} strokeWidth={3} />
                      {Number(task.payment_amount).toFixed(2)}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.3 }}>
                    {task.title}
                  </h3>

                  {task.instructions && (
                    <p style={{
                      fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5,
                      marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {task.instructions}
                    </p>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Slots: <strong style={{ color: 'var(--text-primary)' }}>{slotsRemaining} left</strong>
                  </div>

                  <button
                    onClick={() => handleClaim(task.id)}
                    disabled={claimingId === task.id || slotsRemaining <= 0}
                    style={{
                      padding: '8px 18px', borderRadius: '8px',
                      background: slotsRemaining <= 0 ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #833AB4, #FD1D1D)',
                      color: slotsRemaining <= 0 ? 'var(--text-muted)' : '#ffffff',
                      border: 'none', fontSize: '13px', fontWeight: 600,
                      cursor: claimingId === task.id || slotsRemaining <= 0 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      boxShadow: slotsRemaining <= 0 ? 'none' : '0 4px 12px rgba(225, 48, 108, 0.3)'
                    }}
                  >
                    {claimingId === task.id ? 'Claiming...' : (slotsRemaining <= 0 ? 'Full' : 'Claim Task')}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

