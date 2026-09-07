'use client';

import React from 'react';
import { 
  BarChart2, TrendingUp, Users, Eye, ArrowUpRight, 
  Calendar, Download, Award, PieChart, Sparkles
} from 'lucide-react';

export default function ClientReportsPage() {
  return (
    <div style={{ padding: '8px 0 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Performance & Analytics Reports
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Deep dive into campaign impressions, engagement rates, and ROI metrics.
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
          <Download size={14} /> Export CSV / PDF
        </button>
      </div>

      {/* Top Level Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Total Impressions</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>384.2K</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#10b981', marginTop: '4px' }}>
            <ArrowUpRight size={14} /> +28.4% vs last period
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Average CPM</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>$6.37</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#10b981', marginTop: '4px' }}>
            <ArrowUpRight size={14} /> 42% lower than industry avg
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Engagement Rate</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>6.8%</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#10b981', marginTop: '4px' }}>
            <ArrowUpRight size={14} /> +1.2% this month
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Estimated ROI</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>4.2x</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#10b981', marginTop: '4px' }}>
            <Sparkles size={14} /> Top performing tier
          </div>
        </div>
      </div>

      {/* Analytics Visual Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Platform Share */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Views by Platform</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { platform: 'Reddit', views: '154.2K', share: 40, color: '#ff4500' },
              { platform: 'TikTok', views: '115.0K', share: 30, color: '#000000' },
              { platform: 'YouTube', views: '76.8K', share: 20, color: '#ef4444' },
              { platform: 'Instagram', views: '38.2K', share: 10, color: '#e1306c' },
            ].map((p, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-primary)' }}>{p.platform}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{p.views} ({p.share}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${p.share}%`, height: '100%', background: p.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Score Distribution */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Submission Quality Distribution</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Exceptional (90-100 Score)', count: '104 submissions', share: 71, color: '#10b981' },
              { label: 'Good (75-89 Score)', count: '28 submissions', share: 19, color: '#3b82f6' },
              { label: 'Needs Revisions (60-74 Score)', count: '10 submissions', share: 7, color: '#f59e0b' },
              { label: 'Rejected (<60 Score)', count: '4 submissions', share: 3, color: '#ef4444' },
            ].map((q, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-primary)' }}>{q.label}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{q.count}</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${q.share}%`, height: '100%', background: q.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
