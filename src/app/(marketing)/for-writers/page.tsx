'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, Shield, TrendingUp, DollarSign,
  BarChart3, Clock, FileText, Star, Sparkles, Zap, Award
} from 'lucide-react';

const benefits = [
  'Browse live tasks across 7+ top platforms',
  'Keep 100% of your task earnings — zero platform cuts',
  '100% original, human-written content only',
  'Live wallet tracking with real-time balance updates',
  'Get up to 2x performance bonuses for quality work',
  'Instant withdrawals via UPI, USDT / Crypto, or Wallet',
];

const features = [
  {
    icon: Shield,
    title: 'Verified Access Only',
    desc: 'We verify each creator to maintain high platform quality and unlock the highest paying campaign tiers.',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.1)'
  },
  {
    icon: TrendingUp,
    title: 'Performance Multipliers',
    desc: 'Consistent quality work boosts your rank into the Top 10% Leaderboard, giving you priority access & bonuses.',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.1)'
  },
  {
    icon: DollarSign,
    title: 'Transparent Earnings',
    desc: 'No confusing points or credits. See actual dollar amounts with clear breakdown per approved submission.',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  {
    icon: Clock,
    title: 'Fast 24-Hour Payouts',
    desc: 'Request payout anytime with a low $1.00 minimum threshold. Payouts arrive reliably in under 24 hours.',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)'
  },
  {
    icon: FileText,
    title: 'Diverse Task Types',
    desc: 'Choose from subreddit comments, YouTube video discussions, karma farming, text threads, and image posts.',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.1)'
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    desc: 'Monitor approval rates, daily earnings velocity, and review speed from your intuitive creator dashboard.',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.1)'
  },
];

const chartHeights = [30, 45, 35, 55, 40, 65, 50, 85];

export default function ForWritersPage() {
  return (
    <div className="mk-mesh-container">
      {/* Blueprint Grid Background Pattern */}
      <div className="mk-grid-bg" />

      {/* ════════ HERO ════════ */}
      <section className="mk-hero" style={{ position: 'relative', zIndex: 1 }}>
        <div className="mk-hero__inner">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="mk-live-pill">
              <span className="mk-live-dot" />
              <span>For Freelance Writers &amp; Creators</span>
            </div>

            <h1 className="mk-hero__title">
              Create Content.<br />
              <span className="mk-gradient-text">Get Paid Daily.</span>
            </h1>

            <p className="mk-hero__desc">
              Turn your Reddit knowledge and writing creativity into consistent income. Claim verified tasks and get rewarded for high-quality organic engagement.
            </p>

            <ul className="mk-checklist" style={{ marginBottom: '32px' }}>
              {benefits.map(item => (
                <li key={item} className="mk-checklist__item">
                  <CheckCircle2 size={18} className="mk-checklist__icon" color="#10b981" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mk-hero__cta">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/signup" className="mk-btn mk-btn--primary mk-btn--lg" style={{ boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)' }}>
                  Start Earning Now <ArrowRight size={18} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/how-it-works" className="mk-btn mk-btn--outline mk-btn--lg">
                  How It Works
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Writer Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mk-dashboard-preview mk-floating-card" 
            style={{
              background: 'var(--mk-bg-card)', 
              border: '1px solid var(--mk-border-medium)', 
              borderRadius: '24px', 
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12)',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div className="mk-dashboard-preview__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="mk-dashboard-preview__title" style={{ fontSize: '15px', fontWeight: 700 }}>Writer Earnings Hub</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '3px 10px', borderRadius: '999px' }}>
                ✓ Payout Active
              </span>
            </div>

            <div className="mk-dash-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div className="mk-dash-stat" style={{ padding: '12px', borderRadius: '12px', background: 'var(--mk-bg-subtle)' }}>
                <div className="mk-dash-stat__label">This Month</div>
                <div className="mk-dash-stat__value" style={{ color: '#10b981', fontSize: '18px' }}>$342.80</div>
                <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ 18.6%</div>
              </div>
              <div className="mk-dash-stat" style={{ padding: '12px', borderRadius: '12px', background: 'var(--mk-bg-subtle)' }}>
                <div className="mk-dash-stat__label">Tasks Done</div>
                <div className="mk-dash-stat__value" style={{ fontSize: '18px' }}>48</div>
                <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ 12%</div>
              </div>
              <div className="mk-dash-stat" style={{ padding: '12px', borderRadius: '12px', background: 'var(--mk-bg-subtle)' }}>
                <div className="mk-dash-stat__label">Approval Rate</div>
                <div className="mk-dash-stat__value" style={{ fontSize: '18px' }}>96%</div>
                <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ Top Tier</div>
              </div>
            </div>

            <div className="mk-dash-chart" style={{ padding: '14px', marginTop: '14px', marginBottom: '14px' }}>
              <div className="mk-dash-chart__header">
                <span className="mk-dash-chart__title">Weekly Earnings Trend</span>
                <span style={{ fontSize: '11px', color: 'var(--mk-text-muted)' }}>Last 8 weeks</span>
              </div>
              <div className="mk-dash-chart__bars" style={{ height: '75px' }}>
                {chartHeights.map((h, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.06 }}
                    className="mk-dash-chart__bar" 
                    style={{ 
                      background: i === chartHeights.length - 1 ? '#6366f1' : 'var(--mk-primary)',
                      opacity: i === chartHeights.length - 1 ? 1 : 0.4
                    }} 
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
              <Star size={20} color="#f59e0b" fill="#f59e0b" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--mk-text)' }}>Top Writer Bonus Active</div>
                <div style={{ fontSize: '11px', color: 'var(--mk-text-muted)' }}>Top 10% creators unlock double payout rewards</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ FEATURES BENTO ════════ */}
      <section className="mk-section mk-section--subtle" style={{ position: 'relative', zIndex: 1 }}>
        <div className="mk-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mk-section__header"
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
              <Sparkles size={14} /> Creator Benefits
            </div>
            <h2 className="mk-section__title">Why Writers Choose CreateForEarn</h2>
            <p className="mk-section__subtitle">Everything you need to maximize your daily income from writing.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {features.map(feat => (
              <motion.div whileHover={{ y: -6 }} key={feat.title} className="mk-bento-card">
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '14px', 
                  background: feat.bg, 
                  color: feat.color, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '16px' 
                }}>
                  <feat.icon size={24} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '8px' }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.6 }}>
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ CTA BANNER ════════ */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="mk-section" 
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="mk-container">
          <div className="mk-cta-luminous">
            <h2 className="mk-cta-luminous__title">Ready to Start Earning?</h2>
            <p className="mk-cta-luminous__desc">
              Join thousands of creators who earn daily by writing original content. Free signup, zero commissions.
            </p>
            <div className="mk-cta-luminous__actions">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link href="/signup" className="mk-btn mk-btn--primary mk-btn--lg" style={{ boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)' }}>
                  Create Free Account <ArrowRight size={16} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link href="/how-it-works" className="mk-btn mk-btn--outline mk-btn--lg">
                  Learn More
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
