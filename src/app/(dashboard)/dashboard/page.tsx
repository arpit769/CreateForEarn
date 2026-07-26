'use client';

import { useMemo } from 'react';
import StatsCard from '@/components/StatsCard';
import { AreaChart, Gauge } from '@/components/Charts';
import {
  subredditStats,
  activityFeed,
  topPosts,
  generateDailyStats,
  timeAgo,
} from '@/data/mockData';

const activityIcons: Record<string, string> = {
  post: '',
  comment: '',
  report: '',
  ban: '',
  approve: '',
  remove: '',
  join: '',
};

const activityColors: Record<string, string> = {
  post: 'var(--accent-blue)',
  comment: 'var(--accent-cyan)',
  report: 'var(--accent-orange)',
  ban: 'var(--accent-red)',
  approve: 'var(--accent-green)',
  remove: 'var(--accent-red)',
  join: 'var(--accent-purple)',
};

export default function DashboardPage() {
  const engagementData = useMemo(() => generateDailyStats(30), []);
  const sparkline1 = useMemo(() => Array.from({ length: 14 }, () => Math.floor(Math.random() * 50 + 450)), []);
  const sparkline2 = useMemo(() => Array.from({ length: 14 }, () => Math.floor(Math.random() * 1000 + 3000)), []);
  const sparkline3 = useMemo(() => Array.from({ length: 14 }, () => Math.floor(Math.random() * 50 + 100)), []);
  const sparkline4 = useMemo(() => Array.from({ length: 14 }, () => Math.floor(Math.random() * 10 + 15)), []);

  return (
    <div className="page-enter">
      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <StatsCard
          icon=""
          label="Subscribers"
          value={subredditStats.subscribers}
          trend={subredditStats.subscriberGrowth}
          color="purple"
          sparklineData={sparkline1}
          delay={0}
        />
        <StatsCard
          icon=""
          label="Active Now"
          value={subredditStats.activeUsers}
          color="green"
          sparklineData={sparkline2}
          delay={80}
        />
        <StatsCard
          icon=""
          label="Posts Today"
          value={subredditStats.postsToday}
          trend={8.3}
          color="cyan"
          sparklineData={sparkline3}
          delay={160}
        />
        <StatsCard
          icon=""
          label="Mod Queue"
          value={subredditStats.modQueueCount}
          color="red"
          sparklineData={sparkline4}
          delay={240}
        />
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '20px',
        marginBottom: '24px',
      }}>
        {/* Engagement Chart */}
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Engagement Overview</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Posts & comments — last 30 days</p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ffffff' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Posts</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#a3a3a3' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Comments</span>
              </div>
            </div>
          </div>
          <AreaChart data={engagementData} height={240} />
        </div>

        {/* Right Column — Health Score + Quick Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Health Score */}
          <div className="glass-card-static" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', alignSelf: 'flex-start' }}>Community Health</h3>
            <Gauge value={subredditStats.healthScore} label="Health Score" size={150} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', marginTop: '16px' }}>
              <div style={{ textAlign: 'center', padding: '10px', background: 'var(--bg-elevated)', borderRadius: '10px' }}>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#34d399' }}>{subredditStats.engagementRate}%</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Engagement</p>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: 'var(--bg-elevated)', borderRadius: '10px' }}>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#22d3ee' }}>{subredditStats.reportsCount}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Open Reports</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card-static" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { icon: '', label: 'Review Mod Queue', desc: '23 items pending', color: 'var(--accent-red)' },
                { icon: '', label: 'Schedule a Post', desc: '5 scheduled this week', color: 'var(--accent-cyan)' },
                { icon: '', label: 'View Full Analytics', desc: 'Last updated 2m ago', color: 'var(--accent-purple)' },
                { icon: '', label: 'Configure AutoMod', desc: '8 rules active', color: 'var(--accent-green)' },
              ].map((action) => (
                <div
                  key={action.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: '18px' }}>{action.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600 }}>{action.label}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{action.desc}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid — Activity Feed + Top Posts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
      }}>
        {/* Activity Feed */}
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Recent Activity</h3>
            <span className="badge badge-green">Live</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '350px', overflow: 'auto' }}>
            {activityFeed.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 8px',
                  borderRadius: '8px',
                  transition: 'background 0.15s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: `${activityColors[item.type]}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  flexShrink: 0,
                }}>
                  {activityIcons[item.type]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 600, color: activityColors[item.type] }}>{item.user}</span>
                    {' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{item.description}</span>
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{timeAgo(item.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Posts */}
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Top Posts</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>This week</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {topPosts.map((post, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 8px',
                  borderRadius: '8px',
                  transition: 'background 0.15s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Rank */}
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: index < 3 ? 'rgba(255, 255, 255, 0.15)' : 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: index < 3 ? '#a855f7' : 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  {index + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {post.title}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>u/{post.author}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{post.createdAt}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#a855f7' }}>⬆ {post.score.toLocaleString()}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{post.comments} comments</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
