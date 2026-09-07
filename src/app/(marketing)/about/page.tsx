'use client';

import Link from 'next/link';
import {
  Users, ShieldCheck, Target, Heart, CheckCircle2,
  FileText, Eye, DollarSign
} from 'lucide-react';

const stats = [
  { icon: Users, value: '7,500+', label: 'Active Writers' },
  { icon: FileText, value: '25,000+', label: 'Tasks Completed' },
  { icon: Eye, value: '3.5M+', label: 'Total Views Generated' },
  { icon: DollarSign, value: '$250K+', label: 'Paid to Writers' },
  { icon: Users, value: '200+', label: 'Active Clients' },
];

export default function AboutPage() {
  return (
    <div>
      {/* ════════ HERO ════════ */}
      <section className="mk-section mk-pt-header">
        <div className="mk-container">
          <div className="mk-section__label" style={{ textAlign: 'center', width: '100%' }}>ABOUT US</div>
          <h1 className="mk-section__title" style={{ fontSize: 'clamp(32px, 5vw, 48px)', textAlign: 'center', marginBottom: '24px' }}>
            Our Mission is Simple:<br />
            <span className="mk-hero__title-accent">Empower Creators. Deliver Value.</span>
          </h1>

          <p className="mk-section__subtitle" style={{ textAlign: 'center', marginBottom: '48px', maxWidth: '800px' }}>
            CreateForEarn was built to bridge the gap between content creators and communities that need original, high-quality content. We believe in fair opportunities, honest work, and real earnings.
          </p>

          <div className="mk-value-props">
            <div className="mk-value-prop">
              <div className="mk-value-prop__icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <ShieldCheck size={20} />
              </div>
              <div className="mk-value-prop__content">
                <div className="mk-value-prop__title">100% Original</div>
                <div className="mk-value-prop__desc">All content is human-written and original.</div>
              </div>
            </div>
            <div className="mk-value-prop">
              <div className="mk-value-prop__icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <Users size={20} />
              </div>
              <div className="mk-value-prop__content">
                <div className="mk-value-prop__title">Fair & Transparent</div>
                <div className="mk-value-prop__desc">Clear guidelines, fair reviews, and on-time payments.</div>
              </div>
            </div>
            <div className="mk-value-prop">
              <div className="mk-value-prop__icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed' }}>
                <Target size={20} />
              </div>
              <div className="mk-value-prop__content">
                <div className="mk-value-prop__title">Built for Everyone</div>
                <div className="mk-value-prop__desc">Writers, creators, and brands — all in one trusted platform.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ PILLARS ════════ */}
      <section className="mk-section mk-section--subtle">
        <div className="mk-container">
          <div className="mk-pillars">
            <div className="mk-card mk-card--no-hover">
              <div className="mk-card__icon" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>
                <Target size={24} />
              </div>
              <div className="mk-card__title">Our Mission</div>
              <div className="mk-card__desc">To create a fair platform where creators earn for their skills and clients get quality content.</div>
            </div>
            <div className="mk-card mk-card--no-hover">
              <div className="mk-card__icon" style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.1)' }}>
                <Eye size={24} />
              </div>
              <div className="mk-card__title">Our Vision</div>
              <div className="mk-card__desc">To become the world's most trusted platform for content creation and collaboration.</div>
            </div>
            <div className="mk-card mk-card--no-hover">
              <div className="mk-card__icon" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>
                <StarIcon size={24} />
              </div>
              <div className="mk-card__title">Our Values</div>
              <div className="mk-card__desc">Integrity, transparency, creativity, and respect drive everything we do.</div>
            </div>
            <div className="mk-card mk-card--no-hover">
              <div className="mk-card__icon" style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)' }}>
                <Heart size={24} />
              </div>
              <div className="mk-card__title">Our Commitment</div>
              <div className="mk-card__desc">We are committed to providing a safe, reliable, and rewarding experience for everyone.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ STATS BAR ════════ */}
      <section className="mk-section" style={{ paddingBottom: '0' }}>
        <div className="mk-container">
          <div className="mk-stats-bar" style={{ background: 'var(--mk-bg-card)', border: '1px solid var(--mk-border)' }}>
            {stats.map(stat => (
              <div key={stat.label} className="mk-stats-bar__item">
                <div className="mk-stats-bar__icon" style={{ background: 'var(--mk-primary-light)', color: 'var(--mk-primary)' }}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <div className="mk-stats-bar__value" style={{ color: 'var(--mk-text)' }}>{stat.value}</div>
                  <div className="mk-stats-bar__label" style={{ color: 'var(--mk-text-muted)' }}>{stat.label}</div>
                </div>
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
              <div className="mk-cta-banner__title">Ready to be a part of something bigger?</div>
              <div className="mk-cta-banner__desc">
                Join thousands of writers and brands building great content together.
              </div>
            </div>
            <div className="mk-cta-banner__actions">
              <Link href="/signup" className="mk-cta-banner__btn mk-cta-banner__btn--white">
                Join as Writer
              </Link>
              <Link href="/signup" className="mk-cta-banner__btn mk-cta-banner__btn--outline">
                Join as Client
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const StarIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);
