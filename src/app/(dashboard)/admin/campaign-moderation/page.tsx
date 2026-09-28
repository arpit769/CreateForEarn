'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone, CheckCircle2, XCircle, Search, Filter,
  Eye, Check, X, AlertTriangle, Loader2, Clock,
  DollarSign, Users, Layers, ArrowRight, ShieldCheck,
  ChevronDown, ChevronUp, Sparkles, FileText, Hash,
  ExternalLink, Send, Ban
} from 'lucide-react';
import { getAllCampaignsForAdmin, approveCampaignAndCreateTasks, rejectCampaign } from '@/actions/campaigns';
import { PlatformLogo } from '@/components/common/PlatformLogo';

type PlatformKey = 'reddit' | 'youtube' | 'x' | 'instagram' | 'linkedin' | 'quora';
type TaskActionKey = 'post' | 'comment' | 'upvote' | 'reshare' | 'follow';

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
  users?: { full_name: string; email: string };
}

const PLATFORM_LABELS: Record<PlatformKey, string> = {
  reddit: 'Reddit', youtube: 'YouTube', x: 'X (Twitter)',
  instagram: 'Instagram', linkedin: 'LinkedIn', quora: 'Quora',
};

const ACTION_LABELS: Record<TaskActionKey, string> = {
  post: 'Post / Video', comment: 'Comments', upvote: 'Upvote / Like',
  reshare: 'Reshare / Repost', follow: 'Follow / Subscribe',
};

export default function AdminCampaignModerationPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await getAllCampaignsForAdmin();
      if (res.campaigns) {
        setCampaigns(res.campaigns as Campaign[]);
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
    setPaymentPerTask(campaign.unit_rate.toString());
    setAdminNotes('');
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
      const res = await approveCampaignAndCreateTasks(selectedCampaign.id, amount, adminNotes);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`Campaign approved! ${res.tasksCreated} individual tasks created at $${amount.toFixed(2)} each.`);
        setCampaigns(prev => prev.map(c =>
          c.id === selectedCampaign.id
            ? { ...c, status: 'approved' as const, tasks_created: res.tasksCreated || 0, admin_notes: adminNotes, reviewed_at: new Date().toISOString() }
            : c
        ));
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
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>Rate / Task</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6' }}>
                      ${Number(campaign.unit_rate).toFixed(2)}
                    </div>
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
                  <div style={{ marginBottom: '10px', fontSize: '12px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Target URL: </span>
                    <a href={campaign.target_url} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      {campaign.target_url.length > 60 ? campaign.target_url.substring(0, 60) + '...' : campaign.target_url}
                      <ExternalLink size={11} />
                    </a>
                  </div>
                )}

                {/* Instructions */}
                {campaign.instructions && (
                  <div style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    borderRadius: '8px', padding: '10px 12px', marginBottom: '10px',
                    fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5
                  }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Instructions: </span>
                    {campaign.instructions}
                  </div>
                )}

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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
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
                </div>

                {selectedCampaign.target_url && (
                  <div style={{ marginTop: '10px', fontSize: '12px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>URL: </span>
                    <a href={selectedCampaign.target_url} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#3b82f6', textDecoration: 'none' }}>
                      {selectedCampaign.target_url.length > 50 ? selectedCampaign.target_url.substring(0, 50) + '...' : selectedCampaign.target_url}
                    </a>
                  </div>
                )}

                {selectedCampaign.instructions && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 700 }}>Instructions: </span>{selectedCampaign.instructions}
                  </div>
                )}
              </div>

              {/* Payment Per Task */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Payment Amount Per Task ($)
                </label>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                  This is the amount each worker will earn for completing one individual task. Client&apos;s proposed rate: ${Number(selectedCampaign.unit_rate).toFixed(2)}
                </p>
                <input
                  type="number"
                  min="0.50"
                  step="0.50"
                  value={paymentPerTask}
                  onChange={e => setPaymentPerTask(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1.5px solid rgba(59, 130, 246, 0.3)',
                    background: 'rgba(59, 130, 246, 0.05)',
                    color: 'var(--text-primary)', fontSize: '15px', fontWeight: 700, outline: 'none'
                  }}
                />
                {paymentPerTask && (
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
