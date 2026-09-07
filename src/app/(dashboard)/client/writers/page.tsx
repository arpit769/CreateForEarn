'use client';

import React, { useState } from 'react';
import { 
  Users, Search, Star, Award, CheckCircle2, 
  ExternalLink, Filter, ArrowUpRight, MessageSquare, ShieldCheck
} from 'lucide-react';

export default function ClientWritersPage() {
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const writers = [
    {
      id: 'w-1',
      name: 'Aman Verma',
      handle: 'u/aman_tech_pulse',
      avatarText: 'AV',
      platform: 'Reddit & TikTok',
      karma: '48.5K Karma',
      subscribers: '12.4K Subs',
      rating: 4.9,
      completedTasks: 142,
      approvalRate: '98%',
      niche: ['Tech', 'Gadgets', 'SaaS'],
      status: 'Available',
      badge: 'Top Creator'
    },
    {
      id: 'w-2',
      name: 'Neha Singh',
      handle: 'u/neha_writes_dev',
      avatarText: 'NS',
      platform: 'Reddit',
      karma: '92.1K Karma',
      subscribers: 'N/A',
      rating: 5.0,
      completedTasks: 215,
      approvalRate: '100%',
      niche: ['Productivity', 'Self-Help', 'Apps'],
      status: 'Available',
      badge: 'Elite Writer'
    },
    {
      id: 'w-3',
      name: 'Rahul Das',
      handle: '@rahul_tech_explains',
      avatarText: 'RD',
      platform: 'YouTube',
      karma: 'N/A',
      subscribers: '85.2K Subs',
      rating: 4.8,
      completedTasks: 78,
      approvalRate: '96%',
      niche: ['EdTech', 'Coding', 'Tutorials'],
      status: 'Busy',
      badge: 'Verified Creator'
    },
    {
      id: 'w-4',
      name: 'Pooja Sharma',
      handle: 'u/pooja_fin_insights',
      avatarText: 'PS',
      platform: 'Reddit & Twitter',
      karma: '34.8K Karma',
      subscribers: '18.9K Subs',
      rating: 4.7,
      completedTasks: 64,
      approvalRate: '95%',
      niche: ['Fintech', 'Crypto', 'Investments'],
      status: 'Available',
      badge: 'Rising Star'
    },
    {
      id: 'w-5',
      name: 'Vikram Malhotra',
      handle: '@vikram_vlogs',
      avatarText: 'VM',
      platform: 'Instagram & TikTok',
      karma: 'N/A',
      subscribers: '140K Subs',
      rating: 4.9,
      completedTasks: 92,
      approvalRate: '99%',
      niche: ['Lifestyle', 'Fitness', 'Wellness'],
      status: 'Available',
      badge: 'Top Creator'
    },
    {
      id: 'w-6',
      name: 'Kavita Reddy',
      handle: 'u/kavita_gaming_hub',
      avatarText: 'KR',
      platform: 'Reddit & YouTube',
      karma: '62.0K Karma',
      subscribers: '45.1K Subs',
      rating: 4.8,
      completedTasks: 110,
      approvalRate: '97%',
      niche: ['Gaming', 'Web3', 'AI Tools'],
      status: 'Available',
      badge: 'Verified Creator'
    }
  ];

  const filteredWriters = writers.filter(w => {
    if (filterPlatform !== 'all' && !w.platform.toLowerCase().includes(filterPlatform.toLowerCase())) return false;
    if (searchQuery && !w.name.toLowerCase().includes(searchQuery.toLowerCase()) && !w.handle.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: '8px 0 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Browse Creators & Writers
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Discover high-reputation community creators ready to promote your product.
          </p>
        </div>

        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          borderRadius: '10px',
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-medium)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          <ShieldCheck size={16} color="#10b981" /> Verified Talent Only
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '24px', 
        flexWrap: 'wrap',
        background: 'var(--bg-card)',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Platform Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'reddit', 'youtube', 'tiktok', 'instagram'].map(platform => (
            <button
              key={platform}
              onClick={() => setFilterPlatform(platform)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                background: filterPlatform === platform ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
                color: filterPlatform === platform ? '#7c3aed' : 'var(--text-secondary)',
                border: filterPlatform === platform ? '1px solid rgba(124, 58, 237, 0.25)' : '1px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              {platform}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 12px', width: '280px' }}>
          <Search size={14} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search by name, handle, or niche..." 
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

      {/* Writers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredWriters.map((writer) => (
          <div 
            key={writer.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              {/* Profile Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(59, 130, 246, 0.2))',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--text-primary)'
                }}>
                  {writer.avatarText}
                </div>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {writer.name}
                    </h3>
                    <CheckCircle2 size={15} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {writer.handle}
                  </div>
                </div>

                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  background: 'rgba(124, 58, 237, 0.1)',
                  color: '#7c3aed',
                  border: '1px solid rgba(124, 58, 237, 0.2)'
                }}>
                  {writer.badge}
                </span>
              </div>

              {/* Niches */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {writer.niche.map((tag, i) => (
                  <span key={i} style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stats 3-Col Box */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '12px', marginBottom: '18px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rating</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    <Star size={12} color="#f59e0b" fill="#f59e0b" /> {writer.rating}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tasks</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {writer.completedTasks}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Approval</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                    {writer.approvalRate}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
              <button style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}>
                <MessageSquare size={13} /> Invite
              </button>

              <button style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}>
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
