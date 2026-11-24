'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Megaphone, Plus, Search, Filter, ArrowUpRight, 
  MoreVertical, Calendar, Eye, Users, PlaySquare, 
  CheckCircle2, Clock, AlertCircle, TrendingUp, Sparkles,
  Loader2, XCircle, ExternalLink, X, Image as ImageIcon
} from 'lucide-react';
import { PlatformLogo } from '@/components/common/PlatformLogo';
import { getClientCampaigns, getClientSubmissions } from '@/actions/campaigns';

type PlatformKey = 'reddit' | 'youtube' | 'x' | 'instagram' | 'linkedin' | 'quora';

const PLATFORM_LABELS: Record<string, string> = {
  reddit: 'Reddit', youtube: 'YouTube', x: 'X (Twitter)',
  instagram: 'Instagram', linkedin: 'LinkedIn', quora: 'Quora',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending_review: { label: 'Pending Review', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  approved: { label: 'Active', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  partially_approved: { label: 'Partial', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
};

interface CampaignData {
  id: string;
  name: string;
  platform: PlatformKey;
  task_type: string;
  task_count: number;
  unit_rate: number;
  total_budget: number;
  target_url?: string;
  instructions?: string;
  status: string;
  admin_notes?: string;
  tasks_created: number;
  created_at: string;
  reviewed_at?: string;
  completed_submissions_count?: number;
  pending_submissions_count?: number;
  total_submissions_count?: number;
}

export default function ClientCampaignsPage() {
  const [filterTab, setFilterTab] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Submissions Modal State
  const [selectedCampaignForSubmissions, setSelectedCampaignForSubmissions] = useState<CampaignData | null>(null);
  const [modalSubmissions, setModalSubmissions] = useState<any[]>([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [zoomScreenshot, setZoomScreenshot] = useState<string | null>(null);

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const res = await getClientCampaigns();
        if (res.campaigns) {
          setCampaigns(res.campaigns as CampaignData[]);
        }
      } catch (err) {
        console.error('Error loading campaigns:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCampaigns();
  }, []);

  const handleOpenSubmissionsModal = async (camp: CampaignData) => {
    setSelectedCampaignForSubmissions(camp);
    setIsModalLoading(true);
    setModalSubmissions([]);
    try {
      const res = await getClientSubmissions(camp.id);
      if (res.submissions) {
        setModalSubmissions(res.submissions);
      }
    } catch (err) {
      console.error('Error fetching submissions for modal:', err);
    } finally {
      setIsModalLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (filterTab !== 'all' && c.status !== filterTab) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.platform.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const pendingCount = campaigns.filter(c => c.status === 'pending_review').length;
  const approvedCount = campaigns.filter(c => c.status === 'approved').length;
  const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.total_budget), 0);
  const totalTasks = campaigns.reduce((sum, c) => sum + c.tasks_created, 0);

  return (
    <div style={{ padding: '8px 0 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Campaign Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Create, track, and manage your brand marketing campaigns.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/client/submissions" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '10px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}>
              <CheckCircle2 size={16} color="#10b981" /> View All Submissions
            </button>
          </Link>

          <Link href="/client/home" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              background: '#0066FF',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 102, 255, 0.25)',
              transition: 'transform 0.15s ease'
            }}>
              <Plus size={16} /> Create Campaign
            </button>
          </Link>
        </div>
      </div>

      {/* Summary KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Total Campaigns</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{campaigns.length}</div>
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, marginTop: '4px' }}>{approvedCount} Approved</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Pending Review</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{pendingCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Awaiting admin approval</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Total Budget</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>${totalBudget.toFixed(2)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Across all campaigns</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Tasks Created</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{totalTasks}</div>
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, marginTop: '4px' }}>By admin approval</div>
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
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {([
            { key: 'all' as const, label: 'All' },
            { key: 'pending_review' as const, label: 'Pending' },
            { key: 'approved' as const, label: 'Approved' },
            { key: 'rejected' as const, label: 'Rejected' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: filterTab === tab.key ? 'rgba(0, 102, 255, 0.12)' : 'transparent',
                color: filterTab === tab.key ? '#0066FF' : 'var(--text-secondary)',
                border: filterTab === tab.key ? '1px solid rgba(0, 102, 255, 0.25)' : '1px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 12px', width: '260px' }}>
          <Search size={14} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search campaigns..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              color: 'var(--text-primary)',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px', fontSize: '14px' }}>Loading your campaigns...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px',
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: '16px'
        }}>
          <Megaphone size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            No campaigns yet
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 18px 0' }}>
            Create your first campaign and it will be reviewed by our admin team.
          </p>
          <Link href="/client/home" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '10px 20px', borderRadius: '10px',
              background: '#0066FF', color: '#fff', border: 'none',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 102, 255, 0.25)'
            }}>
              <Plus size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Create Your First Campaign
            </button>
          </Link>
        </div>
      ) : (
        /* Campaigns Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredCampaigns.map((camp) => {
            const statusConfig = STATUS_CONFIG[camp.status] || STATUS_CONFIG.pending_review;
            const progressPercent = camp.task_count > 0 ? Math.min(100, Math.round((camp.tasks_created / camp.task_count) * 100)) : 0;
            const isApproved = camp.status === 'approved';
            const completedCount = camp.completed_submissions_count || 0;
            const pendingSubCount = camp.pending_submissions_count || 0;

            return (
              <div 
                key={camp.id}
                style={{
                  background: 'var(--bg-card)',
                  border: camp.status === 'pending_review' ? '1.5px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Card Top */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <PlatformLogo platform={camp.platform} size={14} />
                        {PLATFORM_LABELS[camp.platform] || camp.platform}
                      </span>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: statusConfig.color,
                        background: statusConfig.bg
                      }}>
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Submissions Pill Badge for Approved Campaign */}
                    {isApproved && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: completedCount > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 102, 255, 0.1)',
                        color: completedCount > 0 ? '#10b981' : '#0066FF',
                        border: `1px solid ${completedCount > 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0, 102, 255, 0.2)'}`
                      }}>
                        {completedCount > 0 ? `✓ ${completedCount} Done` : 'Awaiting Proof'}
                      </span>
                    )}
                  </div>

                  {/* Campaign Title */}
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', lineHeight: 1.3 }}>
                    {camp.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'capitalize' }}>
                    {camp.task_type.replace('_', ' ')} • {camp.task_count} tasks requested
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Tasks Created</span>
                      <span style={{ color: 'var(--text-primary)' }}>{camp.tasks_created} / {camp.task_count}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressPercent}%`, height: '100%', background: statusConfig.color, borderRadius: '3px', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rate / Task</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6', marginTop: '2px' }}>
                        ${Number(camp.unit_rate).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Budget</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                        ${Number(camp.total_budget).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Admin Notes / Rejection Reason */}
                  {camp.admin_notes && (
                    <div style={{
                      background: camp.status === 'rejected' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(34, 197, 94, 0.06)',
                      border: `1px solid ${camp.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
                      borderRadius: '8px', padding: '8px 10px',
                      fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4,
                      marginBottom: '10px'
                    }}>
                      <span style={{ fontWeight: 700, color: camp.status === 'rejected' ? '#ef4444' : '#22c55e' }}>
                        {camp.status === 'rejected' ? 'Rejection Reason: ' : 'Admin: '}
                      </span>
                      {camp.admin_notes}
                    </div>
                  )}

                  {/* View Submissions Button for Approved Campaigns */}
                  {isApproved && (
                    <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                      <button
                        onClick={() => handleOpenSubmissionsModal(camp)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '9px 14px',
                          borderRadius: '10px',
                          background: completedCount > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 102, 255, 0.08)',
                          color: completedCount > 0 ? '#10b981' : '#0066FF',
                          border: `1.5px solid ${completedCount > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(0, 102, 255, 0.25)'}`,
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Users size={15} />
                        <span>View Submissions ({completedCount} Approved{pendingSubCount > 0 ? ` • ${pendingSubCount} In Review` : ''})</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <Clock size={13} />
                    {new Date(camp.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                  </div>

                  {camp.status === 'pending_review' && (
                    <span style={{
                      fontSize: '11px', fontWeight: 700, color: '#f59e0b',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      <Clock size={12} /> Awaiting Admin Review
                    </span>
                  )}

                  {isApproved && (
                    <Link
                      href={`/client/submissions?campaignId=${camp.id}`}
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontWeight: 600
                      }}
                    >
                      All Proofs <ArrowUpRight size={12} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Campaign Submissions Quick Modal */}
      {selectedCampaignForSubmissions && (
        <div 
          onClick={() => setSelectedCampaignForSubmissions(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '720px',
              maxHeight: '88vh',
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <PlatformLogo platform={selectedCampaignForSubmissions.platform} size={20} />
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedCampaignForSubmissions.name}
                  </h2>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Deliverables completed by creators for this campaign
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link 
                  href={`/client/submissions?campaignId=${selectedCampaignForSubmissions.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <button style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 102, 255, 0.1)',
                    color: '#0066FF',
                    border: '1px solid rgba(0, 102, 255, 0.25)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}>
                    Full Page <ExternalLink size={11} />
                  </button>
                </Link>
                <button
                  onClick={() => setSelectedCampaignForSubmissions(null)}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '6px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(88vh - 140px)' }}>
              {isModalLoading ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                  <Loader2 size={26} style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: '10px', fontSize: '13px' }}>Loading creator deliverables...</p>
                </div>
              ) : modalSubmissions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 16px',
                  background: 'var(--bg-elevated)',
                  borderRadius: '14px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <Users size={36} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                    No Submissions Yet
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 auto', maxWidth: '380px', lineHeight: 1.5 }}>
                    Tasks for this campaign are active in the creator workforce. As soon as workers complete the task and submit proof, their verified social accounts and live links will appear here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {modalSubmissions.map((sub: any) => {
                    const isApproved = sub.status === 'approved';
                    const isPending = sub.status === 'submitted';
                    const taskId = sub.task?.custom_id || (sub.task as any)?.task_seq_id ? `Task ${sub.task?.custom_id || (sub.task as any)?.task_seq_id}` : 'Task';

                    return (
                      <div
                        key={sub.id}
                        style={{
                          background: 'var(--bg-elevated)',
                          border: isApproved ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)',
                          borderRadius: '14px',
                          padding: '16px'
                        }}
                      >
                        {/* Sub Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: 'var(--bg-card)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-subtle)'
                            }}>
                              {taskId}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Submitted {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'recently'}
                            </span>
                          </div>

                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: isApproved ? 'rgba(16, 185, 129, 0.12)' : isPending ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: isApproved ? '#10b981' : isPending ? '#f59e0b' : '#ef4444',
                          }}>
                            {isApproved ? 'Approved by Admin' : isPending ? 'Under Admin Review' : 'Rejected'}
                          </span>
                        </div>

                        {/* Creator Profile Box */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: 'var(--bg-card)',
                          marginBottom: '10px'
                        }}>
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Creator Account:</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {sub.worker_handle}
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
                                gap: '3px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                color: '#0066FF',
                                textDecoration: 'none'
                              }}
                            >
                              Profile <ExternalLink size={11} />
                            </a>
                          )}
                        </div>

                        {/* Live Post Link */}
                        {sub.live_proof_url && (
                          <div style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                              Live Post Link:
                            </div>
                            <a
                              href={sub.live_proof_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: 'rgba(0, 102, 255, 0.05)',
                                border: '1px solid rgba(0, 102, 255, 0.2)',
                                color: '#0066FF',
                                fontSize: '12px',
                                fontWeight: 600,
                                textDecoration: 'none'
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {sub.live_proof_url}
                              </span>
                              <ExternalLink size={12} style={{ flexShrink: 0 }} />
                            </a>
                          </div>
                        )}

                        {/* Screenshot Thumbnail */}
                        {sub.screenshot_url && (
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                              Screenshot Proof:
                            </div>
                            <div 
                              onClick={() => setZoomScreenshot(sub.screenshot_url)}
                              style={{
                                width: '120px',
                                height: '70px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '1px solid var(--border-subtle)',
                                cursor: 'pointer',
                                position: 'relative'
                              }}
                            >
                              <img
                                src={sub.screenshot_url}
                                alt="Proof Screenshot"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Zoom Screenshot Modal */}
      {zoomScreenshot && (
        <div 
          onClick={() => setZoomScreenshot(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(5px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button
                onClick={() => setZoomScreenshot(null)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>
            <img
              src={zoomScreenshot}
              alt="Zoomed Screenshot"
              style={{ maxWidth: '100%', maxHeight: 'calc(90vh - 80px)', borderRadius: '8px', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
