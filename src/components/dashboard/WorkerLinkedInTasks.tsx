'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { claimTask } from '@/actions/tasks';
import { 
  Search, Clock, DollarSign, MessageSquare, AlertCircle, 
  ExternalLink, UserPlus, Users, Share2, Repeat, ThumbsUp, 
  FileText, CheckCircle2, ArrowRight, Copy, Check, Image as ImageIcon
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  LinkedInIcon, 
  LINKEDIN_TASK_TYPES, 
  LINKEDIN_REACTION_OPTIONS,
  formatLinkedInHandle 
} from '@/utils/linkedin';
import { parseMediaItems } from '@/utils/media';

const getLinkedInTypeIcon = (type: string) => {
  switch (type) {
    case 'post': return <FileText size={14} style={{ color: '#0A66C2' }} />;
    case 'comment': return <MessageSquare size={14} style={{ color: '#0A66C2' }} />;
    case 'like': return <ThumbsUp size={14} style={{ color: '#0A66C2' }} />;
    case 'repost': return <Repeat size={14} style={{ color: '#0A66C2' }} />;
    case 'follow': return <UserPlus size={14} style={{ color: '#0A66C2' }} />;
    case 'connect': return <Users size={14} style={{ color: '#0A66C2' }} />;
    case 'share': return <Share2 size={14} style={{ color: '#0A66C2' }} />;
    default: return <LinkedInIcon size={14} />;
  }
};

const getLinkedInTypeLabel = (type: string) => {
  switch (type) {
    case 'post': return 'Post';
    case 'comment': return 'Comment';
    case 'like': return 'Like / React';
    case 'repost': return 'Repost';
    case 'follow': return 'Follow';
    case 'connect': return 'Connect';
    case 'share': return 'Share';
    default: return 'LinkedIn Task';
  }
};

export default function WorkerLinkedInTasks({ 
  initialTasks,
  activeAccountId
}: { 
  initialTasks: any[];
  activeAccountId?: string;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
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

  const handleClaim = async (taskId: string) => {
    if (!confirm('Are you sure you want to claim this LinkedIn task? You will have 1 hour to complete and submit proof.')) return;
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

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredTasks = tasks.filter(t => {
    if (t.platform !== 'linkedin') return false;

    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.instructions?.toLowerCase().includes(search.toLowerCase()) ||
      (t.task_seq_id && `task id: ${t.task_seq_id}`.toLowerCase().includes(search.toLowerCase())) ||
      (t.task_seq_id && String(t.task_seq_id).includes(search.toLowerCase()));

    const matchesType = typeFilter === 'all' || t.task_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getCategoryCount = (typeId: string) => {
    const lnTasks = tasks.filter(t => t.platform === 'linkedin');
    if (typeId === 'all') return lnTasks.length;
    return lnTasks.filter(t => t.task_type === typeId).length;
  };

  return (
    <div className="dashboard-content-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              background: 'rgba(10, 102, 194, 0.1)', 
              borderRadius: '10px', 
              padding: '6px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <LinkedInIcon size={24} />
            </span>
            Available LinkedIn Tasks
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Complete Post, Comment, Reaction, Repost, Follow, Connect, and Share tasks on LinkedIn to earn money.
          </p>
        </div>

        {/* Cooldown Info Badge */}
        <div style={{
          background: 'rgba(10, 102, 194, 0.08)',
          border: '1px solid rgba(10, 102, 194, 0.25)',
          borderRadius: '12px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12px',
          color: 'var(--text-primary)'
        }}>
          <Clock size={16} color="#0A66C2" />
          <div>
            <span style={{ fontWeight: 700, color: '#0A66C2' }}>Cooldown Rules:</span> 1 Post/Repost per 20 hrs • 3 other tasks per hour
          </div>
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[{ type: 'all', label: 'All Tasks' }, ...LINKEDIN_TASK_TYPES].map(tab => {
            const isSelected = typeFilter === tab.type;
            const count = getCategoryCount(tab.type);

            return (
              <button
                key={tab.type}
                onClick={() => setTypeFilter(tab.type)}
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
                {getLinkedInTypeIcon(tab.type)}
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
      </div>

      {/* Task Grid */}
      {filteredTasks.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)'
        }}>
          <LinkedInIcon size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            No LinkedIn tasks available right now
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Check back shortly for new campaigns and engagement opportunities.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredTasks.map(task => {
            const isPostOrRepost = task.task_type === 'post' || task.task_type === 'repost';
            const mediaList = task.image_url ? parseMediaItems(task.image_url) : [];

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  transition: 'border-color 0.2s, transform 0.2s',
                  position: 'relative'
                }}
              >
                {/* Card Top: Type Badge + Reward */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: 'rgba(10, 102, 194, 0.1)',
                    color: '#0A66C2',
                    border: '1px solid rgba(10, 102, 194, 0.2)'
                  }}>
                    {getLinkedInTypeIcon(task.task_type)}
                    {getLinkedInTypeLabel(task.task_type)}
                    {task.flair ? ` • ${task.flair}` : (task.reaction_type && ` • ${task.reaction_type}`)}
                  </span>

                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#22c55e' }}>
                    ${Number(task.payment_amount || 0).toFixed(2)}
                  </span>
                </div>

                {/* Card Body: Title & Instructions */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.4 }}>
                    {task.title}
                  </h3>
                  {task.instructions && (
                    <p style={{
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {task.instructions}
                    </p>
                  )}

                  {/* Media Indicator */}
                  {mediaList.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '12px', color: '#0A66C2', fontWeight: 600 }}>
                      <ImageIcon size={14} /> {mediaList.length} media attached
                    </div>
                  )}
                </div>

                {/* Card Footer: Slots + Claim Action */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {(task.max_claims || 1) - (task.active_claims_count || 0)}
                    </span> slots left
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedTask(task)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleClaim(task.id)}
                      disabled={claimingId === task.id}
                      style={{
                        background: '#0A66C2',
                        border: 'none',
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: claimingId === task.id ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(10, 102, 194, 0.3)'
                      }}
                    >
                      {claimingId === task.id ? 'Claiming...' : 'Claim Task'}
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
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
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: '20px',
            padding: '28px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LinkedInIcon size={20} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0A66C2', textTransform: 'uppercase' }}>
                  {getLinkedInTypeLabel(selectedTask.task_type)} Details
                </span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedTask.title}
            </h3>

            {/* Target Link */}
            {selectedTask.post_link && (
              <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Target LinkedIn URL
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <a 
                    href={selectedTask.post_link} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ fontSize: '13px', color: '#0A66C2', wordBreak: 'break-all', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {selectedTask.post_link} <ExternalLink size={12} />
                  </a>
                  <button
                    onClick={() => handleCopy(selectedTask.post_link, 'link')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {copiedField === 'link' ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* Connection Note */}
            {selectedTask.connection_note && (
              <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Connection Note
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                  {selectedTask.connection_note}
                </p>
              </div>
            )}

            {/* Provided Content / Copy */}
            {selectedTask.content_body && (
              <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Required Post / Comment Content
                  </span>
                  <button
                    onClick={() => handleCopy(selectedTask.content_body, 'content')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                  >
                    {copiedField === 'content' ? <Check size={12} color="#22c55e" /> : <Copy size={12} />} Copy
                  </button>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {selectedTask.content_body}
                </p>
              </div>
            )}

            {/* Instructions */}
            {selectedTask.instructions && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Worker Instructions
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {selectedTask.instructions}
                </p>
              </div>
            )}

            {/* Attached Media Previews */}
            {selectedTask.image_url && parseMediaItems(selectedTask.image_url).length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Attached Media
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {parseMediaItems(selectedTask.image_url).map((item, i) => (
                    <a key={i} href={item.url} target="_blank" rel="noreferrer" style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <img src={item.url} alt="attached" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Claim Action in Modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={() => setSelectedTask(null)}
                style={{ padding: '10px 18px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  const id = selectedTask.id;
                  setSelectedTask(null);
                  handleClaim(id);
                }}
                style={{ padding: '10px 22px', borderRadius: '8px', background: '#0A66C2', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Claim This Task (${Number(selectedTask.payment_amount || 0).toFixed(2)})
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
