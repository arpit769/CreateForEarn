'use client';

import React, { useState } from 'react';
import { 
  Megaphone, Plus, Search, Filter, ArrowUpRight, 
  MoreVertical, Calendar, Eye, Users, PlaySquare, 
  CheckCircle2, Clock, AlertCircle, TrendingUp, Sparkles
} from 'lucide-react';

export default function ClientCampaignsPage() {
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const campaigns = [
    {
      id: 'camp-1',
      title: 'New Gadget Review & Unboxing',
      category: 'Tech Accessories',
      platform: 'TikTok',
      platformColor: '#000000',
      status: 'Active',
      statusColor: '#10b981',
      budget: '$850.00',
      spent: '$420.00',
      submissions: 28,
      targetSubmissions: 50,
      views: '45.2K',
      endDate: 'Jun 15, 2026',
      daysLeft: '8 days left'
    },
    {
      id: 'camp-2',
      title: 'Productivity Tips & Workflow Thread',
      category: 'SaaS / App Software',
      platform: 'Reddit',
      platformColor: '#ff4500',
      status: 'Active',
      statusColor: '#10b981',
      budget: '$600.00',
      spent: '$490.00',
      submissions: 42,
      targetSubmissions: 45,
      views: '87.1K',
      endDate: 'Jun 10, 2026',
      daysLeft: '3 days left'
    },
    {
      id: 'camp-3',
      title: 'Study Motivation & Focus Routine Video',
      category: 'EdTech / Learning',
      platform: 'YouTube',
      platformColor: '#ef4444',
      status: 'Active',
      statusColor: '#10b981',
      budget: '$1,200.00',
      spent: '$650.00',
      submissions: 15,
      targetSubmissions: 20,
      views: '32.6K',
      endDate: 'Jun 22, 2026',
      daysLeft: '15 days left'
    },
    {
      id: 'camp-4',
      title: 'Top AI Tools Discussion & Community AMA',
      category: 'Tech Startup',
      platform: 'Reddit',
      platformColor: '#ff4500',
      status: 'Active',
      statusColor: '#10b981',
      budget: '$500.00',
      spent: '$380.00',
      submissions: 31,
      targetSubmissions: 35,
      views: '56.3K',
      endDate: 'Jun 18, 2026',
      daysLeft: '11 days left'
    },
    {
      id: 'camp-5',
      title: 'Daily Fitness Routine Story / Reel',
      category: 'Fitness & Health',
      platform: 'Instagram',
      platformColor: '#e1306c',
      status: 'Completed',
      statusColor: '#6b7280',
      budget: '$450.00',
      spent: '$450.00',
      submissions: 30,
      targetSubmissions: 30,
      views: '64.9K',
      endDate: 'May 30, 2026',
      daysLeft: 'Ended'
    },
    {
      id: 'camp-6',
      title: 'Next-Gen Financial App Feature Spotlight',
      category: 'Fintech',
      platform: 'YouTube',
      platformColor: '#ef4444',
      status: 'Draft',
      statusColor: '#f59e0b',
      budget: '$1,500.00',
      spent: '$0.00',
      submissions: 0,
      targetSubmissions: 25,
      views: '0',
      endDate: 'Not scheduled',
      daysLeft: 'Draft'
    }
  ];

  const filteredCampaigns = campaigns.filter(c => {
    if (filterTab === 'active' && c.status !== 'Active') return false;
    if (filterTab === 'completed' && c.status !== 'Completed') return false;
    if (filterTab === 'draft' && c.status !== 'Draft') return false;
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase()) && !c.platform.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: '8px 0 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Campaign Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Create, track, and optimize your brand marketing campaigns.
          </p>
        </div>

        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          color: '#ffffff',
          border: 'none',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
          transition: 'transform 0.15s ease'
        }}>
          <Plus size={16} /> Create Campaign
        </button>
      </div>

      {/* Summary KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Total Campaigns</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>6</div>
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, marginTop: '4px' }}>4 Active now</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Allocated Budget</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>$5,100.00</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>$2,450.00 spent</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Total Submissions</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>146</div>
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, marginTop: '4px' }}>86% approval rate</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Total Reach</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>286.1K</div>
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, marginTop: '4px' }}>+24% vs last month</div>
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
          {(['all', 'active', 'completed', 'draft'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                background: filterTab === tab ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
                color: filterTab === tab ? '#7c3aed' : 'var(--text-secondary)',
                border: filterTab === tab ? '1px solid rgba(124, 58, 237, 0.25)' : '1px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              {tab}
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

      {/* Campaigns Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredCampaigns.map((camp) => {
          const progressPercent = Math.min(100, Math.round((camp.submissions / (camp.targetSubmissions || 1)) * 100));
          return (
            <div 
              key={camp.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
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
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      {camp.platform}
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: camp.statusColor,
                      background: `${camp.statusColor}15`
                    }}>
                      {camp.status}
                    </span>
                  </div>

                  <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                    <MoreVertical size={16} />
                  </button>
                </div>

                {/* Campaign Title & Category */}
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', lineHeight: 1.3 }}>
                  {camp.title}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                  {camp.category}
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Submissions</span>
                    <span style={{ color: 'var(--text-primary)' }}>{camp.submissions} / {camp.targetSubmissions}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: '#7c3aed', borderRadius: '3px' }} />
                  </div>
                </div>

                {/* Metrics 2-column */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px', marginBottom: '18px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Budget / Spent</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {camp.spent} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>/ {camp.budget}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Views</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {camp.views}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <Clock size={13} /> {camp.daysLeft}
                </div>

                <button style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  Manage <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
