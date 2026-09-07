'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import {
  ArrowRight, Sparkles, TrendingUp, ShieldCheck, DollarSign,
  Users, CheckCircle2, Zap, Trophy, PlaySquare, Award,
  Clock, Flame, HelpCircle
} from 'lucide-react';

/* ── Platform Icons ── */
const RedditIcon = () => (
  <svg width="28" height="28" viewBox="0 0 20 20" fill="#FF4500"><circle cx="10" cy="10" r="10"/><path fill="white" d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-1 1 1 0 0 0-.96.68l-2.38-.5a.27.27 0 0 0-.32.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .68-1.58zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.86 3.58 3.58 0 0 1-2.85-.86.27.27 0 0 1 .38-.38 3.13 3.13 0 0 0 2.47.67 3.13 3.13 0 0 0 2.47-.67.27.27 0 0 1 .38.38zm-.19-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"/></svg>
);
const YouTubeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a2.996 2.996 0 0 0-2.112-2.12C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.386.52A2.996 2.996 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a2.996 2.996 0 0 0 2.112 2.12c1.881.52 9.386.52 9.386.52s7.505 0 9.386-.52a2.996 2.996 0 0 0 2.112-2.12C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);
const InstagramIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="ig" x1="0" y1="24" x2="24" y2="0"><stop offset="0%" stopColor="#F58529"/><stop offset="50%" stopColor="#DD2A7B"/><stop offset="100%" stopColor="#8134AF"/></linearGradient></defs><rect width="24" height="24" rx="6" fill="url(#ig)"/><circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.5" fill="none"/><circle cx="17.5" cy="6.5" r="1.2" fill="white"/><rect x="3" y="3" width="18" height="18" rx="5" stroke="white" strokeWidth="1.5" fill="none"/></svg>
);
const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const LinkedInIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="#0A66C2"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path fill="white" d="M7.5 9.5h-2v8h2v-8zm-1-3.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm10 3.5h-2.2c-1.1 0-1.6.6-1.8.9v-.9h-2v8h2v-4.5c0-1.1.5-1.7 1.4-1.7.8 0 1.1.5 1.1 1.5v4.7h2v-5.3c0-1.8-.8-2.7-2.5-2.7z"/></svg>
);
const TikTokIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
);

const chartHeights = [35, 52, 44, 78, 62, 88, 70, 95];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/dashboard');
      }
    });
  }, [router]);

  return (
    <div className="mk-mesh-container">
      {/* Blueprint Grid Background Pattern */}
      <div className="mk-grid-bg" />

      {/* ════════ HERO ════════ */}
      <section className="mk-hero" style={{ position: 'relative', zIndex: 1 }}>
        <div className="mk-hero__inner">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Live Status Pill */}
            <motion.div variants={itemVariants} className="mk-live-pill">
              <span className="mk-live-dot" />
              <span>480+ Tasks Live Today • $42,500+ Paid Out</span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="mk-hero__title">
              Create Content.<br />
              <span className="mk-gradient-text">Earn Real Income.</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="mk-hero__desc">
              Connect with top brands and creators to complete verified community tasks across Reddit, YouTube, and 6+ platforms with guaranteed weekly payouts.
            </motion.p>

            <motion.div variants={itemVariants} className="mk-hero__cta">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/signup" className="mk-btn mk-btn--primary mk-btn--lg" style={{ boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)' }}>
                  Start Earning Now <ArrowRight size={18} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/for-clients" className="mk-btn mk-btn--outline mk-btn--lg">
                  I&apos;m a Brand Client
                </Link>
              </motion.div>
            </motion.div>

            {/* Quick check indicators */}
            <motion.div variants={itemVariants} style={{ display: 'flex', gap: '18px', marginTop: '28px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--mk-text-secondary)' }}>
                <CheckCircle2 size={15} color="#10b981" /> No upfront cost
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--mk-text-secondary)' }}>
                <CheckCircle2 size={15} color="#10b981" /> $1.00 min withdrawal
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--mk-text-secondary)' }}>
                <CheckCircle2 size={15} color="#10b981" /> Instant verification
              </span>
            </motion.div>
          </motion.div>

          {/* Interactive Glassmorphism Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            className="mk-dashboard-preview mk-floating-card mk-tech-card"
            style={{ 
              borderRadius: '24px', 
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Corner Crosshairs */}
            <span className="mk-corner-plus mk-corner-plus--tl">+</span>
            <span className="mk-corner-plus mk-corner-plus--tr">+</span>
            <span className="mk-corner-plus mk-corner-plus--bl">+</span>
            <span className="mk-corner-plus mk-corner-plus--br">+</span>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mk-text)', marginLeft: '6px' }}>Creator Command Center</span>
              </div>
              <span className="mk-mono-badge" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                ● SYSTEM_ACTIVE
              </span>
            </div>

            {/* Stats Row */}
            <div className="mk-dash-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div className="mk-dash-stat" style={{ padding: '12px', borderRadius: '12px', background: 'var(--mk-bg-subtle)', border: '1px solid var(--mk-border)' }}>
                <div className="mk-dash-stat__label">Total Earnings</div>
                <div className="mk-dash-stat__value" style={{ fontSize: '18px', color: '#10b981' }}>$1,245.50</div>
                <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ 18.6% this mo</div>
              </div>
              <div className="mk-dash-stat" style={{ padding: '12px', borderRadius: '12px', background: 'var(--mk-bg-subtle)', border: '1px solid var(--mk-border)' }}>
                <div className="mk-dash-stat__label">Tasks Approved</div>
                <div className="mk-dash-stat__value" style={{ fontSize: '18px' }}>48 / 48</div>
                <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ 100% success</div>
              </div>
              <div className="mk-dash-stat" style={{ padding: '12px', borderRadius: '12px', background: 'var(--mk-bg-subtle)', border: '1px solid var(--mk-border)' }}>
                <div className="mk-dash-stat__label">Creator Rank</div>
                <div className="mk-dash-stat__value" style={{ fontSize: '18px', color: '#f59e0b' }}>Top 5%</div>
                <div className="mk-dash-stat__change" style={{ color: '#f59e0b' }}>⭐ 2x Payout Tier</div>
              </div>
            </div>

            {/* Mini Chart */}
            <div className="mk-dash-chart" style={{ marginTop: '14px', marginBottom: '14px', padding: '14px', border: '1px solid var(--mk-border)' }}>
              <div className="mk-dash-chart__header">
                <span className="mk-dash-chart__title">Weekly Earnings Velocity</span>
                <span className="mk-mono-badge" style={{ color: 'var(--mk-primary)' }}>+$180.40/wk</span>
              </div>
              <div className="mk-dash-chart__bars" style={{ height: '65px' }}>
                {chartHeights.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.08, ease: "easeOut" }}
                    className="mk-dash-chart__bar"
                    style={{ 
                      background: i === chartHeights.length - 1 ? 'var(--mk-primary)' : 'var(--mk-primary)',
                      opacity: i === chartHeights.length - 1 ? 1 : 0.35
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Realtime Live Activity Stream */}
            <div className="mk-activity-stream">
              <div className="mk-activity-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RedditIcon />
                  <span style={{ fontWeight: 600, color: 'var(--mk-text)' }}>r/Technology Comment Bounty</span>
                </div>
                <span className="mk-mono-badge" style={{ color: '#10b981' }}>+$1.50 APPROVED</span>
              </div>
              <div className="mk-activity-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <YouTubeIcon />
                  <span style={{ fontWeight: 600, color: 'var(--mk-text)' }}>Video Discussion Response</span>
                </div>
                <span className="mk-mono-badge" style={{ color: '#6366f1' }}>CLAIMED • 35m LEFT</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ════════ FLOATING METRIC STRIP ════════ */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mk-container" 
          style={{ marginTop: '30px' }}
        >
          <div className="mk-metric-strip mk-tech-card">
            <span className="mk-corner-plus mk-corner-plus--tl">+</span>
            <span className="mk-corner-plus mk-corner-plus--tr">+</span>
            <span className="mk-corner-plus mk-corner-plus--bl">+</span>
            <span className="mk-corner-plus mk-corner-plus--br">+</span>

            <div className="mk-metric-item">
              <div className="mk-metric-item__icon" style={{ background: 'var(--mk-bg-subtle)', border: '1px solid var(--mk-border)', color: '#6366f1' }}>
                <Users size={22} />
              </div>
              <div>
                <div className="mk-metric-item__value">10,000+</div>
                <div className="mk-metric-item__label">Verified Creators</div>
              </div>
            </div>

            <div className="mk-metric-item">
              <div className="mk-metric-item__icon" style={{ background: 'var(--mk-bg-subtle)', border: '1px solid var(--mk-border)', color: '#10b981' }}>
                <DollarSign size={22} />
              </div>
              <div>
                <div className="mk-metric-item__value">$150,000+</div>
                <div className="mk-metric-item__label">Paid to Workers</div>
              </div>
            </div>

            <div className="mk-metric-item">
              <div className="mk-metric-item__icon" style={{ background: 'var(--mk-bg-subtle)', border: '1px solid var(--mk-border)', color: '#f59e0b' }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="mk-metric-item__value">99.4%</div>
                <div className="mk-metric-item__label">Submission Approval</div>
              </div>
            </div>

            <div className="mk-metric-item">
              <div className="mk-metric-item__icon" style={{ background: 'var(--mk-bg-subtle)', border: '1px solid var(--mk-border)', color: '#6366f1' }}>
                <Zap size={22} />
              </div>
              <div>
                <div className="mk-metric-item__value">&lt; 24h</div>
                <div className="mk-metric-item__label">Fast Payout Speed</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ════════ MULTI-PLATFORM BENTO SHOWCASE ════════ */}
      <section className="mk-section mk-section--subtle" style={{ position: 'relative', zIndex: 1 }}>
        <div className="mk-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mk-section__header"
          >
            <div className="mk-live-pill" style={{ marginBottom: '12px' }}>
              <Flame size={14} color="#6366f1" />
              <span>Multi-Platform Ecosystem</span>
            </div>
            <h2 className="mk-section__title">Earn Across Every Major Social Platform</h2>
            <p className="mk-section__subtitle">From Reddit communities to YouTube content, pick tasks that match your strengths.</p>
          </motion.div>

          <div className="mk-bento-grid">
            {/* Reddit Card */}
            <motion.div 
              whileHover={{ y: -6 }}
              className="mk-bento-card mk-bento-col-6 mk-tech-card"
            >
              <span className="mk-corner-plus mk-corner-plus--tl">+</span>
              <span className="mk-corner-plus mk-corner-plus--tr">+</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RedditIcon />
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mk-text)' }}>Reddit Engagement</h3>
                    <span style={{ fontSize: '12px', color: '#ff4500', fontWeight: 600 }}>Highest Payout per Task</span>
                  </div>
                </div>
                <span className="mk-mono-badge" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                  Up to $15.00/task
                </span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                Participate in authentic subreddit discussions, share insightful opinions, and create organic community value.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto' }}>
                <span className="mk-mono-badge">Comment Tasks</span>
                <span className="mk-mono-badge">Discussion Posts</span>
                <span className="mk-mono-badge">Karma Farming</span>
              </div>
            </motion.div>

            {/* YouTube Card */}
            <motion.div 
              whileHover={{ y: -6 }}
              className="mk-bento-card mk-bento-col-6 mk-tech-card"
            >
              <span className="mk-corner-plus mk-corner-plus--tl">+</span>
              <span className="mk-corner-plus mk-corner-plus--tr">+</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <YouTubeIcon />
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mk-text)' }}>YouTube Tasks</h3>
                    <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>Open for Everyone</span>
                  </div>
                </div>
                <span className="mk-mono-badge" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                  Instant Claim
                </span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                Support emerging creators with video likes, authentic comment replies, subscriptions, and short-form engagement.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto' }}>
                <span className="mk-mono-badge">Video Comments</span>
                <span className="mk-mono-badge">Likes &amp; Subscribes</span>
                <span className="mk-mono-badge">Shorts Engagement</span>
              </div>
            </motion.div>

            {/* X / Twitter */}
            <motion.div whileHover={{ y: -4 }} className="mk-bento-card mk-bento-col-4 mk-tech-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <XIcon />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--mk-text)' }}>X / Twitter</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--mk-text-secondary)', lineHeight: 1.5 }}>
                Engage in trending tech, crypto, and lifestyle discussions with insightful replies and quote tweets.
              </p>
            </motion.div>

            {/* Instagram */}
            <motion.div whileHover={{ y: -4 }} className="mk-bento-card mk-bento-col-4 mk-tech-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <InstagramIcon />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--mk-text)' }}>Instagram</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--mk-text-secondary)', lineHeight: 1.5 }}>
                Engage with Reels, creators, and carousel campaigns to boost community discovery and reach.
              </p>
            </motion.div>

            {/* TikTok & LinkedIn */}
            <motion.div whileHover={{ y: -4 }} className="mk-bento-card mk-bento-col-4 mk-tech-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <LinkedInIcon />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--mk-text)' }}>LinkedIn &amp; TikTok</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--mk-text-secondary)', lineHeight: 1.5 }}>
                Professional discussion comments, B2B campaigns, and viral video reactions.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════ 3-STEP JOURNEY ════════ */}
      <section className="mk-section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="mk-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mk-section__header"
          >
            <div className="mk-live-pill" style={{ marginBottom: '12px' }}>
              <Zap size={14} color="#10b981" />
              <span>3 Simple Steps</span>
            </div>
            <h2 className="mk-section__title">How You Start Earning</h2>
            <p className="mk-section__subtitle">Zero complicated hurdles. Sign up and claim your first task in under 2 minutes.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <motion.div whileHover={{ y: -6 }} className="mk-bento-card mk-tech-card" style={{ textAlign: 'center', alignItems: 'center' }}>
              <span className="mk-corner-plus mk-corner-plus--tl">+</span>
              <span className="mk-corner-plus mk-corner-plus--tr">+</span>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--mk-bg-subtle)', border: '1px solid var(--mk-border-medium)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, marginBottom: '16px' }}>
                01
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '8px' }}>Pick Your Campaign</h3>
              <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.6 }}>
                Browse hundreds of live tasks matching your verified accounts and niche interests.
              </p>
            </motion.div>

            <motion.div whileHover={{ y: -6 }} className="mk-bento-card mk-tech-card" style={{ textAlign: 'center', alignItems: 'center' }}>
              <span className="mk-corner-plus mk-corner-plus--tl">+</span>
              <span className="mk-corner-plus mk-corner-plus--tr">+</span>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--mk-bg-subtle)', border: '1px solid var(--mk-border-medium)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, marginBottom: '16px' }}>
                02
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '8px' }}>Create &amp; Submit Proof</h3>
              <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.6 }}>
                Write genuine, thoughtful content following instructions, then upload your link or screenshot proof.
              </p>
            </motion.div>

            <motion.div whileHover={{ y: -6 }} className="mk-bento-card mk-tech-card" style={{ textAlign: 'center', alignItems: 'center' }}>
              <span className="mk-corner-plus mk-corner-plus--tl">+</span>
              <span className="mk-corner-plus mk-corner-plus--tr">+</span>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--mk-bg-subtle)', border: '1px solid var(--mk-border-medium)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, marginBottom: '16px' }}>
                03
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '8px' }}>Instant Cash Payout</h3>
              <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.6 }}>
                Earnings credit directly to your wallet. Withdraw anytime via UPI or Crypto addresses.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════ CREATOR SOCIAL PROOF & TESTIMONIALS ════════ */}
      <section className="mk-section mk-section--subtle" style={{ position: 'relative', zIndex: 1 }}>
        <div className="mk-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mk-section__header"
          >
            <div className="mk-live-pill" style={{ marginBottom: '12px' }}>
              <Award size={14} color="#6366f1" />
              <span>Verified Creator Stories</span>
            </div>
            <h2 className="mk-section__title">Trusted by Real Community Writers</h2>
            <p className="mk-section__subtitle">Hear from freelancers and brand builders who earn daily on CreateForEarn.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <motion.div whileHover={{ y: -4 }} className="mk-bento-card mk-tech-card">
              <span className="mk-corner-plus mk-corner-plus--tl">+</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                    RS
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--mk-text)' }}>Rohan S.</div>
                    <div style={{ fontSize: '11px', color: 'var(--mk-text-muted)' }}>Top 1% Reddit Worker</div>
                  </div>
                </div>
                <span className="mk-mono-badge" style={{ color: '#10b981' }}>+$1,840.00 Earned</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--mk-text-secondary)', lineHeight: 1.6 }}>
                &ldquo;Payouts are genuinely instantaneous. I do 3-4 comment tasks during my commute every morning and withdraw via UPI each Friday without any issues.&rdquo;
              </p>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} className="mk-bento-card mk-tech-card">
              <span className="mk-corner-plus mk-corner-plus--tl">+</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                    AT
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--mk-text)' }}>Ananya T.</div>
                    <div style={{ fontSize: '11px', color: 'var(--mk-text-muted)' }}>YouTube &amp; Content Creator</div>
                  </div>
                </div>
                <span className="mk-mono-badge" style={{ color: '#10b981' }}>+$960.50 Earned</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--mk-text-secondary)', lineHeight: 1.6 }}>
                &ldquo;The verification process is super transparent. The dashboard shows you exactly which tasks are approved and how much you have earned in real time.&rdquo;
              </p>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} className="mk-bento-card mk-tech-card">
              <span className="mk-corner-plus mk-corner-plus--tl">+</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                    MK
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--mk-text)' }}>Marcus K.</div>
                    <div style={{ fontSize: '11px', color: 'var(--mk-text-muted)' }}>SaaS Growth Marketer (Client)</div>
                  </div>
                </div>
                <span className="mk-mono-badge" style={{ color: '#6366f1' }}>4.8x ROI Campaign</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--mk-text-secondary)', lineHeight: 1.6 }}>
                &ldquo;We launched a Reddit engagement campaign for our SaaS product launch. The quality of responses was authentic and drove real referral signups.&rdquo;
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════ ARCHITECTURAL CTA BANNER ════════ */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="mk-section" 
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="mk-container">
          <div className="mk-cta-luminous mk-tech-card">
            <span className="mk-corner-plus mk-corner-plus--tl">+</span>
            <span className="mk-corner-plus mk-corner-plus--tr">+</span>
            <span className="mk-corner-plus mk-corner-plus--bl">+</span>
            <span className="mk-corner-plus mk-corner-plus--br">+</span>
            <h2 className="mk-cta-luminous__title">
              Ready to Monetize Your Content Skills?
            </h2>
            <p className="mk-cta-luminous__desc">
              Join thousands of creators earning daily by providing authentic community engagement. Create a free account now.
            </p>
            <div className="mk-cta-luminous__actions">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link href="/signup" className="mk-btn mk-btn--primary mk-btn--lg" style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)' }}>
                  Start Earning Now <ArrowRight size={18} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link href="/for-clients" className="mk-btn mk-btn--outline mk-btn--lg">
                  Launch a Campaign
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
