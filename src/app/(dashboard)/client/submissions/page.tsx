'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, Search, CheckCircle2, XCircle, Clock, 
  ExternalLink, Eye, Users, Filter, Sparkles,
  ArrowUpRight, AlertCircle, Image as ImageIcon, Loader2, X
} from 'lucide-react';
import { PlatformLogo } from '@/components/common/PlatformLogo';
import { getClientSubmissions, getClientCampaigns } from '@/actions/campaigns';

interface SubmissionItem {
  id: string;
  task_id: string;
  user_id: string;
  status: 'submitted' | 'approved' | 'rejected';
  proof_url?: string | null;
  reddit_url?: string | null;
  live_proof_url?: string | null;
  screenshot_url?: string | null;
  bonus_amount?: number;
  admin_notes?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  worker_handle: string;
  worker_profile_url?: string | null;
  campaign?: {
    id: string;
    name: string;
    platform: string;
    task_type: string;
    unit_rate: number;
    status: string;
  } | null;
  task?: {
    id: string;
    title: string;
    task_type: string;
    platform: string;
    custom_id?: string | null;
    instructions?: string;
    payment_amount: number;
  } | null;
}

interface CampaignOption {
  id: string;
  name: string;
  platform: string;
  task_type: string;
}

function ClientSubmissionsContent() {
  const searchParams = useSearchParams();
  const initialCampaignId = searchParams.get('campaignId') || 'all';

  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(initialCampaignId);
  const [activeFilter, setActiveFilter] = useState<'all' | 'approved' | 'submitted' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Sync selected campaign if URL param changes
  useEffect(() => {
    const cid = searchParams.get('campaignId');
    if (cid) setSelectedCampaignId(cid);
  }, [searchParams]);

  // Load campaigns for dropdown and submissions
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [campsRes, subsRes] = await Promise.all([
          getClientCampaigns(),
          getClientSubmissions(selectedCampaignId === 'all' ? undefined : selectedCampaignId)
        ]);

        if (campsRes.campaigns) {
          setCampaigns(campsRes.campaigns as CampaignOption[]);
        }
        if (subsRes.submissions) {
          setSubmissions(subsRes.submissions as SubmissionItem[]);
        }
      } catch (err) {
        console.error('Error loading submissions data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [selectedCampaignId]);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      // Status filter
      if (activeFilter !== 'all' && sub.status !== activeFilter) return false;

      // Campaign filter (in case local filtering is desired)
      if (selectedCampaignId !== 'all' && sub.campaign?.id !== selectedCampaignId && sub.task?.id !== selectedCampaignId) {
        // Already handled by server fetch, but ensures local sync
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const handle = (sub.worker_handle || '').toLowerCase();
        const campName = (sub.campaign?.name || '').toLowerCase();
        const taskId = (sub.task?.custom_id || '').toLowerCase();
        const liveUrl = (sub.live_proof_url || sub.proof_url || sub.reddit_url || '').toLowerCase();
        const taskTitle = (sub.task?.title || '').toLowerCase();

        return handle.includes(query) ||
          campName.includes(query) ||
          taskId.includes(query) ||
          liveUrl.includes(query) ||
          taskTitle.includes(query);
      }

      return true;
    });
  }, [submissions, activeFilter, selectedCampaignId, searchQuery]);

  // Stats calculation
  const totalCount = submissions.length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const pendingCount = submissions.filter(s => s.status === 'submitted').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;
  const uniqueCreatorsCount = new Set(submissions.map(s => s.worker_handle)).size;

  return (
    <div style={{ padding: '8px 0 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Task Deliverables & Submissions
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              background: 'rgba(0, 102, 255, 0.1)',
              color: '#0066FF',
              border: '1px solid rgba(0, 102, 255, 0.2)'
            }}>
              <Sparkles size={11} /> Verified Proofs
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Inspect creators who completed your tasks, verify live post links, and view submitted screenshots.
          </p>
        </div>

        <Link href="/client/campaigns" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            borderRadius: '10px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}>
            ← Back to Campaigns
          </button>
        </Link>
      </div>

      {/* KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Total Submissions</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{totalCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Across all tasks</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Approved Deliverables</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{approvedCount}</div>
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, marginTop: '4px' }}>Verified & Accepted</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Under Review</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{pendingCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Admin checking quality</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Creators Reached</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#8b5cf6' }}>{uniqueCreatorsCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Unique active workers</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '20px', 
        flexWrap: 'wrap',
        background: 'var(--bg-card)',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {([
            { key: 'all' as const, label: 'All', count: totalCount },
            { key: 'approved' as const, label: 'Approved', count: approvedCount },
            { key: 'submitted' as const, label: 'Under Review', count: pendingCount },
            { key: 'rejected' as const, label: 'Rejected', count: rejectedCount },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeFilter === tab.key ? 'rgba(0, 102, 255, 0.12)' : 'transparent',
                color: activeFilter === tab.key ? '#0066FF' : 'var(--text-secondary)',
                border: activeFilter === tab.key ? '1px solid rgba(0, 102, 255, 0.25)' : '1px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: '10.5px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: activeFilter === tab.key ? '#0066FF' : 'var(--bg-elevated)',
                color: activeFilter === tab.key ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 700
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Campaign Dropdown and Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {campaigns.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Campaign:</span>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '12.5px',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Campaigns ({campaigns.length})</option>
                {campaigns.map(camp => (
                  <option key={camp.id} value={camp.id}>
                    {camp.name} ({camp.platform})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 12px', minWidth: '220px' }}>
            <Search size={14} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search creator, task ID, link..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '12.5px',
                color: 'var(--text-primary)',
                width: '100%'
              }}
            />
          </div>
        </div>
      </div>

      {/* Submissions Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px', fontSize: '14px' }}>Loading campaign deliverables...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: '16px'
        }}>
          <FileText size={38} color="var(--text-muted)" style={{ marginBottom: '12px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            {submissions.length === 0 ? 'No Deliverables Yet' : 'No Submissions Found'}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 auto 20px', maxWidth: '440px', lineHeight: 1.5 }}>
            {submissions.length === 0 
              ? 'Your campaign tasks are active! When creators complete tasks and submit proof, their verified social accounts and live links will appear here.'
              : 'No deliverables match the selected filter or search keyword. Try clearing filters or search.'}
          </p>
          {submissions.length > 0 && (
            <button
              onClick={() => { setActiveFilter('all'); setSearchQuery(''); setSelectedCampaignId('all'); }}
              style={{
                padding: '8px 16px', borderRadius: '8px',
                background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        /* Deliverables Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
          {filteredSubmissions.map((sub) => {
            const platform = (sub.task?.platform || sub.campaign?.platform || 'reddit').toLowerCase();
            const taskId = sub.task?.custom_id || (sub.task as any)?.task_seq_id ? `Task ${sub.task?.custom_id || (sub.task as any)?.task_seq_id}` : 'Task';
            const isApproved = sub.status === 'approved';
            const isPending = sub.status === 'submitted';
            const isRejected = sub.status === 'rejected';

            return (
              <div
                key={sub.id}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '16px',
                  border: isApproved 
                    ? '1.5px solid rgba(16, 185, 129, 0.3)' 
                    : isPending 
                    ? '1.5px solid rgba(245, 158, 11, 0.3)' 
                    : '1px solid var(--border-subtle)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <div>
                  {/* Card Header: Platform, Task ID & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <PlatformLogo platform={platform} size={20} />
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        {taskId}
                      </span>
                      {sub.campaign?.name && (
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sub.campaign.name}>
                          {sub.campaign.name}
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: isApproved ? 'rgba(16, 185, 129, 0.12)' : isPending ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: isApproved ? '#10b981' : isPending ? '#f59e0b' : '#ef4444',
                      border: `1px solid ${isApproved ? 'rgba(16, 185, 129, 0.25)' : isPending ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
                    }}>
                      {isApproved && <CheckCircle2 size={12} />}
                      {isPending && <Clock size={12} />}
                      {isRejected && <XCircle size={12} />}
                      {isApproved ? 'Approved' : isPending ? 'Under Review' : 'Rejected'}
                    </span>
                  </div>

                  {/* Creator Identity Box */}
                  <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: 'rgba(0, 102, 255, 0.12)',
                        color: '#0066FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '13px',
                        flexShrink: 0
                      }}>
                        {sub.worker_handle?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Completed By Creator:</div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sub.worker_handle}
                        </div>
                      </div>
                    </div>

                    {sub.worker_profile_url && (
                      <a
                        href={sub.worker_profile_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          background: 'rgba(0, 102, 255, 0.08)',
                          color: '#0066FF',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          textDecoration: 'none',
                          border: '1px solid rgba(0, 102, 255, 0.18)',
                          flexShrink: 0,
                          transition: 'background 0.15s ease'
                        }}
                      >
                        Profile <ExternalLink size={11} />
                      </a>
                    )}
                  </div>

                  {/* Live Proof URL Section */}
                  {sub.live_proof_url ? (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                        Live Post / Deliverable Link:
                      </div>
                      <a
                        href={sub.live_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          background: 'rgba(0, 102, 255, 0.06)',
                          border: '1px solid rgba(0, 102, 255, 0.2)',
                          color: '#0066FF',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          textDecoration: 'none',
                          wordBreak: 'break-all'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sub.live_proof_url}
                        </span>
                        <ExternalLink size={13} style={{ flexShrink: 0 }} />
                      </a>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '14px', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No live link submitted (action task)
                    </div>
                  )}

                  {/* Screenshot Proof Section */}
                  {sub.screenshot_url && (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Screenshot Proof:
                        </span>
                        <a
                          href={sub.screenshot_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '11px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                        >
                          Open Original <ExternalLink size={10} />
                        </a>
                      </div>

                      <div 
                        onClick={() => setPreviewImage(sub.screenshot_url || null)}
                        style={{
                          position: 'relative',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          maxHeight: '140px',
                          background: '#0a0a0a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={sub.screenshot_url}
                          alt="Deliverable Screenshot Proof"
                          style={{ width: '100%', maxHeight: '140px', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
                        >
                          <Eye size={15} /> Click to zoom
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rejection Note if rejected */}
                  {isRejected && sub.admin_notes && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      fontSize: '11.5px',
                      color: '#ef4444',
                      marginBottom: '10px'
                    }}>
                      <strong>Admin note:</strong> {sub.admin_notes}
                    </div>
                  )}
                </div>

                {/* Card Footer: Timestamps */}
                <div style={{
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  color: 'var(--text-muted)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    {sub.submitted_at 
                      ? new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Recent'}
                  </div>

                  {isApproved && (
                    <span style={{ color: '#10b981', fontWeight: 600 }}>
                      Verified by Admin
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Screenshot Zoom Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Screenshot Proof Preview
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <a
                  href={previewImage}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '12px',
                    color: '#0066FF',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600
                  }}
                >
                  Open in New Tab <ExternalLink size={12} />
                </a>
                <button
                  onClick={() => setPreviewImage(null)}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div style={{ overflow: 'auto', maxHeight: 'calc(90vh - 80px)', textAlign: 'center' }}>
              <img
                src={previewImage}
                alt="Enlarged Deliverable Screenshot"
                style={{ maxWidth: '100%', maxHeight: 'calc(90vh - 100px)', borderRadius: '8px', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientSubmissionsPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '12px', fontSize: '14px' }}>Loading campaign deliverables...</p>
      </div>
    }>
      <ClientSubmissionsContent />
    </Suspense>
  );
}
