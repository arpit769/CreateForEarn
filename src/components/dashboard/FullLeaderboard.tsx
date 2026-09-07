'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Loader2, PlaySquare, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import { getLeaderboard, LeaderboardUser } from '@/actions/leaderboard';

type Timeframe = 1 | 7 | 30;
type Platform = 'reddit' | 'youtube';

export default function FullLeaderboard({ initialPlatform = 'reddit' }: { initialPlatform?: Platform }) {
  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [timeframe, setTimeframe] = useState<Timeframe>(30);
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      // Fetch up to 50 users for the full leaderboard
      const res = await getLeaderboard(platform, timeframe, 50);
      if (isMounted) {
        if (!res.error) setUsers(res.users);
        setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [platform, timeframe]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }}>
          <Trophy size={18} />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' }}>
          <Medal size={18} />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(217, 119, 6, 0.15)', color: '#d97706' }}>
          <Award size={18} />
        </div>
      );
    }
    return <span style={{ width: '32px', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', fontSize: '14px' }}>#{rank}</span>;
  };

  const top3 = users.slice(0, 3);

  return (
    <div className="dashboard-content-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>
            <Sparkles size={13} /> Global Rankings
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={28} color="#eab308" />
            Top Earners Leaderboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Discover the highest-earning creators and workers across all social platforms.
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
          {/* Social Platforms Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border-medium)', gap: '4px' }}>
            <button
              onClick={() => setPlatform('reddit')}
              style={{
                background: platform === 'reddit' ? 'rgba(255, 69, 0, 0.12)' : 'transparent',
                color: platform === 'reddit' ? '#ff4500' : 'var(--text-secondary)',
                border: platform === 'reddit' ? '1px solid rgba(255, 69, 0, 0.3)' : '1px solid transparent',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <img 
                src="https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-57x57.png" 
                alt="Reddit" 
                style={{ width: '15px', height: '15px' }} 
              />
              Reddit Tasks
            </button>
            <button
              onClick={() => setPlatform('youtube')}
              style={{
                background: platform === 'youtube' ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                color: platform === 'youtube' ? '#ef4444' : 'var(--text-secondary)',
                border: platform === 'youtube' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <PlaySquare size={16} color="#ef4444" />
              YouTube Tasks
            </button>
          </div>

          {/* Timeframe Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '3px', border: '1px solid var(--border-subtle)', gap: '2px' }}>
            {[
              { label: '24 Hours', value: 1 },
              { label: '7 Days', value: 7 },
              { label: '30 Days', value: 30 }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setTimeframe(tab.value as Timeframe)}
                style={{
                  background: timeframe === tab.value ? 'var(--bg-primary)' : 'transparent',
                  color: timeframe === tab.value ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: timeframe === tab.value ? '1px solid var(--border-subtle)' : 'none',
                  padding: '6px 14px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {!loading && top3.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {top3.map((topUser) => {
            const isFirst = topUser.rank === 1;
            const isSecond = topUser.rank === 2;
            const isThird = topUser.rank === 3;
            const accentColor = isFirst ? '#fbbf24' : isSecond ? '#94a3b8' : '#d97706';
            const bgGlow = isFirst ? 'rgba(251, 191, 36, 0.08)' : isSecond ? 'rgba(148, 163, 184, 0.08)' : 'rgba(217, 119, 6, 0.08)';

            return (
              <div
                key={topUser.user_id}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${isFirst ? 'rgba(251, 191, 36, 0.4)' : 'var(--border-subtle)'}`,
                  borderRadius: '16px',
                  padding: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isFirst ? '0 8px 30px rgba(251, 191, 36, 0.12)' : 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: accentColor,
                      color: '#000',
                      fontWeight: 800,
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 12px ${bgGlow}`
                    }}>
                      {(topUser.full_name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>
                        {topUser.full_name || 'Anonymous User'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {topUser.total_tasks} tasks completed
                      </div>
                    </div>
                  </div>
                  {getRankBadge(topUser.rank)}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Payout</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>
                    ${Number(topUser.total_earnings).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Leaderboard Table */}
      <div style={{ 
        background: 'var(--bg-card)', 
        borderRadius: '16px', 
        border: '1px solid var(--border-subtle)', 
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
      }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '300px', gap: '12px' }}>
            <Loader2 size={32} className="animate-spin" color="var(--accent-blue)" />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading {platform} rankings...</span>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
            <Trophy size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No Leaderboard Data Yet</h3>
            <p style={{ fontSize: '14px' }}>No completed tasks recorded for {platform === 'reddit' ? 'Reddit' : 'YouTube'} in the selected timeframe.</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 140px 140px', padding: '16px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <div style={{ textAlign: 'center' }}>Rank</div>
              <div>Writer / Creator</div>
              <div style={{ textAlign: 'center' }}>Tasks Done</div>
              <div style={{ textAlign: 'right' }}>Earnings</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {users.map((user, index) => (
                <div 
                  key={user.user_id}
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '70px 1fr 140px 140px', 
                    padding: '16px 24px', 
                    borderBottom: index !== users.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    alignItems: 'center',
                    background: user.rank <= 3 ? `rgba(124, 58, 237, ${0.04 - (user.rank * 0.008)})` : 'transparent',
                    transition: 'background 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {getRankBadge(user.rank)}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ 
                      width: '36px', height: '36px', 
                      borderRadius: '50%', 
                      background: user.rank === 1 ? '#fbbf24' : user.rank === 2 ? '#94a3b8' : user.rank === 3 ? '#d97706' : 'var(--bg-elevated)', 
                      color: user.rank <= 3 ? '#000' : 'var(--text-primary)', 
                      border: user.rank > 3 ? '1px solid var(--border-medium)' : 'none',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 700,
                      fontSize: '14px'
                    }}>
                      {(user.full_name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                        {user.full_name || 'Anonymous User'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px' }}>
                    {user.total_tasks}
                  </div>
                  
                  <div style={{ textAlign: 'right', fontWeight: 700, color: '#10b981', fontSize: '15px' }}>
                    ${Number(user.total_earnings).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
