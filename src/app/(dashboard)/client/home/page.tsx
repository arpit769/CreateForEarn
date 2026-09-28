'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, ArrowUp, ArrowUpRight, MoreVertical, Wallet, 
  ClipboardList, Users, BarChart2, CheckCircle2, 
  ExternalLink, Sparkles, X as CloseIcon, Check, 
  ShieldCheck, HelpCircle, Send, DollarSign, Eye, PlaySquare, Filter,
  Lock, Sliders, Info
} from 'lucide-react';
import { getClientTaskRates } from '@/actions/users';
import { submitClientCampaign, getClientCampaigns } from '@/actions/campaigns';
import { ClientTaskRates, DEFAULT_TASK_RATES, TaskRateItem } from '@/types/task-rates';
import { PlatformLogo } from '@/components/common/PlatformLogo';

interface CampaignItem {
  id: string;
  name: string;
  platform: 'x' | 'instagram' | 'linkedin' | 'quora' | 'reddit' | 'youtube';
  taskType?: 'post' | 'comment' | 'upvote' | 'reshare' | 'follow';
  tasks: number;
  submissions: number;
  spent: number;
  status: 'Active' | 'Completed' | 'Draft' | 'Paused' | 'Pending Review' | 'Rejected';
  createdOn: string;
}

const INITIAL_CAMPAIGNS: CampaignItem[] = [];

type PlatformKey = 'x' | 'instagram' | 'linkedin' | 'quora' | 'reddit' | 'youtube';
type TaskActionKey = 'post' | 'comment' | 'upvote' | 'reshare' | 'follow';

const ACTION_LABELS: Record<TaskActionKey, { name: string; desc: string }> = {
  post: { name: 'Post / Video / Question', desc: 'Publish a new post, video, or discussion thread' },
  comment: { name: 'Comments / Replies', desc: 'Write organic engagement and discussion comments' },
  upvote: { name: 'Upvote / Like', desc: 'Upvote or like post content for higher algorithmic rank' },
  reshare: { name: 'Reshare / Repost', desc: 'Share or retweet content to reach wider audience feeds' },
  follow: { name: 'Follow / Subscribe', desc: 'Follow brand profile, join community or subscribe to channel' },
};

export default function ClientDashboardPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(INITIAL_CAMPAIGNS);
  const [isCampaignsLoading, setIsCampaignsLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Task Rates assigned by Admin
  const [taskRates, setTaskRates] = useState<ClientTaskRates>(DEFAULT_TASK_RATES);
  const [ratePlatformTab, setRatePlatformTab] = useState<PlatformKey>('reddit');

  // Modals state
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Wallet stats state
  const [walletBalance, setWalletBalance] = useState(650.00);
  const [totalSpent, setTotalSpent] = useState(1650.00);
  const [pendingAmount, setPendingAmount] = useState(120.00);

  // New task form state
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPlatform, setNewTaskPlatform] = useState<PlatformKey>('reddit');
  const [newTaskAction, setNewTaskAction] = useState<TaskActionKey>('post');
  const [newTaskCount, setNewTaskCount] = useState('25');
  const [newTaskLink, setNewTaskLink] = useState('');
  const [newTaskInstructions, setNewTaskInstructions] = useState('');

  // Top up form state
  const [topUpAmount, setTopUpAmount] = useState('100');
  const [topUpMethod, setTopUpMethod] = useState<'card' | 'crypto' | 'upi'>('card');

  // Load client's assigned task rates and campaigns on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [ratesRes, campaignsRes] = await Promise.all([
          getClientTaskRates(),
          getClientCampaigns()
        ]);
        if (ratesRes?.rates) {
          setTaskRates(ratesRes.rates);
        }
        if (campaignsRes?.campaigns) {
          const mapped: CampaignItem[] = campaignsRes.campaigns.map((c: any) => {
            const statusMap: Record<string, CampaignItem['status']> = {
              'pending_review': 'Pending Review',
              'approved': 'Active',
              'rejected': 'Rejected',
              'partially_approved': 'Active',
            };
            return {
              id: c.id,
              name: c.name,
              platform: c.platform,
              taskType: c.task_type,
              tasks: c.task_count,
              submissions: c.tasks_created || 0,
              spent: Number(c.total_budget),
              status: statusMap[c.status] || 'Pending Review',
              createdOn: new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            };
          });
          setCampaigns(mapped);
        }
      } catch (err) {
        console.warn('Error loading dashboard data:', err);
      } finally {
        setIsCampaignsLoading(false);
      }
    }
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Calculate current unit rate and total budget based on locked admin assignment
  const currentUnitRate = taskRates[newTaskPlatform]?.[newTaskAction] ?? DEFAULT_TASK_RATES[newTaskPlatform]?.[newTaskAction] ?? 10;
  const countVal = Math.max(1, parseInt(newTaskCount) || 1);
  const calculatedBudget = countVal * currentUnitRate;

  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    if (isSubmittingCampaign) return;

    if (calculatedBudget > walletBalance) {
      showToast('Insufficient wallet balance. Please top up your wallet first.');
      return;
    }

    setIsSubmittingCampaign(true);
    try {
      const res = await submitClientCampaign({
        name: newTaskName,
        platform: newTaskPlatform,
        taskType: newTaskAction,
        taskCount: countVal,
        unitRate: currentUnitRate,
        totalBudget: calculatedBudget,
        targetUrl: newTaskLink || undefined,
        instructions: newTaskInstructions || undefined,
      });

      if (res.error) {
        showToast(`Failed: ${res.error}`);
        return;
      }

      const newCamp: CampaignItem = {
        id: `camp-${Date.now()}`,
        name: newTaskName,
        platform: newTaskPlatform,
        taskType: newTaskAction,
        tasks: countVal,
        submissions: 0,
        spent: calculatedBudget,
        status: 'Pending Review',
        createdOn: 'Just now',
      };

      setCampaigns([newCamp, ...campaigns]);
      setIsCreateTaskOpen(false);
      setNewTaskName('');
      setNewTaskLink('');
      setNewTaskInstructions('');
      showToast(`Campaign "${newTaskName}" submitted for admin review!`);
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Failed to submit campaign'}`);
    } finally {
      setIsSubmittingCampaign(false);
    }
  };

  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    const addVal = parseFloat(topUpAmount) || 0;
    if (addVal > 0) {
      setWalletBalance(prev => prev + addVal);
      setIsTopUpOpen(false);
      showToast(`$${addVal.toFixed(2)} added to your wallet!`);
    }
  };

  // Platform Icon Component using authentic official SVGs
  const renderPlatformBadge = (platform: PlatformKey, size = 26) => {
    return <PlatformLogo platform={platform} size={size} />;
  };

  return (
    <div style={{ padding: '4px 0 36px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: 600,
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={18} color="#22c55e" />
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '26px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '4px',
            lineHeight: 1.2
          }}>
            Welcome back, Brand Partner!
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            margin: 0,
            fontWeight: 500
          }}>
            Launch campaigns with guaranteed real creator engagement across top platforms.
          </p>
        </div>

        {/* Primary CTA Button */}
        <button
          onClick={() => setIsCreateTaskOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#0066FF',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '11px 22px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 102, 255, 0.25)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#0052cc';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#0066FF';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          Create New Task
        </button>
      </div>

      {/* 4 Stat Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '18px',
        marginBottom: '28px'
      }}>
        {/* Total Campaigns */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ClipboardList size={22} strokeWidth={2.2} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Active Campaigns
            </span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '10px' }}>
            {campaigns.filter(c => c.status === 'Active').length}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#10b981' }}>
            <ArrowUp size={13} strokeWidth={3} />
            <span>High Engagement Rate</span>
          </div>
        </div>

        {/* Total Submissions */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={22} strokeWidth={2.2} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Completed Submissions
            </span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '10px' }}>
            {campaigns.reduce((acc, c) => acc + c.submissions, 0).toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#10b981' }}>
            <ArrowUp size={13} strokeWidth={3} />
            <span>98% Verified Authentic</span>
          </div>
        </div>

        {/* Total Spent */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.12)',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wallet size={22} strokeWidth={2.2} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Total Budget Deployed
            </span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '10px' }}>
            ${totalSpent.toFixed(2)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#10b981' }}>
            <ArrowUp size={13} strokeWidth={3} />
            <span>100% Escrow Protected</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart2 size={22} strokeWidth={2.2} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Task Completion Rate
            </span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '10px' }}>
            96.4%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#10b981' }}>
            <ArrowUp size={13} strokeWidth={3} />
            <span>Fast Turnaround</span>
          </div>
        </div>
      </div>

      {/* Assigned Platform Rates Overview Banner */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1.5px solid rgba(59, 130, 246, 0.25)',
        borderRadius: '18px',
        padding: '20px 24px',
        marginBottom: '28px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={16} color="#3b82f6" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                My Assigned Platform Task Rates
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#22c55e',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                Admin Verified
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
              These are the unit prices assigned to your brand account for each platform action. All new tasks are created at these locked rates.
            </p>
          </div>

          {/* Platform Tab Switcher */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
            {(['reddit', 'youtube', 'x', 'instagram', 'linkedin', 'quora'] as PlatformKey[]).map(plt => {
              const isSelected = ratePlatformTab === plt;
              const labels: Record<PlatformKey, string> = {
                reddit: 'Reddit',
                youtube: 'YouTube',
                x: 'X',
                instagram: 'Instagram',
                linkedin: 'LinkedIn',
                quora: 'Quora'
              };
              return (
                <button
                  key={plt}
                  type="button"
                  onClick={() => setRatePlatformTab(plt)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid #0066FF' : '1px solid transparent',
                    background: isSelected ? 'rgba(0, 102, 255, 0.12)' : 'transparent',
                    color: isSelected ? '#0066FF' : 'var(--text-secondary)',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <PlatformLogo platform={plt} size={16} />
                  <span>{labels[plt]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rates Display Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px'
        }}>
          <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Post / Video</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>
              ${(taskRates[ratePlatformTab]?.post ?? 10).toFixed(2)}
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}> / task</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Comments</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>
              ${(taskRates[ratePlatformTab]?.comment ?? 5).toFixed(2)}
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}> / task</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Upvote / Like</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>
              ${(taskRates[ratePlatformTab]?.upvote ?? 1).toFixed(2)}
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}> / task</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Reshare / Repost</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>
              ${(taskRates[ratePlatformTab]?.reshare ?? 3).toFixed(2)}
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}> / task</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Follow / Join</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>
              ${(taskRates[ratePlatformTab]?.follow ?? 1).toFixed(2)}
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}> / task</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Recent Campaigns, Right Wallet + Quick Action */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 340px',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Recent Campaigns Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '18px',
          padding: '24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.02)'
        }}>
          {/* Card Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px'
          }}>
            <div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 4px 0',
                letterSpacing: '-0.01em'
              }}>
                Recent Campaigns
              </h2>
              <p style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                margin: 0
              }}>
                Your latest campaigns and their performance.
              </p>
            </div>

            <Link
              href="/client/campaigns"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#0066FF',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              View All
            </Link>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderBottom: '1px solid var(--border-subtle)'
                }}>
                  <th style={{ padding: '12px 14px 12px 4px', fontWeight: 600 }}>Campaign Name</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Platform</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Tasks</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Submissions</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Spent</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Created On</th>
                  <th style={{ padding: '12px 4px 12px 14px', textAlign: 'right', fontWeight: 600 }}></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((camp, idx) => (
                  <tr
                    key={camp.id}
                    style={{
                      borderBottom: idx === campaigns.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Campaign Name */}
                    <td style={{ padding: '16px 14px 16px 4px' }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        display: 'block'
                      }}>
                        {camp.name}
                      </span>
                    </td>

                    {/* Platform Badge */}
                    <td style={{ padding: '16px 14px' }}>
                      {renderPlatformBadge(camp.platform)}
                    </td>

                    {/* Tasks */}
                    <td style={{ padding: '16px 14px', fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {camp.tasks.toLocaleString()}
                    </td>

                    {/* Submissions */}
                    <td style={{ padding: '16px 14px', fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {camp.submissions.toLocaleString()}
                    </td>

                    {/* Spent */}
                    <td style={{ padding: '16px 14px', fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      ${camp.spent.toFixed(2)}
                    </td>

                    {/* Status Pill */}
                    <td style={{ padding: '16px 14px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: camp.status === 'Active' 
                          ? 'rgba(16, 185, 129, 0.12)' 
                          : camp.status === 'Pending Review'
                          ? 'rgba(245, 158, 11, 0.12)'
                          : camp.status === 'Rejected'
                          ? 'rgba(239, 68, 68, 0.12)'
                          : 'rgba(59, 130, 246, 0.12)',
                        color: camp.status === 'Active' ? '#10b981' 
                          : camp.status === 'Pending Review' ? '#f59e0b'
                          : camp.status === 'Rejected' ? '#ef4444'
                          : '#3b82f6'
                      }}>
                        {camp.status}
                      </span>
                    </td>

                    {/* Created On */}
                    <td style={{
                      padding: '16px 14px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap'
                    }}>
                      {camp.createdOn}
                    </td>

                    {/* Actions Menu */}
                    <td style={{ padding: '16px 4px 16px 14px', textAlign: 'right', position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === camp.id ? null : camp.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === camp.id && (
                        <div style={{
                          position: 'absolute',
                          right: '10px',
                          top: '40px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-medium)',
                          borderRadius: '10px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                          zIndex: 50,
                          padding: '6px',
                          minWidth: '140px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              showToast(`Viewing details for ${camp.name}`);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '8px 10px',
                              textAlign: 'left',
                              fontSize: '12px',
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              borderRadius: '6px'
                            }}
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setIsCreateTaskOpen(true);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '8px 10px',
                              textAlign: 'left',
                              fontSize: '12px',
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              borderRadius: '6px'
                            }}
                          >
                            Duplicate Task
                          </button>
                          <button
                            onClick={() => {
                              setCampaigns(campaigns.map(c => c.id === camp.id ? { ...c, status: c.status === 'Active' ? 'Completed' : 'Active' } : c));
                              setActiveMenuId(null);
                              showToast(`Campaign status updated!`);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '8px 10px',
                              textAlign: 'left',
                              fontSize: '12px',
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              borderRadius: '6px'
                            }}
                          >
                            Toggle Status
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Wallet Card + Promo Quick Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Wallet Balance Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '18px',
            padding: '24px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.02)'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Wallet size={18} strokeWidth={2.2} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Wallet Balance
                </span>
              </div>

              {/* Top Up Button */}
              <button
                onClick={() => setIsTopUpOpen(true)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Top Up
              </button>
            </div>

            {/* Big Amount */}
            <div style={{
              fontSize: '32px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '20px'
            }}>
              ${walletBalance.toFixed(2)}
            </div>

            {/* Breakdown List */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Spent</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${totalSpent.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Pending Escrow</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${pendingAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Available Balance</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${walletBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Quick Action / Promo Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '18px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.08)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '4px',
              padding: '10px 8px',
              marginBottom: '16px'
            }}>
              <div style={{ width: '6px', height: '14px', borderRadius: '3px', background: '#3b82f6' }} />
              <div style={{ width: '6px', height: '24px', borderRadius: '3px', background: '#0066FF' }} />
              <div style={{ width: '6px', height: '18px', borderRadius: '3px', background: '#60a5fa' }} />
            </div>

            <h3 style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 6px 0',
              lineHeight: 1.3
            }}>
              Grow your brand with authentic engagement
            </h3>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              margin: '0 0 18px 0',
              lineHeight: 1.4
            }}>
              Rates are pre-verified & fixed by admin for guaranteed quality.
            </p>

            <button
              onClick={() => setIsCreateTaskOpen(true)}
              style={{
                width: '100%',
                background: '#0066FF',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '11px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 12px rgba(0, 102, 255, 0.2)'
              }}
            >
              Create New Task
            </button>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: CREATE NEW TASK (WITH LOCKED ADMIN RATES) */}
      {/* ======================================================== */}
      {isCreateTaskOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-medium)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '580px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '26px',
            boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.15s ease-out'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Create New Campaign Task
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Select platform and task action. Unit price is fixed per admin assignment.
                </p>
              </div>
              <button
                onClick={() => setIsCreateTaskOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              {/* Select Platform */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  1. Select Platform
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {(['reddit', 'youtube', 'x', 'instagram', 'linkedin', 'quora'] as PlatformKey[]).map(plt => {
                    const isSelected = newTaskPlatform === plt;
                    const labels: Record<PlatformKey, string> = {
                      reddit: 'Reddit',
                      youtube: 'YouTube',
                      x: 'X',
                      instagram: 'Instagram',
                      linkedin: 'LinkedIn',
                      quora: 'Quora'
                    };
                    return (
                      <button
                        key={plt}
                        type="button"
                        onClick={() => setNewTaskPlatform(plt)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #0066FF' : '1px solid var(--border-subtle)',
                          background: isSelected ? 'rgba(0, 102, 255, 0.08)' : 'var(--bg-elevated)',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: isSelected ? '#0066FF' : 'var(--text-primary)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <PlatformLogo platform={plt} size={22} />
                        <span>{labels[plt]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Select Task Action Type */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  2. Select Task Action Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  {(['post', 'comment', 'upvote', 'reshare', 'follow'] as TaskActionKey[]).map(act => {
                    const isSel = newTaskAction === act;
                    const actRate = taskRates[newTaskPlatform]?.[act] ?? DEFAULT_TASK_RATES[newTaskPlatform]?.[act] ?? 10;
                    return (
                      <button
                        key={act}
                        type="button"
                        onClick={() => setNewTaskAction(act)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          padding: '9px 10px',
                          borderRadius: '10px',
                          border: isSel ? '2px solid #0066FF' : '1px solid var(--border-subtle)',
                          background: isSel ? 'rgba(0, 102, 255, 0.08)' : 'var(--bg-elevated)',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 700, color: isSel ? '#0066FF' : 'var(--text-primary)', textTransform: 'capitalize' }}>
                          {act === 'post' ? 'Post / Video' : act === 'comment' ? 'Comments' : act === 'upvote' ? 'Upvote / Like' : act === 'reshare' ? 'Reshare' : 'Follow'}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                          ${actRate.toFixed(2)} / task
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campaign Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Campaign Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Community Discussion & Launch Announcement"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Target Link */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Target Post / URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newTaskLink}
                  onChange={(e) => setNewTaskLink(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Tasks Count & LOCKED Budget Calculation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Number of Tasks
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={newTaskCount}
                    onChange={(e) => setNewTaskCount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Locked Budget Card */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Total Budget ($ USD)
                    </label>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Lock size={11} /> Locked Rate
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid rgba(59, 130, 246, 0.3)',
                    background: 'rgba(59, 130, 246, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#3b82f6' }}>
                      ${calculatedBudget.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      ({countVal} × ${currentUnitRate.toFixed(2)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Guidelines & Requirements for Creators
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide instructions for creators (e.g. Leave a constructive, genuine review mentioning our AI features)..."
                  value={newTaskInstructions}
                  onChange={(e) => setNewTaskInstructions(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
                <div style={{ marginRight: 'auto', fontSize: '12px', color: walletBalance < calculatedBudget ? '#ef4444' : 'var(--text-secondary)', fontWeight: 600 }}>
                  Wallet Balance: ${(walletBalance).toFixed(2)}
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateTaskOpen(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0066FF',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 102, 255, 0.25)'
                  }}
                >
                  {isSubmittingCampaign ? 'Submitting...' : `Submit for Review ($${calculatedBudget.toFixed(2)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TOP UP WALLET */}
      {/* ======================================================== */}
      {isTopUpOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-medium)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '440px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.15s ease-out'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Top Up Wallet
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Add funds to fuel your marketing campaigns.
                </p>
              </div>
              <button
                onClick={() => setIsTopUpOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleTopUp}>
              {/* Quick Preset Buttons */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Select Amount
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '10px' }}>
                  {['50', '100', '250', '500'].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt)}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: topUpAmount === amt ? '2px solid #0066FF' : '1px solid var(--border-subtle)',
                        background: topUpAmount === amt ? 'rgba(0, 102, 255, 0.08)' : 'var(--bg-elevated)',
                        color: topUpAmount === amt ? '#0066FF' : 'var(--text-primary)',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min="10"
                  step="5"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="Custom amount in USD"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Payment Method */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Payment Method
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: topUpMethod === 'card' ? '1.5px solid #0066FF' : '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)',
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <input type="radio" checked={topUpMethod === 'card'} onChange={() => setTopUpMethod('card')} />
                      <span>Credit / Debit Card (Stripe)</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Instant</span>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: topUpMethod === 'crypto' ? '1.5px solid #0066FF' : '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)',
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <input type="radio" checked={topUpMethod === 'crypto'} onChange={() => setTopUpMethod('crypto')} />
                      <span>Crypto (USDT / USDC / BTC)</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#10b981' }}>0% Fee</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsTopUpOpen(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0066FF',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 102, 255, 0.25)'
                  }}
                >
                  Confirm & Pay ${topUpAmount || '0'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

