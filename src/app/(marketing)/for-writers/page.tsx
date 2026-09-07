import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, Shield, TrendingUp, DollarSign,
  BarChart3, Clock, FileText, Star
} from 'lucide-react';

const benefits = [
  'Browse tasks across 7+ platforms',
  'Earn per approved task — no commission cuts',
  '100% original, human-written content only',
  'Track your earnings in real-time',
  'Get performance bonuses for quality work',
  'Withdraw via UPI, Crypto, or Cozy Wallet',
];

const features = [
  {
    icon: Shield,
    title: 'Verified Access Only',
    desc: 'Only high-quality accounts can join. We ensure premium engagement through strict verification.',
  },
  {
    icon: TrendingUp,
    title: 'Performance Rewards',
    desc: 'Top performers earn bonuses. The better your content, the more you earn.',
  },
  {
    icon: DollarSign,
    title: 'Transparent Earnings',
    desc: 'Track pending, available, and paid balances in real-time. No hidden fees.',
  },
  {
    icon: Clock,
    title: 'Fast Payouts',
    desc: 'Withdraw your earnings within 24 hours via UPI, Crypto, or Cozy Wallet.',
  },
  {
    icon: FileText,
    title: 'Quality Content First',
    desc: 'Choose from admin templates or craft your own. High-quality work gets priority.',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    desc: 'Monitor approval rates, earnings per task, and success metrics on your dashboard.',
  },
];

const chartHeights = [30, 45, 35, 55, 40, 65, 50, 75];

export default function ForWritersPage() {
  return (
    <div>
      {/* ════════ HERO ════════ */}
      <section className="mk-hero">
        <div className="mk-hero__inner">
          <div>
            <div className="mk-section__label">FOR WRITERS</div>
            <h1 className="mk-hero__title">
              Create Content.<br />
              <span className="mk-hero__title-accent">Get Paid.</span>
            </h1>

            <p className="mk-hero__desc">
              Join thousands of writers earning money by creating quality content across multiple platforms.
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
              <Link href="/signup" className="mk-btn mk-btn--primary mk-btn--lg">
                Start Earning Now <ArrowRight size={18} />
              </Link>
              <Link href="/how-it-works" className="mk-btn mk-btn--outline mk-btn--lg">
                How It Works
              </Link>
            </div>
          </div>

          {/* Writer Dashboard Preview */}
          <div className="mk-dashboard-preview">
            <div className="mk-dashboard-preview__header">
              <span className="mk-dashboard-preview__title">Writer Dashboard</span>
            </div>

            <div className="mk-dash-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="mk-dash-stat">
                <div className="mk-dash-stat__label">This Month</div>
                <div className="mk-dash-stat__value">$342.80</div>
                <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ 18.6%</div>
              </div>
              <div className="mk-dash-stat">
                <div className="mk-dash-stat__label">Tasks Done</div>
                <div className="mk-dash-stat__value">48</div>
                <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ 12%</div>
              </div>
              <div className="mk-dash-stat">
                <div className="mk-dash-stat__label">Approval Rate</div>
                <div className="mk-dash-stat__value">92%</div>
                <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ 8.7%</div>
              </div>
            </div>

            <div className="mk-dash-chart">
              <div className="mk-dash-chart__header">
                <span className="mk-dash-chart__title">Earnings Trend</span>
                <span style={{ fontSize: '10px', color: 'var(--mk-text-muted)' }}>Last 8 weeks</span>
              </div>
              <div className="mk-dash-chart__bars">
                {chartHeights.map((h, i) => (
                  <div key={i} className="mk-dash-chart__bar" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--mk-bg-subtle)', borderRadius: '10px', border: '1px solid var(--mk-border)' }}>
              <Star size={18} color="#f59e0b" fill="#f59e0b" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--mk-text)' }}>Top Writer Bonus</div>
                <div style={{ fontSize: '11px', color: 'var(--mk-text-muted)' }}>Top 10% writers earn 2x performance rewards</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ FEATURES ════════ */}
      <section className="mk-section mk-section--subtle">
        <div className="mk-container">
          <div className="mk-section__header">
            <h2 className="mk-section__title">Why Writers Love CreateForEarn</h2>
            <p className="mk-section__subtitle">Everything you need to start earning from your content skills.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
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
            <div className="mk-cta-banner__icon">🚀</div>
            <div className="mk-cta-banner__content">
              <div className="mk-cta-banner__title">Ready to start earning?</div>
              <div className="mk-cta-banner__desc">
                Join thousands of writers already earning on CreateForEarn.
              </div>
            </div>
            <div className="mk-cta-banner__actions">
              <Link href="/signup" className="mk-cta-banner__btn mk-cta-banner__btn--white">
                Join as Writer <ArrowRight size={16} />
              </Link>
              <Link href="/how-it-works" className="mk-cta-banner__btn mk-cta-banner__btn--outline">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
