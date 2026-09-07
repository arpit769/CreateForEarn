'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, Target, Users, BarChart3,
  ShieldCheck, Eye, Sparkles, Zap, Megaphone, TrendingUp
} from 'lucide-react';

const benefits = [
  'Launch targeted campaigns across Reddit & YouTube',
  'On-demand network of verified, authentic creators',
  '100% human-crafted, platform-native content',
  'Real-time conversion and engagement tracking',
  'Strict anti-spam and quality assurance filters',
  'Flexible custom budgets with instant escrow security',
];

const features = [
  {
    icon: Target,
    title: 'Laser-Targeted Engagement',
    desc: 'Reach specific subreddits, video categories, and niche communities where your prospective customers actively discuss.',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.1)'
  },
  {
    icon: Users,
    title: 'Verified Creators Network',
    desc: 'Access thousands of screened accounts with authentic karma, age, and high community standing.',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.1)'
  },
  {
    icon: BarChart3,
    title: 'Live Campaign Telemetry',
    desc: 'Monitor submission links, approval status, and viewer impressions in real time through comprehensive reporting.',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  {
    icon: ShieldCheck,
    title: '100% Human & Safe',
    desc: 'Strict policy against AI slop, bots, or deceptive spam. Every submission must be helpful, organic, and contextual.',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)'
  },
];

const campaignBarHeights = [40, 65, 55, 80, 70, 95, 85];

export default function ForClientsPage() {
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
              <span>For Brands, SaaS &amp; Community Leaders</span>
            </div>

            <h1 className="mk-hero__title">
              Scale Your Brand.<br />
              <span className="mk-gradient-text">Organic Conversations.</span>
            </h1>

            <p className="mk-hero__desc">
              Harness the power of genuine word-of-mouth. Deploy community marketing campaigns executed by experienced creators across Reddit, YouTube, and more.
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
                <Link href="/signup?role=client" className="mk-btn mk-btn--primary mk-btn--lg" style={{ boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)' }}>
                  Launch a Campaign <ArrowRight size={18} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/pricing" className="mk-btn mk-btn--outline mk-btn--lg">
                  View Pricing Plans
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Campaign Overview Preview */}
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
              <span className="mk-dashboard-preview__title" style={{ fontSize: '15px', fontWeight: 700 }}>Brand Campaign Manager</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '3px 10px', borderRadius: '999px' }}>
                ● 12 Active Campaigns
              </span>
            </div>

            {/* Stats Row */}
            <div className="mk-dash-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div className="mk-dash-stat" style={{ padding: '12px', borderRadius: '12px', background: 'var(--mk-bg-subtle)' }}>
                <div className="mk-dash-stat__label">Submissions</div>
                <div className="mk-dash-stat__value" style={{ fontSize: '18px' }}>1,840</div>
                <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ 98% approved</div>
              </div>
              <div className="mk-dash-stat" style={{ padding: '12px', borderRadius: '12px', background: 'var(--mk-bg-subtle)' }}>
                <div className="mk-dash-stat__label">Reach / Views</div>
                <div className="mk-dash-stat__value" style={{ fontSize: '18px', color: '#6366f1' }}>340.5K</div>
                <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ 34% organic</div>
              </div>
              <div className="mk-dash-stat" style={{ padding: '12px', borderRadius: '12px', background: 'var(--mk-bg-subtle)' }}>
                <div className="mk-dash-stat__label">ROI Multiple</div>
                <div className="mk-dash-stat__value" style={{ fontSize: '18px', color: '#10b981' }}>4.8x</div>
                <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ High Value</div>
              </div>
            </div>

            {/* Chart */}
            <div className="mk-dash-chart" style={{ padding: '14px', marginTop: '14px', marginBottom: '14px' }}>
              <div className="mk-dash-chart__header">
                <span className="mk-dash-chart__title">Organic Engagement Growth</span>
                <span style={{ fontSize: '11px', color: 'var(--mk-text-muted)' }}>Daily Reach</span>
              </div>
              <div className="mk-dash-chart__bars" style={{ height: '75px' }}>
                {campaignBarHeights.map((h, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.06 }}
                    className="mk-dash-chart__bar" 
                    style={{ 
                      background: i === campaignBarHeights.length - 1 ? '#6366f1' : '#6366f1',
                      opacity: i === campaignBarHeights.length - 1 ? 1 : 0.4
                    }} 
                  />
                ))}
              </div>
            </div>

            {/* Trust badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <ShieldCheck size={18} color="#10b981" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mk-text)' }}>
                Protected by automated screenshot and URL proof verification
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ BENTO FEATURES ════════ */}
      <section className="mk-section mk-section--subtle" style={{ position: 'relative', zIndex: 1 }}>
        <div className="mk-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mk-section__header"
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
              <Sparkles size={14} /> Built for Maximum ROI
            </div>
            <h2 className="mk-section__title">Enterprise-Grade Growth Engine</h2>
            <p className="mk-section__subtitle">Everything you need to launch, manage, and scale community marketing.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
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

      {/* ════════ CTA ════════ */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="mk-section" 
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="mk-container">
          <div className="mk-cta-luminous">
            <h2 className="mk-cta-luminous__title">Ready to Elevate Your Brand Presence?</h2>
            <p className="mk-cta-luminous__desc">
              Start with any budget. Deploy targeted campaigns in minutes and see real creator engagement today.
            </p>
            <div className="mk-cta-luminous__actions">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link href="/signup?role=client" className="mk-btn mk-btn--primary mk-btn--lg" style={{ boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)' }}>
                  Get Started as Client <ArrowRight size={16} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link href="/pricing" className="mk-btn mk-btn--outline mk-btn--lg">
                  Compare Plans
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
