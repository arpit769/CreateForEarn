'use client';

import { Check, Info, Coins, ShieldCheck, Zap } from 'lucide-react';

export default function PricingPage() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '64px 24px', color: 'var(--text-secondary)' }}>
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Pricing Plans
        </h1>
        <p style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
          Transparent pricing designed for both workers looking to earn, and brands looking to grow authentic communities.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '64px' }}>
        {/* Worker Plan */}
        <div style={{ padding: '40px 32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'inline-flex', padding: '4px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '20px', fontSize: '12px', fontWeight: 700, alignSelf: 'flex-start', marginBottom: '20px', textTransform: 'uppercase' }}>
            For Workers
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Earning Tier</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px' }}>Start earning immediately by completing simple tasks.</p>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '32px' }}>
            <span style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-primary)' }}>$0</span>
            <span style={{ color: 'var(--text-muted)' }}>/ forever</span>
          </div>

          <button style={{ width: '100%', padding: '14px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '12px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', marginBottom: '32px' }} onClick={() => window.location.href = '/signup'}>
            Start Earning Now
          </button>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            {[
              'Access to all qualified Reddit tasks',
              'Keep 100% of your listed earnings',
              'Weekly payouts via UPI or Crypto',
              'Link up to 3 verified Reddit accounts',
              'Basic community support access'
            ].map(feat => (
              <li key={feat} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                <Check size={16} color="#10b981" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Brand/Client Plan */}
        <div style={{ padding: '40px 32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-accent)', borderRadius: '24px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ display: 'inline-flex', padding: '4px 12px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', borderRadius: '20px', fontSize: '12px', fontWeight: 700, alignSelf: 'flex-start', marginBottom: '20px', textTransform: 'uppercase' }}>
            For Advertisers
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Community Booster</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px' }}>Promote your subreddits with authentic quality engagement.</p>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '32px' }}>
            <span style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-primary)' }}>Custom</span>
            <span style={{ color: 'var(--text-muted)' }}>/ per campaign</span>
          </div>

          <button style={{ width: '100%', padding: '14px', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', marginBottom: '32px' }} onClick={() => window.location.href = 'mailto:sales@createforearn.com'}>
            Contact Campaigns
          </button>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            {[
              'Targeted subreddit distribution',
              'Quality standards & manual verification',
              'Anti-spam and multi-account protection',
              'Detailed campaign performance reports',
              'Dedicated account manager support'
            ].map(feat => (
              <li key={feat} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                <Check size={16} color="var(--accent-blue)" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
