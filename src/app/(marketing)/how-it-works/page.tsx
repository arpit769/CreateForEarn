'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  UserPlus, ClipboardList, PenTool, CheckCircle2,
  Rocket, DollarSign, Users, FileText, Eye, Wallet,
  Smartphone, Bitcoin, ArrowRight, Sparkles, HelpCircle,
  ChevronDown, Zap
} from 'lucide-react';

const steps = [
  { icon: UserPlus, title: 'Create Free Account', desc: 'Sign up in 30 seconds and connect your social accounts for instant verification.', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
  { icon: ClipboardList, title: 'Pick Matched Tasks', desc: 'Browse available opportunities across Reddit, YouTube, and more that match your niche.', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  { icon: PenTool, title: 'Create & Submit', desc: 'Write authentic, insightful comments or perform actions, then submit your proof link.', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  { icon: CheckCircle2, title: 'Rapid Review', desc: 'Automated screenshot and admin checks verify your submission quickly and accurately.', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
  { icon: DollarSign, title: 'Direct Wallet Credit', desc: 'Base reward plus performance bonus is instantly credited to your wallet balance.', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
  { icon: Rocket, title: 'Withdraw Anytime', desc: 'Cash out directly to UPI, USDT / Crypto, or Cozy Wallet with a user-friendly $1.00 minimum.', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
];

const stats = [
  { icon: Users, value: '10,000+', label: 'Active Creators' },
  { icon: FileText, value: '45,000+', label: 'Tasks Completed' },
  { icon: Eye, value: '5.2M+', label: 'Organic Impressions' },
  { icon: DollarSign, value: '$150K+', label: 'Paid to Creators' },
  { icon: Zap, value: '99.4%', label: 'Approval Rate' },
];

const faqs = [
  { q: 'Who is eligible to join CreateForEarn?', a: 'Anyone with an active social media account (such as Reddit or YouTube). We run a fast, automatic verification check on account age and standing to prevent spam.' },
  { q: 'Which social platforms are supported today?', a: 'We currently support Reddit (Comments, Posts, Karma Farming) and YouTube (Comments, Likes, Subscribes), with Instagram, X (Twitter), TikTok, and LinkedIn expanding rapidly.' },
  { q: 'How and when do I get paid?', a: 'Every approved task immediately funds your wallet balance. You can request a payout anytime with a $1.00 minimum threshold via UPI or USDT / Crypto.' },
  { q: 'What standards must my submissions meet?', a: 'Only 100% human-crafted, thoughtful, and organic contributions are accepted. Any AI-generated spam or bot manipulation is immediately flagged and rejected.' },
];

const sampleTasks = [
  { community: 'r/ContentCreators', type: 'REDDIT COMMENT', title: 'Task ID: 12 - Discuss creator monetization workflows', desc: 'Provide an authentic, insightful 2-3 sentence comment sharing monetization strategies.', price: '+$0.85' },
  { community: 'Tech Reviews Channel', type: 'YOUTUBE COMMENT', title: 'Task ID: 15 - Engagement reply on AI tools video', desc: 'Watch the video, drop an engaging question regarding software benchmarks.', price: '+$0.65' },
  { community: 'r/WebDev', type: 'REDDIT POST', title: 'Task ID: 19 - Share responsive UI optimization tip', desc: 'Submit a text thread discussing best CSS performance practices with the discussion flair.', price: '+$1.20' },
];

export default function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="mk-mesh-container">
      {/* Blueprint Grid Background Pattern */}
      <div className="mk-grid-bg" />

      {/* ════════ HERO ════════ */}
      <section className="mk-section mk-pt-header" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="mk-container">
          <div className="mk-live-pill" style={{ margin: '0 auto 16px' }}>
            <span className="mk-live-dot" />
            <span>Simple, Transparent Workflow</span>
          </div>

          <h1 className="mk-section__title" style={{ fontSize: 'clamp(36px, 5vw, 56px)', marginBottom: '16px' }}>
            How <span className="mk-gradient-text">CreateForEarn</span> Works
          </h1>
          <p className="mk-section__subtitle" style={{ margin: '0 auto 48px', maxWidth: '650px' }}>
            From browsing matched opportunities to receiving cash in your account, here is how you earn step-by-step.
          </p>

          {/* 6-Step Modern Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', textAlign: 'left' }}>
            {steps.map((step, i) => (
              <div key={step.title} className="mk-bento-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: step.bg, color: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <step.icon size={22} />
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--mk-text-muted)', opacity: 0.5 }}>
                    0{i + 1}
                  </span>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '8px' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ METRIC STRIP ════════ */}
      <section className="mk-section" style={{ paddingTop: '10px', position: 'relative', zIndex: 1 }}>
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

      {/* ════════ PAYMENT + FAQ + TASKS ════════ */}
      <section className="mk-section mk-section--subtle" style={{ position: 'relative', zIndex: 1 }}>
        <div className="mk-container">
          <div className="mk-split-layout">
            {/* Left: Payment Channels + Accordion FAQ */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
                <Wallet size={14} /> Payout Options
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--mk-text)', marginBottom: '18px' }}>
                Get Paid Instantly &amp; Securely
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '32px' }}>
                <div className="mk-bento-card" style={{ padding: '16px', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                    <Smartphone size={22} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mk-text)' }}>UPI Transfer</div>
                  <div style={{ fontSize: '11px', color: 'var(--mk-text-muted)' }}>Direct to bank</div>
                </div>

                <div className="mk-bento-card" style={{ padding: '16px', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                    <Bitcoin size={22} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mk-text)' }}>USDT (Crypto)</div>
                  <div style={{ fontSize: '11px', color: 'var(--mk-text-muted)' }}>Polygon network</div>
                </div>

                <div className="mk-bento-card" style={{ padding: '16px', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                    <Wallet size={22} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mk-text)' }}>Cozy Wallet</div>
                  <div style={{ fontSize: '11px', color: 'var(--mk-text-muted)' }}>Instant internal</div>
                </div>
              </div>

              {/* Modern Accordion FAQ */}
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '14px' }}>
                Frequently Asked Questions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {faqs.map((faq, i) => {
                  const isOpen = openFaq === i;
                  return (
                    <div 
                      key={i} 
                      style={{ 
                        background: 'var(--mk-bg-card)', 
                        border: '1px solid var(--mk-border)', 
                        borderRadius: '14px', 
                        overflow: 'hidden',
                        transition: 'all 0.2s'
                      }}
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'none',
                          border: 'none',
                          color: 'var(--mk-text)',
                          fontWeight: 700,
                          fontSize: '14px',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        {faq.q}
                        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
                      </button>
                      {isOpen && (
                        <div style={{ padding: '0 18px 16px', fontSize: '13px', color: 'var(--mk-text-secondary)', lineHeight: 1.6 }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Live Sample Marketplace Simulator */}
            <div>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>
                  <Sparkles size={14} /> Task Marketplace
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--mk-text)', marginBottom: '8px' }}>
                  Explore Real Tasks
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', marginBottom: '18px' }}>
                  Browse hundreds of daily campaigns across active communities.
                </p>
              </div>

              {/* Task Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sampleTasks.map((task, i) => (
                  <div key={i} className="mk-bento-card" style={{ padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mk-text)' }}>{task.community}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                          {task.type}
                        </span>
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: 900, color: '#10b981' }}>{task.price}</span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mk-text)', marginBottom: '4px' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--mk-text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                      {task.desc}
                    </div>

                    <Link href="/signup" className="mk-btn mk-btn--primary mk-btn--sm" style={{ alignSelf: 'flex-start' }}>
                      Claim in Dashboard <ArrowRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
