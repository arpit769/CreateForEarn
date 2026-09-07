'use client';

import React, { useState } from 'react';
import { 
  FileText, Search, CheckCircle, XCircle, Clock, 
  ExternalLink, Eye, Check, X, ShieldAlert, Sparkles
} from 'lucide-react';

export default function ClientSubmissionsPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const submissions = [
    {
      id: 'sub-101',
      writerName: 'Aman Verma',
      writerHandle: 'u/aman_tech_pulse',
      campaign: 'New Gadget Review & Unboxing',
      platform: 'TikTok',
      link: 'https://tiktok.com/@aman_tech/video/123456789',
      submittedAt: '2 hours ago',
      date: 'May 18, 2026',
      qualityScore: 94,
      views: '14.8K',
      status: 'pending',
      amount: '$35.00'
    },
    {
      id: 'sub-102',
      writerName: 'Neha Singh',
      writerHandle: 'u/neha_writes_dev',
      campaign: 'Productivity Tips & Workflow Thread',
      platform: 'Reddit',
      link: 'https://reddit.com/r/productivity/comments/xyz123',
      submittedAt: '5 hours ago',
      date: 'May 18, 2026',
      qualityScore: 98,
      views: '8.2K',
      status: 'approved',
      amount: '$25.00'
    },
    {
      id: 'sub-103',
      writerName: 'Rahul Das',
      writerHandle: '@rahul_tech_explains',
      campaign: 'Study Motivation & Focus Routine Video',
      platform: 'YouTube',
      link: 'https://youtube.com/watch?v=mockytvideo',
      submittedAt: '1 day ago',
      date: 'May 17, 2026',
      qualityScore: 91,
      views: '22.4K',
      status: 'approved',
      amount: '$60.00'
    },
    {
      id: 'sub-104',
      writerName: 'Kavita Reddy',
      writerHandle: 'u/kavita_gaming_hub',
      campaign: 'Top AI Tools Discussion & Community AMA',
      platform: 'Reddit',
      link: 'https://reddit.com/r/ArtificialInteligence/comments/abc789',
      submittedAt: '2 days ago',
      date: 'May 16, 2026',
      qualityScore: 68,
      views: '1.2K',
      status: 'rejected',
      amount: '$25.00'
    },
    {
      id: 'sub-105',
      writerName: 'Pooja Sharma',
      writerHandle: 'u/pooja_fin_insights',
      campaign: 'Next-Gen Financial App Feature Spotlight',
      platform: 'Reddit',
      link: 'https://reddit.com/r/personalfinance/comments/def456',
      submittedAt: '3 days ago',
      date: 'May 15, 2026',
      qualityScore: 95,
      views: '34.5K',
      status: 'approved',
      amount: '$40.00'
    }
  ];

  const filteredSubmissions = submissions.filter(s => {
    if (activeFilter !== 'all' && s.status !== activeFilter) return false;
    if (searchQuery && !s.writerName.toLowerCase().includes(searchQuery.toLowerCase()) && !s.campaign.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: '8px 0 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Writer Submissions
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Review, verify live links, and approve campaign deliverables from creators.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            Auto-Approve Passed Rules
          </button>
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
        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                background: activeFilter === tab ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
                color: activeFilter === tab ? '#7c3aed' : 'var(--text-secondary)',
                border: activeFilter === tab ? '1px solid rgba(124, 58, 237, 0.25)' : '1px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 12px', width: '280px' }}>
          <Search size={14} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search writer or campaign..." 
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

      {/* Submissions Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Creator</th>
              <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Campaign</th>
              <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Live URL</th>
              <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Quality Score</th>
              <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Views</th>
              <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Payout</th>
              <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Status</th>
              <th style={{ paddingBottom: '12px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map((sub, i) => (
              <tr key={sub.id} style={{ borderBottom: i === filteredSubmissions.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>
                {/* Creator */}
                <td style={{ padding: '16px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
                      {sub.writerName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{sub.writerName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub.writerHandle}</div>
                    </div>
                  </div>
                </td>

                {/* Campaign */}
                <td style={{ padding: '16px 0', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sub.campaign}
                </td>

                {/* Link */}
                <td style={{ padding: '16px 0' }}>
                  <a 
                    href={sub.link} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-blue)', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
                  >
                    View Post <ExternalLink size={12} />
                  </a>
                </td>

                {/* Quality Score */}
                <td style={{ padding: '16px 0' }}>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    color: sub.qualityScore >= 90 ? '#10b981' : sub.qualityScore >= 75 ? '#f59e0b' : '#ef4444' 
                  }}>
                    {sub.qualityScore} / 100
                  </span>
                </td>

                {/* Views */}
                <td style={{ padding: '16px 0', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {sub.views}
                </td>

                {/* Payout */}
                <td style={{ padding: '16px 0', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {sub.amount}
                </td>

                {/* Status */}
                <td style={{ padding: '16px 0' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    background: sub.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : sub.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: sub.status === 'approved' ? '#10b981' : sub.status === 'pending' ? '#f59e0b' : '#ef4444'
                  }}>
                    {sub.status}
                  </span>
                </td>

                {/* Actions */}
                <td style={{ padding: '16px 0', textAlign: 'right' }}>
                  {sub.status === 'pending' ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Check size={12} /> Approve
                      </button>
                      <button style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <X size={12} /> Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
