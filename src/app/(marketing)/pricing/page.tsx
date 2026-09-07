'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check, Send, BarChart3, Crown, Building2,
  Sparkles, ShieldCheck, Zap, ArrowRight, HelpCircle
} from 'lucide-react';

const clientPlans = [
  {
    name: 'Starter',
    desc: 'Ideal for initial testing & niche community outreach',
    price: '$29',
    period: '/month',
    icon: Send,
    features: [
      '1 Active Campaign',
      '10 Content Submissions',
      'Automatic Proof Verification',
      'Standard Analytics Dashboard',
      'Community Email Support',
    ],
    cta: 'Get Started',
    featured: false,
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.1)'
  },
  {
    name: 'Growth',
    desc: 'For scaling brands driving organic conversations',
    price: '$79',
    period: '/month',
    icon: BarChart3,
    features: [
      '3 Active Campaigns',
      '50 Content Submissions',
      'Priority Writer Matching',
      'Advanced Conversion Analytics',
      'Subreddit Specific Targeting',
      'Priority 24/7 Support',
    ],
    cta: 'Start Growth Plan',
    featured: true,
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.1)'
  },
  {
    name: 'Pro Brand',
    desc: 'Maximum reach and automated workflow scaling',
    price: '$149',
    period: '/month',
    icon: Crown,
    features: [
      '10 Active Campaigns',
      '200 Content Submissions',
      'Top 5% Writer Assignment',
      'Full API & Telemetry Access',
      'Custom Submission Guidelines',
      'Dedicated Account Manager',
    ],
    cta: 'Start Pro Plan',
    featured: false,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)'
  },
  {
    name: 'Enterprise',
    desc: 'Tailored solutions for agencies & enterprise networks',
    price: 'Custom',
    period: '',
    icon: Building2,
    features: [
      'Unlimited Campaigns & Tasks',
      'Custom Volume Discounts',
      'Dedicated Slack / Discord Channel',
      'White-Glove Campaign Setup',
      'SLA Guaranteed Reviews',
    ],
    cta: 'Contact Sales',
    featured: false,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)'
  },
];

const writerPlans = [
  {
    name: 'Standard Writer',
    desc: 'Start monetizing your skills immediately with zero fees',
    price: '$0',
    period: '/ forever',
    icon: Send,
    features: [
      'Access to all standard tasks',
      'Keep 100% of earned rewards',
      'Real-time wallet tracking',
      '$1.00 minimum withdrawals',
      'Community Discord support',
    ],
    cta: 'Join Free',
    featured: false,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  {
    name: 'Pro Creator',
    desc: 'For power writers seeking exclusive high-ticket tasks',
    price: '$9',
    period: '/month',
    icon: Crown,
    features: [
      'Priority task allocation (15m early access)',
      'Access to VIP high-bounty campaigns',
      'Top Writer Badge on Profile',
      '2x Leaderboard Bonus multiplier eligibility',
      'Instant withdrawal processing priority',
    ],
    cta: 'Upgrade to Pro',
    featured: true,
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.1)'
  },
];

export default function PricingPage() {
  const [tab, setTab] = useState<'clients' | 'writers'>('clients');
  const plans = tab === 'clients' ? clientPlans : writerPlans;

  return (
    <div className="mk-mesh-container">
      {/* Blueprint Grid Background Pattern */}
      <div className="mk-grid-bg" />

      {/* ════════ HEADER ════════ */}
      <section className="mk-section mk-pt-header" style={{ paddingBottom: '0', position: 'relative', zIndex: 1 }}>
        <div className="mk-container">
          <div className="mk-section__header" style={{ textAlign: 'center' }}>
            <div className="mk-live-pill" style={{ margin: '0 auto 16px' }}>
              <span className="mk-live-dot" />
              <span>Transparent, Value-Driven Plans</span>
            </div>

            <h1 className="mk-section__title" style={{ fontSize: 'clamp(36px, 5vw, 56px)', marginBottom: '16px' }}>
              Simple, Predictable <span className="mk-gradient-text">Pricing</span>
            </h1>
            <p className="mk-section__subtitle" style={{ margin: '0 auto 32px', maxWidth: '600px' }}>
              Choose the perfect plan to grow your community or maximize your freelance writing earnings.
            </p>

            {/* Segmented Pill Toggle */}
            <div style={{
              display: 'inline-flex',
              background: 'var(--mk-bg-card)',
              border: '1px solid var(--mk-border)',
              borderRadius: '9999px',
              padding: '5px',
              boxShadow: 'var(--mk-shadow-sm)',
              gap: '4px'
            }}>
              <button
                onClick={() => setTab('clients')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: tab === 'clients' ? 'var(--mk-primary)' : 'transparent',
                  color: tab === 'clients' ? '#ffffff' : 'var(--mk-text-secondary)',
                  boxShadow: tab === 'clients' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                }}
              >
                For Brand Clients
              </button>
              <button
                onClick={() => setTab('writers')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: tab === 'writers' ? 'var(--mk-primary)' : 'transparent',
                  color: tab === 'writers' ? '#ffffff' : 'var(--mk-text-secondary)',
                  boxShadow: tab === 'writers' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                }}
              >
                For Creators &amp; Writers
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ PRICING CARDS ════════ */}
      <section className="mk-section" style={{ paddingTop: '36px', position: 'relative', zIndex: 1 }}>
        <div className="mk-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: tab === 'writers' ? 'repeat(auto-fit, minmax(320px, 1fr))' : 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
            maxWidth: tab === 'writers' ? '800px' : '1200px',
            margin: '0 auto',
            alignItems: 'stretch'
          }}>
            {plans.map(plan => (
              <div
                key={plan.name}
                className="mk-bento-card"
                style={{
                  position: 'relative',
                  border: plan.featured ? '2px solid rgba(99, 102, 241, 0.6)' : '1px solid var(--mk-border)',
                  boxShadow: plan.featured ? '0 16px 40px rgba(99, 102, 241, 0.15)' : 'var(--mk-shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {plan.featured && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: '#6366f1',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
                  }}>
                    Most Popular
                  </div>
                )}

                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: plan.bg,
                  color: plan.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <plan.icon size={24} />
                </div>

                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '4px' }}>
                  {plan.name}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--mk-text-muted)', marginBottom: '20px', minHeight: '38px', lineHeight: 1.4 }}>
                  {plan.desc}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--mk-border)' }}>
                  <span style={{ fontSize: '38px', fontWeight: 900, color: 'var(--mk-text)' }}>{plan.price}</span>
                  {plan.period && <span style={{ fontSize: '14px', color: 'var(--mk-text-muted)', fontWeight: 600 }}>{plan.period}</span>}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {plan.features.map(feat => (
                    <li key={feat} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--mk-text-secondary)', lineHeight: 1.4 }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.cta === 'Contact Sales' ? 'mailto:sales@createforearn.com' : '/signup'}
                  className={`mk-btn ${plan.featured ? 'mk-btn--primary' : 'mk-btn--outline'}`}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: 'auto',
                    boxShadow: plan.featured ? '0 8px 24px rgba(99, 102, 241, 0.35)' : 'none'
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Trust Guarantees */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '48px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--mk-text-muted)', fontWeight: 600 }}>
              <ShieldCheck size={18} color="#10b981" /> 100% Escrow Security Guarantee
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--mk-text-muted)', fontWeight: 600 }}>
              <Zap size={18} color="#6366f1" /> Instant Setup &amp; Verification
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--mk-text-muted)', fontWeight: 600 }}>
              <HelpCircle size={18} color="#ec4899" /> Cancel or Pause Anytime
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
