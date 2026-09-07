'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Loader2, ArrowRight } from 'lucide-react';
import { getLeaderboard, LeaderboardUser } from '@/actions/leaderboard';
import Link from 'next/link';

type Timeframe = 1 | 7 | 30;

export default function LeaderboardWidget({ platform }: { platform: 'reddit' | 'youtube' }) {
  const [timeframe, setTimeframe] = useState<Timeframe>(7);
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      const res = await getLeaderboard(platform, timeframe, 5);
      if (isMounted) {
        if (!res.error) setUsers(res.users);
        setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [platform, timeframe]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={18} color="#fbbf24" />;
    if (rank === 2) return <Medal size={18} color="#94a3b8" />;
    if (rank === 3) return <Award size={18} color="#b45309" />;
    return <span style={{ width: '18px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>{rank}</span>;
  };

  return (
    <div style={{ 
      background: 'var(--bg-card)', 
      borderRadius: '16px', 
      border: '1px solid var(--border-subtle)', 
      padding: '24px', 
      marginBottom: '32px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={20} color="var(--accent-blue)" /> 
          Top Earners
        </h2>
        
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-subtle)' }}>
          {[
            { label: '24h', value: 1 },
            { label: '7d', value: 7 },
            { label: '30d', value: 30 }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setTimeframe(tab.value as Timeframe)}
              style={{
                background: timeframe === tab.value ? 'var(--bg-primary)' : 'transparent',
                color: timeframe === tab.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '13px',
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

      <div style={{ minHeight: '150px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
            <Loader2 size={24} className="animate-spin" color="var(--text-muted)" />
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            No top earners found for this timeframe.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {users.map((user) => (
              <div 
                key={user.user_id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px 16px', 
                  background: 'var(--bg-elevated)', 
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ width: '32px', display: 'flex', justifyContent: 'center', marginRight: '12px' }}>
                  {getRankIcon(user.rank)}
                </div>
                
                <div style={{ 
                  width: '36px', height: '36px', 
                  borderRadius: '50%', 
                  background: 'var(--accent-blue)', 
                  color: '#fff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 700,
                  fontSize: '14px',
                  marginRight: '16px'
                }}>
                  {(user.full_name || 'U').substring(0, 2).toUpperCase()}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{user.full_name || 'Unknown User'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{user.total_tasks} Tasks</div>
                </div>
                
                <div style={{ fontWeight: 700, color: '#10b981', fontSize: '15px' }}>
                  ${Number(user.total_earnings).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link 
          href={`/worker/leaderboard?platform=${platform}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--accent-blue)',
            fontWeight: 600,
            fontSize: '13px',
            textDecoration: 'none'
          }}
        >
          View Full Leaderboard <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
