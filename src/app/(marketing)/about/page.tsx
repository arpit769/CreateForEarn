'use client';

import Link from 'next/link';
import {
  Users, ShieldCheck, Target, Heart, CheckCircle2,
  FileText, Eye, DollarSign, Sparkles, Star, ArrowRight, Zap
} from 'lucide-react';

const stats = [
  { icon: Users, value: '10,000+', label: 'Active Creators' },
  { icon: FileText, value: '45,000+', label: 'Tasks Completed' },
  { icon: Eye, value: '5.2M+', label: 'Total Views Generated' },
  { icon: DollarSign, value: '$150K+', label: 'Paid to Creators' },
  { icon: Users, value: '250+', label: 'Active Brand Clients' },
];

const pillars = [
  {
    icon: Target,
    title: 'Our Mission',
    desc: 'Empower everyday creators to monetize their authentic voice, while helping brands generate genuine community engagement.',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  {
    icon: Eye,
    title: 'Our Vision',
    desc: 'To become the premier decentralized marketplace for organic word-of-mouth marketing across every major internet platform.',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.1)'
  },
  {
    icon: Star,
    title: 'Our Values',
    desc: 'Transparency, meritocracy, and strict respect for platform guidelines. We reward genuine quality over automated noise.',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)'
  },
  {
    icon: Heart,
    title: 'Our Commitment',
    desc: 'Guaranteed timely payouts, zero hidden deductions, and responsive 24/7 creator support across Discord and live chat.',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.1)'
  }
];

export default function AboutPage() {
  return (
    <div className="mk-mesh-container">
      {/* Blueprint Grid Background Pattern */}
      <div className="mk-grid-bg" />

      {/* ════════ HERO ════════ */}
      <section className="mk-section mk-pt-header" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div className="mk-container">
          <div className="mk-live-pill" style={{ margin: '0 auto 16px' }}>
            <span className="mk-live-dot" />
            <span>About CreateForEarn</span>
          </div>

          <h1 className="mk-section__title" style={{ fontSize: 'clamp(34px, 5vw, 54px)', marginBottom: '16px' }}>
            Empowering Creators.<br />
            <span className="mk-gradient-text">Delivering Organic Value.</span>
          </h1>

          <p className="mk-section__subtitle" style={{ margin: '0 auto 48px', maxWidth: '750px', lineHeight: 1.7 }}>
            CreateForEarn was built to bridge the gap between passionate writers and communities that thrive on original, high-impact contributions. We believe in fair compensation, honest work, and real financial empowerment.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', textAlign: 'left' }}>
            <div className="mk-bento-card">
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <ShieldCheck size={22} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '6px' }}>100% Human Content</h3>
              <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.6 }}>
                Every single task is completed by genuine users. Zero AI slop, zero bot automation.
              </p>
            </div>

            <div className="mk-bento-card">
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <DollarSign size={22} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '6px' }}>Fair &amp; Direct Payouts</h3>
              <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.6 }}>
                Writers keep 100% of their rewards. Direct payouts via UPI and Crypto with $1 min withdrawal.
              </p>
            </div>

            <div className="mk-bento-card">
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Users size={22} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '6px' }}>Built for Everyone</h3>
              <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.6 }}>
                From students to seasoned freelance copywriters, anyone can turn spare hours into reliable earnings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ PILLARS ════════ */}
      <section className="mk-section mk-section--subtle" style={{ position: 'relative', zIndex: 1 }}>
        <div className="mk-container">
          <div className="mk-section__header">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
              <Sparkles size={14} /> Our Core Foundation
            </div>
            <h2 className="mk-section__title">The Pillars That Guide Us</h2>
            <p className="mk-section__subtitle">How we build trust between thousands of creators and brand partners.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {pillars.map(pillar => (
              <div key={pillar.title} className="mk-bento-card">
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: pillar.bg, color: pillar.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <pillar.icon size={24} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '8px' }}>
                  {pillar.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.6 }}>
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ METRIC STRIP ════════ */}
      <section className="mk-section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="mk-container">
          <div className="mk-metric-strip">
            {stats.map(stat => (
              <div key={stat.label} className="mk-metric-item">
                <div className="mk-metric-item__icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <div className="mk-metric-item__value">{stat.value}</div>
                  <div className="mk-metric-item__label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ CTA ════════ */}
      <section className="mk-section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="mk-container">
          <div className="mk-cta-luminous">
            <h2 className="mk-cta-luminous__title">Join the Creator Economy Revolution</h2>
            <p className="mk-cta-luminous__desc">
              Whether you are a creator looking to earn or a brand looking to grow authentically, we have a place for you.
            </p>
            <div className="mk-cta-luminous__actions">
              <Link href="/signup" className="mk-btn mk-btn--primary mk-btn--lg" style={{ boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)' }}>
                Get Started Free <ArrowRight size={16} />
              </Link>
              <Link href="/for-clients" className="mk-btn mk-btn--outline mk-btn--lg">
                For Brands &amp; Clients
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
