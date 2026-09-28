'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Megaphone, Plus, Search, Filter, ArrowUpRight, 
  MoreVertical, Calendar, Eye, Users, PlaySquare, 
  CheckCircle2, Clock, AlertCircle, TrendingUp, Sparkles,
  Loader2, XCircle
} from 'lucide-react';
import { PlatformLogo } from '@/components/common/PlatformLogo';
import { getClientCampaigns } from '@/actions/campaigns';

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
}

export default function ClientCampaignsPage() {
  const [filterTab, setFilterTab] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredCampaigns.map((camp) => {
            const statusConfig = STATUS_CONFIG[camp.status] || STATUS_CONFIG.pending_review;
            const progressPercent = camp.task_count > 0 ? Math.min(100, Math.round((camp.tasks_created / camp.task_count) * 100)) : 0;
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
                  </div>

                  {/* Campaign Title */}
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', lineHeight: 1.3 }}>
                    {camp.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px', textTransform: 'capitalize' }}>
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
                      fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4
                    }}>
                      <span style={{ fontWeight: 700, color: camp.status === 'rejected' ? '#ef4444' : '#22c55e' }}>
                        {camp.status === 'rejected' ? 'Rejection Reason: ' : 'Admin: '}
                      </span>
                      {camp.admin_notes}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', marginTop: '6px' }}>
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
