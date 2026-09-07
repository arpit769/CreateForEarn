import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, Target, Users, BarChart3,
  ShieldCheck, Eye
} from 'lucide-react';

const benefits = [
  'Create campaigns for your platform',
  'Get content from skilled writers',
  '100% original, platform-specific content',
  'Track performance & results',
  'Scale successful campaigns easily',
  'Transparent reporting & insights',
];

const features = [
  {
    icon: Target,
    title: 'Targeted & Relevant Content',
    desc: 'Get content tailored to your audience and community goals.',
  },
  {
    icon: Users,
    title: 'Skilled Writers Network',
    desc: 'Access a network of verified writers experienced across platforms.',
  },
  {
    icon: BarChart3,
    title: 'Track & Measure Results',
    desc: 'Real-time analytics and reports to measure campaign success.',
  },
  {
    icon: ShieldCheck,
    title: 'Safe & Reliable',
    desc: 'No AI-generated content. No manipulation. Only original, human-written content.',
  },
];

const campaignBarHeights = [35, 55, 45, 70, 60, 80, 50];

export default function ForClientsPage() {
  return (
    <div>
      {/* ════════ HERO ════════ */}
      <section className="mk-hero">
        <div className="mk-hero__inner">
          <div>
            <h1 className="mk-hero__title" style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}>
              <span style={{ fontWeight: 900 }}>For Clients &amp; Communities</span>
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--mk-text-secondary)', marginBottom: '28px' }}>
              Grow your community with quality content.
            </p>

            <ul className="mk-checklist" style={{ marginBottom: '32px' }}>
              {benefits.map(item => (
                <li key={item} className="mk-checklist__item">
                  <CheckCircle2 size={18} className="mk-checklist__icon" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mk-hero__cta">
              <Link href="/signup?role=client" className="mk-btn mk-btn--primary mk-btn--lg">
                Get Started as Client <ArrowRight size={18} />
              </Link>
              <Link href="/pricing" className="mk-btn mk-btn--outline mk-btn--lg">
                See Pricing
              </Link>
            </div>
          </div>

          {/* Campaign Overview Preview */}
          <div className="mk-dashboard-preview">
            <div className="mk-dashboard-preview__header">
              <span className="mk-dashboard-preview__title">Campaign Overview</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '3px 8px',
                borderRadius: '12px'
              }}>
                ● Live Analytics
              </span>
            </div>

            {/* Stats Row */}
            <div className="mk-dash-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="mk-dash-stat">
                <div className="mk-dash-stat__label">Active Campaigns</div>
                <div className="mk-dash-stat__value">12</div>
                <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ 4 new</div>
              </div>
              <div className="mk-dash-stat">
                <div className="mk-dash-stat__label">Writers Engaged</div>
                <div className="mk-dash-stat__value">847</div>
                <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ 18%</div>
              </div>
              <div className="mk-dash-stat">
                <div className="mk-dash-stat__label">Approval Rate</div>
                <div className="mk-dash-stat__value">98%</div>
                <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ 2.4%</div>
              </div>
            </div>

            {/* Total Views & Bar Chart */}
            <div className="mk-dash-chart">
              <div className="mk-dash-chart__header">
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--mk-text-muted)', marginBottom: '2px' }}>Total Campaign Views</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Eye size={18} color="var(--mk-primary)" />
                    <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--mk-text)' }}>125.6K</span>
                  </div>
                </div>
                <span className="mk-dash-stat__change mk-dash-stat__change--up" style={{ fontSize: '11px' }}>
                  ↑ 24.8% this week
                </span>
              </div>
              <div className="mk-dash-chart__bars" style={{ height: '90px' }}>
                {campaignBarHeights.map((h, i) => (
                  <div key={i} className="mk-dash-chart__bar" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            {/* Bottom Highlight */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--mk-bg-subtle)', borderRadius: '10px', border: '1px solid var(--mk-border)' }}>
              <ShieldCheck size={18} color="#10b981" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mk-text)' }}>Verified Human Deliverables</div>
                <div style={{ fontSize: '11px', color: 'var(--mk-text-muted)' }}>100% manual review & anti-bot protection</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ FEATURES ════════ */}
      <section className="mk-section mk-section--subtle">
        <div className="mk-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {features.map(feat => (
              <div key={feat.title} className="mk-card">
                <div className="mk-card__icon">
                  <feat.icon size={24} />
                </div>
                <div className="mk-card__title">{feat.title}</div>
                <div className="mk-card__desc">{feat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ CTA BANNER ════════ */}
      <section className="mk-section">
        <div className="mk-container">
          <div className="mk-cta-banner">
            <div className="mk-cta-banner__icon">🌱</div>
            <div className="mk-cta-banner__content">
              <div className="mk-cta-banner__title">Ready to grow your community?</div>
              <div className="mk-cta-banner__desc">
                Join thousands of brands and communities that trust CreateForEarn.
              </div>
            </div>
            <div className="mk-cta-banner__actions">
              <Link href="/about" className="mk-cta-banner__btn mk-cta-banner__btn--outline">
                Learn More
              </Link>
              <Link href="/signup?role=client" className="mk-cta-banner__btn mk-cta-banner__btn--white">
                Get Started as Client <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
