'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Loader2, ExternalLink } from 'lucide-react';
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

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={24} color="#fbbf24" />;
    if (rank === 2) return <Medal size={24} color="#94a3b8" />;
    if (rank === 3) return <Award size={24} color="#b45309" />;
    return <span style={{ width: '24px', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', fontSize: '16px' }}>{rank}</span>;
  };

  return (
    <div className="dashboard-content-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={28} color="var(--accent-blue)" />
            Top Earners
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            See who's leading the charts in tasks completed and earnings.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Platform Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setPlatform('reddit')}
              style={{
                background: platform === 'reddit' ? 'var(--bg-primary)' : 'transparent',
                color: platform === 'reddit' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              Reddit
            </button>
            <button
              onClick={() => setPlatform('youtube')}
              style={{
                background: platform === 'youtube' ? 'var(--bg-primary)' : 'transparent',
                color: platform === 'youtube' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              YouTube
            </button>
          </div>

          {/* Timeframe Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border-subtle)' }}>
            {[
              { label: 'Last 24 Hours', value: 1 },
              { label: 'Last 7 Days', value: 7 },
              { label: 'Last 30 Days', value: 30 }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setTimeframe(tab.value as Timeframe)}
                style={{
                  background: timeframe === tab.value ? 'var(--bg-primary)' : 'transparent',
                  color: timeframe === tab.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ 
        background: 'var(--bg-card)', 
        borderRadius: '16px', 
        border: '1px solid var(--border-subtle)', 
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <Loader2 size={32} className="animate-spin" color="var(--text-muted)" />
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
            <Trophy size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No Data Available</h3>
            <p style={{ fontSize: '15px' }}>No users have earned rewards for {platform} in this timeframe.</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 120px', padding: '16px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <div style={{ textAlign: 'center' }}>Rank</div>
              <div>Writer / Creator</div>
              <div style={{ textAlign: 'center' }}>Tasks</div>
              <div style={{ textAlign: 'right' }}>Earnings</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {users.map((user, index) => (
                <div 
                  key={user.user_id}
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '80px 1fr 120px 120px', 
                    padding: '20px 24px', 
                    borderBottom: index !== users.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    alignItems: 'center',
                    background: user.rank <= 3 ? `rgba(59, 130, 246, ${0.05 - (user.rank * 0.01)})` : 'transparent',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {getRankIcon(user.rank)}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      width: '40px', height: '40px', 
                      borderRadius: '50%', 
                      background: user.rank === 1 ? '#fbbf24' : user.rank === 2 ? '#94a3b8' : user.rank === 3 ? '#b45309' : 'var(--bg-elevated)', 
                      color: user.rank <= 3 ? '#fff' : 'var(--text-primary)', 
                      border: user.rank > 3 ? '1px solid var(--border-medium)' : 'none',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 700,
                      fontSize: '16px'
                    }}>
                      {(user.full_name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>{user.full_name || 'Unknown User'}</div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px' }}>
                    {user.total_tasks}
                  </div>
                  
                  <div style={{ textAlign: 'right', fontWeight: 700, color: '#10b981', fontSize: '16px' }}>
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
