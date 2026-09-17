'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Loader2, PlaySquare, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import { getLeaderboard, LeaderboardUser, LeaderboardPlatform } from '@/actions/leaderboard';

type Timeframe = 1 | 7 | 30;

const PLATFORM_TABS: { id: LeaderboardPlatform; name: string; suffix: string; icon: React.ReactNode; color: string; bg: string; border: string }[] = [
  {
    id: 'all',
    name: 'All',
    suffix: 'Platforms',
    icon: (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '18px', height: '18px', borderRadius: '5px',
        background: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed', flexShrink: 0
      }}>
        <Sparkles size={11} color="#7c3aed" />
      </span>
    ),
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.12)',
    border: 'rgba(124, 58, 237, 0.35)'
  },
  {
    id: 'reddit',
    name: 'Reddit',
    suffix: 'Tasks',
    icon: (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '18px', height: '18px', borderRadius: '5px',
        background: '#ff4500', color: '#fff', flexShrink: 0
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
        </svg>
      </span>
    ),
    color: '#ff4500',
    bg: 'rgba(255, 69, 0, 0.12)',
    border: 'rgba(255, 69, 0, 0.35)'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    suffix: 'Tasks',
    icon: (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '18px', height: '18px', borderRadius: '5px',
        background: '#ff0000', color: '#fff', flexShrink: 0
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      </span>
    ),
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.35)'
  },
  {
    id: 'x',
    name: 'X',
    suffix: 'Tasks',
    icon: (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '18px', height: '18px', borderRadius: '5px',
        background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', flexShrink: 0
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </span>
    ),
    color: 'var(--text-primary)',
    bg: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.25)'
  },
  {
    id: 'quora',
    name: 'Quora',
    suffix: 'Tasks',
    icon: (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '18px', height: '18px', borderRadius: '5px',
        background: '#b92b27', color: '#fff', fontSize: '11px', fontWeight: 900,
        fontFamily: 'serif, Georgia, "Times New Roman"', flexShrink: 0, lineHeight: 1
      }}>
        Q
      </span>
    ),
    color: '#b92b27',
    bg: 'rgba(185, 43, 39, 0.12)',
    border: 'rgba(185, 43, 39, 0.35)'
  }
];

export default function FullLeaderboard({ initialPlatform = 'all' }: { initialPlatform?: LeaderboardPlatform }) {
  const [platform, setPlatform] = useState<LeaderboardPlatform>(initialPlatform);
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
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>
          <Sparkles size={13} /> Global Rankings
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.5px' }}>
          <Trophy size={28} color="#eab308" />
          Top Earners Leaderboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
          Discover the highest-earning creators and workers across all social platforms.
        </p>
      </div>

      {/* Embedded Responsive Styles */}
      <style>{`
        .leaderboard-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 24px;
          padding: 12px 16px;
          background: var(--bg-card);
          border-radius: 16px;
          border: 1px solid var(--border-subtle);
          box-shadow: 0 2px 12px rgba(0,0,0,0.03);
        }
        .leaderboard-platforms-list {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .leaderboard-platform-btn {
          padding: 7px 13px;
          border-radius: 10px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .platform-tasks-suffix {
          display: inline;
        }
        .leaderboard-divider {
          display: none;
        }
        .leaderboard-timeframe-wrap {
          display: flex;
          align-items: center;
          background: var(--bg-elevated);
          border-radius: 10px;
          padding: 3px;
          border: 1px solid var(--border-subtle);
          gap: 2px;
        }
        .leaderboard-timeframe-btn {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .leaderboard-podium-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .leaderboard-table-card {
          background: var(--bg-card);
          border-radius: 16px;
          border: 1px solid var(--border-subtle);
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.04);
        }
        .leaderboard-table-scroll {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .leaderboard-table-header {
          display: grid;
          grid-template-columns: 60px 1fr 110px 120px;
          padding: 14px 20px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-subtle);
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          align-items: center;
        }
        .leaderboard-table-row {
          display: grid;
          grid-template-columns: 60px 1fr 110px 120px;
          padding: 14px 20px;
          border-bottom: 1px solid var(--border-subtle);
          align-items: center;
          transition: background 0.15s ease;
        }
        .leaderboard-table-row:last-child {
          border-bottom: none;
        }
        .leaderboard-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }
        .leaderboard-user-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 768px) {
          .leaderboard-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 12px;
          }
          .leaderboard-platforms-list {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 6px;
            width: 100%;
          }
          .leaderboard-platform-btn {
            padding: 6px 10px;
            font-size: 12px;
            gap: 5px;
          }
          .platform-tasks-suffix {
            display: none;
          }
          .leaderboard-divider {
            display: block;
            width: 100%;
            height: 1px;
            background: var(--border-subtle);
            margin: 2px 0;
          }
          .leaderboard-timeframe-wrap {
            width: 100%;
            display: flex;
            justify-content: space-between;
          }
          .leaderboard-timeframe-btn {
            flex: 1;
            text-align: center;
            padding: 6px 8px;
            font-size: 11px;
          }
        }

        @media (max-width: 640px) {
          .leaderboard-podium-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .leaderboard-table-header {
            grid-template-columns: 42px 1fr 68px 76px;
            padding: 12px 10px;
            font-size: 10px;
          }
          .leaderboard-table-row {
            grid-template-columns: 42px 1fr 68px 76px;
            padding: 12px 10px;
          }
          .leaderboard-avatar {
            width: 28px;
            height: 28px;
            font-size: 11px;
          }
          .leaderboard-user-name {
            font-size: 13px;
          }
        }
      `}</style>

      {/* Modern Filter Toolbar */}
      <div className="leaderboard-toolbar">
        {/* Social Platforms Switcher */}
        <div className="leaderboard-platforms-list">
          {PLATFORM_TABS.map(tab => {
            const isSelected = platform === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPlatform(tab.id)}
                className="leaderboard-platform-btn"
                style={{
                  background: isSelected ? tab.bg : 'var(--bg-elevated)',
                  color: isSelected ? tab.color : 'var(--text-secondary)',
                  border: isSelected ? `1px solid ${tab.border}` : '1px solid var(--border-subtle)',
                  fontWeight: isSelected ? 700 : 600,
                  boxShadow: isSelected ? `0 2px 10px ${tab.bg}` : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--bg-primary)';
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {tab.icon}
                <span style={{ fontWeight: 600 }}>{tab.name}</span>
                <span className="platform-tasks-suffix">&nbsp;{tab.suffix}</span>
              </button>
            );
          })}
        </div>

        {/* Subtle separator for mobile */}
        <div className="leaderboard-divider" />

        {/* Timeframe Toggle */}
        <div className="leaderboard-timeframe-wrap">
          {[
            { label: '24 Hours', value: 1 },
            { label: '7 Days', value: 7 },
            { label: '30 Days', value: 30 }
          ].map(tab => {
            const isSelected = timeframe === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setTimeframe(tab.value as Timeframe)}
                className="leaderboard-timeframe-btn"
                style={{
                  background: isSelected ? 'var(--bg-primary)' : 'transparent',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: isSelected ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  fontWeight: isSelected ? 700 : 500,
                  boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {!loading && top3.length > 0 && (
        <div className="leaderboard-podium-grid">
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
                  padding: '18px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isFirst ? '0 8px 30px rgba(251, 191, 36, 0.12)' : 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: accentColor,
                      color: '#000',
                      fontWeight: 800,
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: `0 4px 12px ${bgGlow}`
                    }}>
                      {(topUser.full_name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {topUser.full_name || 'Anonymous User'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {topUser.total_tasks} tasks completed
                      </div>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {getRankBadge(topUser.rank)}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Payout</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>
                    ${Number(topUser.total_earnings).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Leaderboard Table */}
      <div className="leaderboard-table-card">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '280px', gap: '12px' }}>
            <Loader2 size={32} className="animate-spin" color="var(--accent-blue)" />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Loading {PLATFORM_TABS.find(t => t.id === platform)?.name || 'platform'} rankings...
            </span>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
            <Trophy size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No Leaderboard Data Yet</h3>
            <p style={{ fontSize: '14px', margin: 0 }}>
              No completed tasks recorded for {PLATFORM_TABS.find(t => t.id === platform)?.name || 'this platform'} in the selected timeframe.
            </p>
          </div>
        ) : (
          <div className="leaderboard-table-scroll">
            <div className="leaderboard-table-header">
              <div style={{ textAlign: 'center' }}>Rank</div>
              <div>Writer / Creator</div>
              <div style={{ textAlign: 'center' }}>Tasks Done</div>
              <div style={{ textAlign: 'right' }}>Earnings</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {users.map((user) => (
                <div 
                  key={user.user_id}
                  className="leaderboard-table-row"
                  style={{ 
                    background: user.rank <= 3 ? `rgba(124, 58, 237, ${0.04 - (user.rank * 0.008)})` : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {getRankBadge(user.rank)}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div 
                      className="leaderboard-avatar"
                      style={{ 
                        background: user.rank === 1 ? '#fbbf24' : user.rank === 2 ? '#94a3b8' : user.rank === 3 ? '#d97706' : 'var(--bg-elevated)', 
                        color: user.rank <= 3 ? '#000' : 'var(--text-primary)', 
                        border: user.rank > 3 ? '1px solid var(--border-medium)' : 'none',
                      }}
                    >
                      {(user.full_name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div className="leaderboard-user-name">
                        {user.full_name || 'Anonymous User'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px' }}>
                    {user.total_tasks}
                  </div>
                  
                  <div style={{ textAlign: 'right', fontWeight: 700, color: '#10b981', fontSize: '14px', whiteSpace: 'nowrap' }}>
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
