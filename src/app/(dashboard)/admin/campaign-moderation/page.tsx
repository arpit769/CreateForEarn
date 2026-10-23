'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone, CheckCircle2, XCircle, Search, Filter,
  Eye, Check, X, AlertTriangle, Loader2, Clock,
  DollarSign, Users, Layers, ArrowRight, ShieldCheck,
  ChevronDown, ChevronUp, Sparkles, FileText, Hash,
  ExternalLink, Send, Ban, Tag
} from 'lucide-react';
import { getAllCampaignsForAdmin, approveCampaignAndCreateTasks, rejectCampaign } from '@/actions/campaigns';
import { getSubreddits } from '@/actions/users';
import { PlatformLogo } from '@/components/common/PlatformLogo';

type PlatformKey = 'reddit' | 'youtube' | 'x' | 'instagram' | 'linkedin' | 'quora';
type TaskActionKey = 
  | 'post' | 'comment' | 'upvote' | 'like' | 'subscribe' | 'comment_reply' 
  | 'crosspost' | 'repost' | 'quote_post' | 'bookmark' | 'follow' 
  | 'answer' | 'follow_topic' | 'share' | 'save' | 'reel_view' 
  | 'story_view' | 'connect' | 'reshare';

interface Campaign {
  id: string;
  client_id: string;
  name: string;
  platform: PlatformKey;
  task_type: TaskActionKey;
  task_count: number;
  unit_rate: number;
  total_budget: number;
  target_url?: string;
  instructions?: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'partially_approved';
  admin_notes?: string;
  tasks_created: number;
  created_at: string;
  reviewed_at?: string;
  users?: { full_name: string; email: string; assigned_tag_id?: string; assigned_tag_name?: string };
  subreddit_id?: string | null;
  tag_name?: string | null;
}

const PLATFORM_LABELS: Record<PlatformKey, string> = {
  reddit: 'Reddit', youtube: 'YouTube', x: 'X (Twitter)',
  instagram: 'Instagram', linkedin: 'LinkedIn', quora: 'Quora',
};

const ACTION_LABELS: Record<string, string> = {
  post: 'Post',
  comment: 'Comment',
  comment_reply: 'Comment Reply',
  upvote: 'Upvote',
  like: 'Like',
  subscribe: 'Subscribe',
  crosspost: 'Crosspost',
  repost: 'Repost',
  quote_post: 'Quote Post',
  bookmark: 'Bookmark',
  follow: 'Follow',
  answer: 'Answer',
  follow_topic: 'Follow Topic',
  share: 'Share',
  save: 'Save',
  reel_view: 'Reel View',
  story_view: 'Story View',
  connect: 'Connect',
  reshare: 'Reshare / Repost',
};

const TASK_TYPE_MAP: Record<string, string> = {
  post: 'post',
  comment: 'comment',
  comment_reply: 'comment_reply',
  upvote: 'upvote',
  like: 'like',
  subscribe: 'subscribe',
  crosspost: 'crosspost',
  repost: 'repost',
  quote_post: 'quote_post',
  bookmark: 'bookmark',
  follow: 'follow',
  answer: 'answer',
  follow_topic: 'follow_topic',
  share: 'share',
  save: 'save',
  reel_view: 'reel_view',
  story_view: 'story_view',
  connect: 'connect',
  reshare: 'crosspost',
};

function getCleanDomain(rawUrl?: string): string {
  if (!rawUrl) return '';
  try {
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return 'Target Link';
  }
}

function parseInstructions(rawInstructions?: string) {
  if (!rawInstructions) return { postFormat: null, contentSource: null, contentCopy: null, destination: null, notes: null, mediaUrls: [] };

  // 1. Extract Media URLs
  const mediaMatch = rawInstructions.match(/\[(?:Attached Media|Image URL|Media):\s*([^\]]+)\]/i);
  const mediaUrls = mediaMatch?.[1]?.split(',').map(s => s.trim()).filter(Boolean) || [];

  // Remove media tag completely so raw link is NEVER shown in the text
  let cleaned = rawInstructions.replace(/\[(?:Attached Media|Image URL|Media):\s*[^\]]+\]/gi, '').trim();

  // 2. Extract Post Format
  let postFormat: string | null = null;
  const formatMatch = cleaned.match(/\[Post Format:\s*([^\]]+)\]/i);
  if (formatMatch) {
    postFormat = formatMatch[1].trim();
    cleaned = cleaned.replace(formatMatch[0], '').trim();
  }

  // 3. Extract Content Source
  let contentSource: string | null = null;
  const sourceMatch = cleaned.match(/\[Content Source:\s*([^\]]+)\]/i);
  if (sourceMatch) {
    contentSource = sourceMatch[1].trim();
    cleaned = cleaned.replace(sourceMatch[0], '').trim();
  }

  // 4. Extract Post / Content Copy
  let contentCopy: string | null = null;
  const copyMatch = cleaned.match(/\[Post \/ Content Copy:\s*([\s\S]*?)\](?=\s*\[|\s*$)/i);
  if (copyMatch) {
    contentCopy = copyMatch[1].trim();
    cleaned = cleaned.replace(copyMatch[0], '').trim();
  }

  // 5. Extract Destination Subreddit / Link
  let destination: string | null = null;
  const destMatch = cleaned.match(/\[Destination Subreddit \/ Link:\s*([^\]]+)\]/i);
  if (destMatch) {
    destination = destMatch[1].trim();
    cleaned = cleaned.replace(destMatch[0], '').trim();
  }

  const notes = cleaned.replace(/^\s+|\s+$/g, '');

  return {
    postFormat,
    contentSource,
    contentCopy,
    destination,
    notes: notes.length > 0 ? notes : null,
    mediaUrls
  };
}

function TargetUrlDisplay({ url }: { url?: string }) {
  if (!url) return null;
  const domain = getCleanDomain(url);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0', fontSize: '12px' }}>
      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Target URL:</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: '#3b82f6',
          fontWeight: 600,
          textDecoration: 'none',
          padding: '2px 8px',
          borderRadius: '6px',
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          fontSize: '11.5px',
          transition: 'all 0.15s ease'
        }}
        title="Open target URL in new tab"
      >
        <span>Open Link ↗ {domain ? `(${domain})` : ''}</span>
      </a>
    </div>
  );
}

function CampaignInstructionsDisplay({ instructions }: { instructions?: string }) {
  if (!instructions) return null;

  const parsed = parseInstructions(instructions);
  const hasBadges = Boolean(parsed.postFormat || parsed.contentSource || parsed.destination);
  const hasContent = Boolean(parsed.contentCopy || parsed.notes || hasBadges);

  if (!hasContent) return null;

  return (
    <div style={{
      marginTop: '8px',
      marginBottom: '8px',
      padding: '10px 12px',
      borderRadius: '8px',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      fontSize: '12px'
    }}>
      {/* Badges for Format & Source */}
      {hasBadges && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {parsed.postFormat && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(168, 85, 247, 0.1)',
              color: '#a855f7',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              textTransform: 'capitalize'
            }}>
              Format: {parsed.postFormat}
            </span>
          )}
          {parsed.contentSource && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              Source: {parsed.contentSource}
            </span>
          )}
          {parsed.destination && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(255, 69, 0, 0.1)',
              color: '#ff4500',
              border: '1px solid rgba(255, 69, 0, 0.25)'
            }}>
              Destination: {parsed.destination.startsWith('http') ? (
                <a href={parsed.destination} target="_blank" rel="noopener noreferrer" style={{ color: '#ff4500', textDecoration: 'none' }}>
                  Link ↗
                </a>
              ) : (
                parsed.destination
              )}
            </span>
          )}
        </div>
      )}

      {/* Post Content / Copy */}
      {parsed.contentCopy && (
        <div style={{
          padding: '8px 10px',
          borderRadius: '6px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          fontSize: '12px',
          lineHeight: 1.4
        }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
            Provided Content Copy:
          </span>
          <div style={{ fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
            "{parsed.contentCopy}"
          </div>
        </div>
      )}

      {/* Client Custom Instructions / Notes */}
      {parsed.notes && (
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Instructions: </span>
          <span>{parsed.notes}</span>
        </div>
      )}
    </div>
  );
}

export default function AdminCampaignModerationPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [lastApprovedRates, setLastApprovedRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Subreddit tags & client task sequence
  const [allSubreddits, setAllSubreddits] = useState<{ id: string; name: string }[]>([]);
  const [nextClientSeq, setNextClientSeq] = useState<number>(1);
  const [selectedSubredditTagId, setSelectedSubredditTagId] = useState<string>('');

  // Review modal
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [paymentPerTask, setPaymentPerTask] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reject modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Campaign does not meet platform guidelines.');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const getLastApprovedRate = (campaign: Campaign): number | null => {
    const plat = (campaign.platform || '').toLowerCase().trim();
    const type = (campaign.task_type || '').toLowerCase().trim();
    const mappedType = (TASK_TYPE_MAP[type] || type).toLowerCase().trim();

    // 1. In-memory / server-fetched rates
    if (lastApprovedRates[`${plat}_${type}`] !== undefined) return lastApprovedRates[`${plat}_${type}`];
    if (lastApprovedRates[`${plat}_${mappedType}`] !== undefined) return lastApprovedRates[`${plat}_${mappedType}`];
    if (lastApprovedRates[type] !== undefined) return lastApprovedRates[type];
    if (lastApprovedRates[mappedType] !== undefined) return lastApprovedRates[mappedType];

    // 2. LocalStorage fallback
    if (typeof window !== 'undefined') {
      try {
        const s1 = localStorage.getItem(`last_approved_rate_${plat}_${type}`);
        if (s1 && !isNaN(parseFloat(s1))) return parseFloat(s1);
        const s2 = localStorage.getItem(`last_approved_rate_${type}`);
        if (s2 && !isNaN(parseFloat(s2))) return parseFloat(s2);
        const s3 = localStorage.getItem(`last_approved_rate_${plat}_${mappedType}`);
        if (s3 && !isNaN(parseFloat(s3))) return parseFloat(s3);
        const s4 = localStorage.getItem(`last_approved_rate_${mappedType}`);
        if (s4 && !isNaN(parseFloat(s4))) return parseFloat(s4);
      } catch (e) {}
    }

    return null;
  };

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const [res, subsRes] = await Promise.all([
        getAllCampaignsForAdmin(),
        getSubreddits(true)
      ]);
      if (res.campaigns) {
        setCampaigns(res.campaigns as Campaign[]);
      }
      if (res.lastApprovedRates) {
        setLastApprovedRates(res.lastApprovedRates);
      }
      if (res.nextClientSeq) {
        setNextClientSeq(res.nextClientSeq);
      }
      if (subsRes?.subreddits) {
        setAllSubreddits(subsRes.subreddits);
      }
      if (res.error) showToast(res.error, 'error');
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const openReviewModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    const lastRate = getLastApprovedRate(campaign);
    if (lastRate !== null && lastRate > 0) {
      setPaymentPerTask(lastRate.toString());
    } else {
      setPaymentPerTask(campaign.unit_rate.toString());
    }
    setAdminNotes('');
    const initialTag = campaign.subreddit_id || (campaign.users as any)?.assigned_tag_id || '';
    setSelectedSubredditTagId(initialTag);
  };

  const handleApprove = async () => {
    if (!selectedCampaign) return;
    const amount = parseFloat(paymentPerTask);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid payment amount per task.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await approveCampaignAndCreateTasks(
        selectedCampaign.id,
        amount,
        adminNotes,
        selectedCampaign.platform === 'reddit' ? selectedSubredditTagId : undefined
      );
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        const idRange = res.startCustomId ? ` (${res.startCustomId}${res.endCustomId !== res.startCustomId ? ' to ' + res.endCustomId : ''})` : '';
        showToast(`Campaign approved! ${res.tasksCreated} client tasks created${idRange} at $${amount.toFixed(2)} each.`);
        
        // Update last approved rates in memory and localStorage for immediate subsequent campaign reviews
        const plat = (selectedCampaign.platform || '').toLowerCase().trim();
        const type = (selectedCampaign.task_type || '').toLowerCase().trim();
        const mappedType = (TASK_TYPE_MAP[type] || type).toLowerCase().trim();

        setLastApprovedRates(prev => ({
          ...prev,
          [`${plat}_${type}`]: amount,
          [`${plat}_${mappedType}`]: amount,
          [type]: amount,
          [mappedType]: amount,
        }));

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`last_approved_rate_${plat}_${type}`, amount.toString());
            localStorage.setItem(`last_approved_rate_${type}`, amount.toString());
            localStorage.setItem(`last_approved_rate_${plat}_${mappedType}`, amount.toString());
            localStorage.setItem(`last_approved_rate_${mappedType}`, amount.toString());
          } catch (e) {}
        }

        setCampaigns(prev => prev.map(c =>
          c.id === selectedCampaign.id
            ? { ...c, status: 'approved' as const, tasks_created: res.tasksCreated || 0, admin_notes: adminNotes, reviewed_at: new Date().toISOString() }
            : c
        ));
        setNextClientSeq(prev => prev + (selectedCampaign.task_count || 1));
        setSelectedCampaign(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to approve campaign', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCampaign) return;
    setIsProcessing(true);
    try {
      const res = await rejectCampaign(selectedCampaign.id, rejectReason);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`Campaign "${selectedCampaign.name}" rejected.`);
        setCampaigns(prev => prev.map(c =>
          c.id === selectedCampaign.id
            ? { ...c, status: 'rejected' as const, admin_notes: rejectReason, reviewed_at: new Date().toISOString() }
            : c
        ));
        setSelectedCampaign(null);
        setIsRejectModalOpen(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reject campaign', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesTab = filterTab === 'all' ? true : c.status === filterTab;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.users?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.users?.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const pendingCount = campaigns.filter(c => c.status === 'pending_review').length;
  const approvedCount = campaigns.filter(c => c.status === 'approved').length;
  const rejectedCount = campaigns.filter(c => c.status === 'rejected').length;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending_review': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', label: 'Pending Review' };
      case 'approved': return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', label: 'Approved' };
      case 'rejected': return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', label: 'Rejected' };
      default: return { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.12)', label: status };
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '8px 0 40px 0' }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: toastMsg.type === 'error' ? '#7f1d1d' : '#0f172a',
          color: '#fff', padding: '12px 20px', borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '13px', fontWeight: 600, zIndex: 9999
        }}>
          {toastMsg.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} color="#22c55e" />}
          {toastMsg.text}
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Megaphone size={20} color="#f59e0b" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Campaign Moderation
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Review, approve, and split client campaigns into individual worker tasks.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Campaigns', value: campaigns.length, icon: <Layers size={18} />, color: '#3b82f6' },
          { label: 'Pending Review', value: pendingCount, icon: <Clock size={18} />, color: '#f59e0b' },
          { label: 'Approved', value: approvedCount, icon: <CheckCircle2 size={18} />, color: '#22c55e' },
          { label: 'Rejected', value: rejectedCount, icon: <XCircle size={18} />, color: '#ef4444' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: '14px', padding: '16px 18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: `${stat.color}18`, color: stat.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{stat.icon}</div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{stat.label}</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs + Search */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '18px', flexWrap: 'wrap', gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          {([
            { key: 'all', label: 'All', count: campaigns.length },
            { key: 'pending_review', label: 'Pending', count: pendingCount },
            { key: 'approved', label: 'Approved', count: approvedCount },
            { key: 'rejected', label: 'Rejected', count: rejectedCount },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              style={{
                padding: '6px 14px', borderRadius: '8px',
                border: filterTab === tab.key ? '1px solid #0066FF' : '1px solid transparent',
                background: filterTab === tab.key ? 'rgba(0, 102, 255, 0.1)' : 'transparent',
                color: filterTab === tab.key ? '#0066FF' : 'var(--text-secondary)',
                fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {tab.label}
              <span style={{
                fontSize: '11px', fontWeight: 700,
                background: filterTab === tab.key ? 'rgba(0, 102, 255, 0.15)' : 'var(--bg-card)',
                padding: '1px 6px', borderRadius: '10px',
                color: filterTab === tab.key ? '#0066FF' : 'var(--text-muted)'
              }}>{tab.count}</span>
            </button>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 12px 8px 32px', borderRadius: '8px',
              border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)',
              color: 'var(--text-primary)', fontSize: '13px', outline: 'none', width: '240px'
            }}
          />
        </div>
      </div>

      {/* Campaign Cards */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px', fontSize: '14px' }}>Loading campaigns...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px',
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: '16px'
        }}>
          <Megaphone size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            No campaigns found
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {filterTab === 'pending_review' ? 'No campaigns awaiting review.' : 'No campaigns match your criteria.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredCampaigns.map(campaign => {
            const statusStyle = getStatusStyle(campaign.status);
            return (
              <div key={campaign.id} style={{
                background: 'var(--bg-card)', border: campaign.status === 'pending_review' ? '1.5px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-subtle)',
                borderRadius: '16px', padding: '20px 22px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease'
              }}>
                {/* Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <PlatformLogo platform={campaign.platform} size={32} />
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                        {campaign.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {campaign.users?.full_name || 'Brand Client'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>•</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {campaign.users?.email || ''}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>•</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>•</span>
                        {campaign.platform === 'reddit' ? (
                          (() => {
                            const tagName = campaign.tag_name || (campaign.users as any)?.assigned_tag_name || allSubreddits.find(s => s.id === campaign.subreddit_id)?.name;
                            return tagName ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '3px',
                                padding: '1px 8px', borderRadius: '12px',
                                background: 'rgba(255, 69, 0, 0.12)', color: '#ff4500',
                                border: '1px solid rgba(255, 69, 0, 0.28)', fontSize: '11px', fontWeight: 700
                              }}>
                                <Tag size={10} /> r/{tagName}
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '3px',
                                padding: '1px 8px', borderRadius: '12px',
                                background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '11px', fontWeight: 700
                              }}>
                                <AlertTriangle size={10} /> No Reddit Tag
                              </span>
                            );
                          })()
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                            padding: '1px 8px', borderRadius: '12px',
                            background: 'rgba(16, 185, 129, 0.12)', color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '11px', fontWeight: 700
                          }}>
                            🌐 Open to All Workers
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11.5px', fontWeight: 700,
                    padding: '4px 12px', borderRadius: '20px',
                    background: statusStyle.bg, color: statusStyle.color
                  }}>
                    {statusStyle.label}
                  </span>
                </div>

                {/* Info Grid */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '10px', marginBottom: '14px'
                }}>
                  <div style={{ background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>Platform</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {PLATFORM_LABELS[campaign.platform]}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>Task Type</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ACTION_LABELS[campaign.task_type]}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>Total Tasks</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {campaign.task_count}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>Client Rate / Task</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6' }}>
                      ${Number(campaign.unit_rate).toFixed(2)}
                    </div>
                    {getLastApprovedRate(campaign) !== null && (
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Tag size={11} /> Last: ${getLastApprovedRate(campaign)!.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>Total Budget</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                      ${Number(campaign.total_budget).toFixed(2)}
                    </div>
                  </div>
                  {campaign.status === 'approved' && (
                    <div style={{ background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>Tasks Created</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#22c55e' }}>
                        {campaign.tasks_created}
                      </div>
                    </div>
                  )}
                </div>

                {/* Target URL */}
                {campaign.target_url && (
                  <TargetUrlDisplay url={campaign.target_url} />
                )}

                {/* Instructions without raw links */}
                {campaign.instructions && (
                  <CampaignInstructionsDisplay instructions={campaign.instructions} />
                )}

                {/* Attached Screenshot / Media Preview on Card */}
                {(() => {
                  const mediaMatch = campaign.instructions?.match(/\[(?:Attached Media|Image URL|Media):\s*([^\]]+)\]/i);
                  const mediaUrls = mediaMatch?.[1]?.split(',').map(s => s.trim()).filter(Boolean) || [];
                  if (mediaUrls.length === 0) return null;
                  return (
                    <div style={{ marginBottom: '10px', padding: '8px 10px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                        🎯 Target Reference Screenshot:
                      </span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {mediaUrls.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }} title="Click to view full screenshot">
                            <img src={url} alt={`Target Reference ${idx + 1}`} style={{ maxWidth: '140px', maxHeight: '80px', objectFit: 'contain', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: '#000' }} />
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Admin Notes (if reviewed) */}
                {campaign.admin_notes && (
                  <div style={{
                    background: campaign.status === 'rejected' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(34, 197, 94, 0.06)',
                    border: `1px solid ${campaign.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
                    borderRadius: '8px', padding: '10px 12px', marginBottom: '10px',
                    fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5
                  }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Admin Notes: </span>
                    {campaign.admin_notes}
                  </div>
                )}

                {/* Action Buttons */}
                {campaign.status === 'pending_review' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      onClick={() => openReviewModal(campaign)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '8px',
                        border: 'none', background: '#0066FF', color: '#fff',
                        fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 3px 10px rgba(0, 102, 255, 0.2)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Eye size={14} /> Review & Approve
                    </button>
                    <button
                      onClick={() => { setSelectedCampaign(campaign); setIsRejectModalOpen(true); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '8px',
                        border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.08)',
                        color: '#ef4444', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: Review & Approve Campaign */}
      {/* ================================================================ */}
      {selectedCampaign && !isRejectModalOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-primary)', border: '1px solid var(--border-medium)',
            borderRadius: '20px', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.15s ease-out'
          }}>
            {/* Fixed Header */}
            <div style={{
              padding: '22px 24px 16px', borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              flexShrink: 0
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShieldCheck size={18} color="#f59e0b" />
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Review Campaign
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  Set the payment amount per task, then approve to create individual worker tasks.
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{ padding: '18px 24px', overflowY: 'auto', flex: 1 }}>
              {/* Campaign Summary Card */}
              <div style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                borderRadius: '14px', padding: '16px', marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <PlatformLogo platform={selectedCampaign.platform} size={28} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedCampaign.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      by {selectedCampaign.users?.full_name || 'Brand Client'} — {selectedCampaign.users?.email || ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: getLastApprovedRate(selectedCampaign) !== null ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: '8px' }}>
                  <div style={{ background: 'var(--bg-card)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>Platform</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>{PLATFORM_LABELS[selectedCampaign.platform]}</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>Task Type</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>{ACTION_LABELS[selectedCampaign.task_type]}</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>Tasks Requested</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedCampaign.task_count}</div>
                  </div>
                  {getLastApprovedRate(selectedCampaign) !== null && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Tag size={10} /> Last Given
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#10b981' }}>
                        ${getLastApprovedRate(selectedCampaign)!.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                {selectedCampaign.target_url && (
                  <TargetUrlDisplay url={selectedCampaign.target_url} />
                )}

                {selectedCampaign.instructions && (
                  <CampaignInstructionsDisplay instructions={selectedCampaign.instructions} />
                )}

                {/* Attached Screenshot / Media Preview */}
                {(() => {
                  const mediaMatch = selectedCampaign.instructions?.match(/\[(?:Attached Media|Image URL|Media):\s*([^\]]+)\]/i);
                  const mediaUrls = mediaMatch?.[1]?.split(',').map(s => s.trim()).filter(Boolean) || [];
                  if (mediaUrls.length === 0) return null;
                  return (
                    <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                        🎯 Target Reference Screenshot (Post / Comment to Upvote):
                      </span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {mediaUrls.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }} title="Click to view full screenshot">
                            <img src={url} alt={`Target Reference ${idx + 1}`} style={{ maxWidth: '160px', maxHeight: '100px', objectFit: 'contain', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: '#000' }} />
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Generated Client Task IDs (Starting with 'C') */}
              <div style={{
                padding: '12px 14px', borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '16px', flexWrap: 'wrap', gap: '8px'
              }}>
                <div>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                    Generated Task IDs (Client Series)
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#3b82f6' }}>
                    C{nextClientSeq} {selectedCampaign.task_count > 1 ? `– C${nextClientSeq + selectedCampaign.task_count - 1}` : ''}
                  </span>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                  borderRadius: '6px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6'
                }}>
                  Separate Series Starting with &apos;C&apos;
                </span>
              </div>

              {/* Subreddit Tag (for Reddit) vs Open Platform Notice (for Non-Reddit) */}
              {selectedCampaign.platform === 'reddit' ? (
                <div style={{
                  marginBottom: '16px', padding: '12px 14px', borderRadius: '10px',
                  background: 'rgba(255, 69, 0, 0.05)', border: '1px solid rgba(255, 69, 0, 0.25)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#ff4500', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Tag size={12} /> Subreddit Tag (Required for Reddit Tasks)
                    </label>
                  </div>
                  <select
                    value={selectedSubredditTagId}
                    onChange={e => setSelectedSubredditTagId(e.target.value)}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid var(--border-medium)', background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)', fontSize: '13px', outline: 'none'
                    }}
                  >
                    <option value="">-- Select / Confirm Subreddit Tag --</option>
                    {allSubreddits.map(s => (
                      <option key={s.id} value={s.id}>
                        r/{s.name}
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                    🔒 <strong>Strict Reddit Tag Isolation:</strong> Only workers whose active verified Reddit account has this matching tag will be able to see and claim these client tasks.
                  </p>
                </div>
              ) : (
                <div style={{
                  marginBottom: '16px', padding: '10px 14px', borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <span>🌐</span>
                  <span>
                    <strong>Open to All Workers:</strong> Since this is a <strong>{PLATFORM_LABELS[selectedCampaign.platform]}</strong> campaign, it will be open to all verified workers without tag restrictions.
                  </span>
                </div>
              )}

              {/* Payment Per Task & Price Tags */}
              <div style={{ marginBottom: '16px' }}>
                {(() => {
                  const lastGivenRate = getLastApprovedRate(selectedCampaign);
                  const clientRate = Number(selectedCampaign.unit_rate);
                  const currentAmount = parseFloat(paymentPerTask || '0');

                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                        <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          Payment Amount Per Task ($)
                        </label>
                        {lastGivenRate !== null && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.25)'
                          }}>
                            <Sparkles size={11} /> Last Given on {ACTION_LABELS[selectedCampaign.task_type] || selectedCampaign.task_type}: ${lastGivenRate.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                        This is the amount each worker will earn for completing one individual task.{' '}
                        Client&apos;s proposed rate: <strong style={{ color: 'var(--text-primary)' }}>${clientRate.toFixed(2)}</strong>
                        {lastGivenRate !== null && (
                          <> • Last approved: <strong style={{ color: '#10b981' }}>${lastGivenRate.toFixed(2)}</strong></>
                        )}
                      </p>

                      {/* Interactive Price Tags */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '2px' }}>
                          <Tag size={12} /> Price Tags:
                        </span>

                        {/* Last Given Amount Tag */}
                        {lastGivenRate !== null && (
                          <button
                            type="button"
                            onClick={() => setPaymentPerTask(lastGivenRate.toString())}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '8px',
                              border: currentAmount === lastGivenRate ? '1.5px solid #10b981' : '1px solid rgba(16, 185, 129, 0.35)',
                              background: currentAmount === lastGivenRate ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.08)',
                              color: '#10b981',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: currentAmount === lastGivenRate ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                            title={`Click to apply last given rate: $${lastGivenRate.toFixed(2)}`}
                          >
                            <CheckCircle2 size={12} />
                            Last Given: ${lastGivenRate.toFixed(2)}
                          </button>
                        )}

                        {/* Client Proposed Rate Tag */}
                        <button
                          type="button"
                          onClick={() => setPaymentPerTask(clientRate.toString())}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            border: currentAmount === clientRate ? '1.5px solid #3b82f6' : '1px solid rgba(59, 130, 246, 0.35)',
                            background: currentAmount === clientRate ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.08)',
                            color: '#3b82f6',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: currentAmount === clientRate ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                          title={`Click to apply client proposed rate: $${clientRate.toFixed(2)}`}
                        >
                          Client Rate: ${clientRate.toFixed(2)}
                        </button>

                        {/* Standard Quick Price Chips */}
                        {[0.20, 0.30, 0.50, 1.00, 2.00].map(amt => {
                          if (amt === lastGivenRate || amt === clientRate) return null;
                          const isSelected = currentAmount === amt;
                          return (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setPaymentPerTask(amt.toString())}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '5px 9px',
                                borderRadius: '8px',
                                border: isSelected ? '1.5px solid #0066FF' : '1px solid var(--border-subtle)',
                                background: isSelected ? 'rgba(0, 102, 255, 0.12)' : 'var(--bg-elevated)',
                                color: isSelected ? '#0066FF' : 'var(--text-secondary)',
                                fontSize: '11.5px',
                                fontWeight: isSelected ? 700 : 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              ${amt.toFixed(2)}
                            </button>
                          );
                        })}
                      </div>

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={paymentPerTask}
                        onChange={e => setPaymentPerTask(e.target.value)}
                        placeholder="0.00"
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: '10px',
                          border: '1.5px solid rgba(59, 130, 246, 0.35)',
                          background: 'rgba(59, 130, 246, 0.05)',
                          color: 'var(--text-primary)', fontSize: '15px', fontWeight: 700, outline: 'none'
                        }}
                      />
                      {paymentPerTask && !isNaN(parseFloat(paymentPerTask)) && (
                        <div style={{
                          marginTop: '8px', fontSize: '12px', fontWeight: 600,
                          color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                          <DollarSign size={13} />
                          Total payout: ${(parseFloat(paymentPerTask || '0') * selectedCampaign.task_count).toFixed(2)}
                          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                            ({selectedCampaign.task_count} tasks × ${parseFloat(paymentPerTask || '0').toFixed(2)})
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Admin Notes */}
              <div style={{ marginBottom: '4px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Admin Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Any notes about this approval..."
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)', fontSize: '13px', outline: 'none', resize: 'none'
                  }}
                />
              </div>
            </div>

            {/* Fixed Footer */}
            <div style={{
              padding: '14px 24px 18px', borderTop: '1px solid var(--border-subtle)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                This will create {selectedCampaign.task_count} individual tasks
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  style={{
                    padding: '9px 16px', borderRadius: '8px',
                    border: '1px solid var(--border-subtle)', background: 'transparent',
                    color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  style={{
                    padding: '9px 20px', borderRadius: '8px',
                    border: 'none', background: '#22c55e', color: '#fff',
                    fontSize: '13px', fontWeight: 700, cursor: isProcessing ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 3px 10px rgba(34, 197, 94, 0.25)',
                    opacity: isProcessing ? 0.7 : 1
                  }}
                >
                  {isProcessing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                  Approve & Create Tasks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: Reject Campaign */}
      {/* ================================================================ */}
      {isRejectModalOpen && selectedCampaign && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-primary)', border: '1px solid var(--border-medium)',
            borderRadius: '20px', width: '100%', maxWidth: '480px',
            padding: '24px', boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.15s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <AlertTriangle size={18} color="#ef4444" />
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Reject Campaign
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  &quot;{selectedCampaign.name}&quot; by {selectedCampaign.users?.full_name || 'Brand Client'}
                </p>
              </div>
              <button
                onClick={() => { setIsRejectModalOpen(false); setSelectedCampaign(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Rejection Reason
              </label>
              {['Campaign does not meet platform guidelines.', 'Insufficient budget for requested tasks.', 'Content policy violation or inappropriate topic.'].map(reason => (
                <label key={reason} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px', borderRadius: '8px',
                  border: rejectReason === reason ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                  background: rejectReason === reason ? 'rgba(239, 68, 68, 0.06)' : 'var(--bg-elevated)',
                  marginBottom: '6px', cursor: 'pointer', fontSize: '13px',
                  fontWeight: 600, color: 'var(--text-primary)'
                }}>
                  <input type="radio" checked={rejectReason === reason} onChange={() => setRejectReason(reason)} />
                  {reason}
                </label>
              ))}

              <textarea
                rows={2}
                placeholder="Or write a custom reason..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)', fontSize: '13px', outline: 'none', resize: 'none', marginTop: '8px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setIsRejectModalOpen(false); setSelectedCampaign(null); }}
                style={{
                  padding: '9px 16px', borderRadius: '8px',
                  border: '1px solid var(--border-subtle)', background: 'transparent',
                  color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                style={{
                  padding: '9px 18px', borderRadius: '8px',
                  border: 'none', background: '#ef4444', color: '#fff',
                  fontSize: '13px', fontWeight: 700, cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  opacity: isProcessing ? 0.7 : 1
                }}
              >
                {isProcessing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={14} />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
