'use client';

import { useMemo } from 'react';
import StatsCard from '@/components/StatsCard';
import { AreaChart, BarChart, DonutChart, HeatMap } from '@/components/Charts';
import {
  subredditStats,
  topPosts,
  topContributors,
  generateSubscriberGrowth,
  generateEngagementData,
  generateHourlyActivity,
  generateTrafficSources,
} from '@/data/mockData';

export default function AnalyticsPage() {
  const subscriberData = useMemo(() => generateSubscriberGrowth(), []);
  const engagementData = useMemo(() => generateEngagementData(), []);
  const hourlyData = useMemo(() => generateHourlyActivity(), []);
  const trafficData = useMemo(() => generateTrafficSources(), []);

  return (
    <div className="page-enter">
      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '24px',
      }}>
        <StatsCard icon="" label="Total Subscribers" value={subredditStats.subscribers} trend={2.4} color="purple" delay={0} />
        <StatsCard icon="" label="Posts This Month" value={3842} trend={12.1} color="cyan" delay={60} />
        <StatsCard icon="" label="Comments This Month" value={28491} trend={5.8} color="green" delay={120} />
        <StatsCard icon="⬆" label="Avg. Post Score" value={187} trend={-2.3} color="orange" delay={180} />
        <StatsCard icon="" label="Page Views" value={1240000} trend={8.7} color="blue" delay={240} />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Subscriber Growth */}
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}> Subscriber Growth</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Monthly growth over 12 months</p>
          <AreaChart data={subscriberData} height={220} color="#ffffff" showLabels={true} />
        </div>

        {/* Engagement Breakdown */}
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}> Engagement Breakdown</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Posts, comments, and upvotes</p>
          <BarChart data={engagementData.slice(0, 14)} height={220} colors={['#ffffff', '#a3a3a3', '#737373']} />
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'center' }}>
            {[
              { label: 'Posts', color: '#ffffff' },
              { label: 'Comments', color: '#a3a3a3' },
              { label: 'Upvotes', color: '#737373' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', marginBottom: '20px' }}>
        {/* Peak Hours */}
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}> Peak Activity Hours</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Activity heatmap by day and hour</p>
          <HeatMap data={hourlyData} height={200} />
        </div>

        {/* Traffic Sources */}
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}> Traffic Sources</h3>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <DonutChart
              data={trafficData}
              size={180}
              thickness={24}
              centerLabel="Sources"
              centerValue="5"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {trafficData.map(source => (
              <div key={source.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: source.color, flexShrink: 0 }} />
                <span style={{ fontSize: '13px', flex: 1 }}>{source.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{source.value}%</span>
                <div className="progress-bar" style={{ width: '60px' }}>
                  <div className="progress-fill" style={{ width: `${source.value}%`, background: source.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Top Posts */}
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}> Top Performing Posts</h3>
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
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: index === 0 ? 'rgba(245, 158, 11, 0.15)' : index === 1 ? 'rgba(192, 192, 192, 0.15)' : index === 2 ? 'rgba(205, 127, 50, 0.15)' : 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: index < 3 ? '14px' : '12px',
                  fontWeight: 700,
                  color: index === 0 ? '#fbbf24' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  {index < 3 ? ['', '', ''][index] : index + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {post.title}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    u/{post.author} • {post.createdAt}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#a855f7' }}>⬆ {post.score.toLocaleString()}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{post.comments} </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Contributors */}
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}> Top Contributors</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {topContributors.map((user, index) => (
              <div
                key={user.username}
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
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: index < 3 ? '2px solid var(--accent-purple)' : '2px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-elevated)',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600 }}>u/{user.username}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {user.posts} posts • {user.comments} comments
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#a855f7' }}>
                    {(user.karma / 1000).toFixed(1)}k
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>karma</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
