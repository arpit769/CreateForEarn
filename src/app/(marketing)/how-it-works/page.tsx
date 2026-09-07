'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  UserPlus, ClipboardList, PenTool, CheckCircle2,
  Rocket, DollarSign, Users, FileText, Eye, Wallet,
  Smartphone, Bitcoin, ArrowRight
} from 'lucide-react';

const steps = [
  { icon: UserPlus, title: 'Sign Up', desc: 'Create your free account as a writer or client.', color: '#4F46E5', bg: 'rgba(79,70,229,0.1)' },
  { icon: ClipboardList, title: 'Choose or Create Task', desc: 'Writers pick tasks, clients create campaigns.', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { icon: PenTool, title: 'Create & Submit', desc: 'Write original content and submit for review.', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { icon: CheckCircle2, title: 'Review & Approve', desc: 'Quality check by client or admin.', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { icon: Rocket, title: 'Go Live', desc: 'Post goes live on the selected platform.', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { icon: DollarSign, title: 'Earn Rewards', desc: 'Get base pay + performance bonus for great results.', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
];

const stats = [
  { icon: Users, value: '7,500+', label: 'Active Writers' },
  { icon: FileText, value: '25,000+', label: 'Tasks Completed' },
  { icon: Eye, value: '3.5M+', label: 'Total Views Generated' },
  { icon: DollarSign, value: '$250K+', label: 'Paid to Writers' },
  { icon: Users, value: '200+', label: 'Active Clients' },
];

const faqs = [
  { q: 'Who can sign up for CreateForEarn?', a: 'Anyone with a valid social media account can apply. We verify accounts to ensure quality engagement and compliance with our standards.' },
  { q: 'What platforms do you support?', a: 'We support Reddit, YouTube, Instagram, X (Twitter), LinkedIn, Facebook, and TikTok — with more platforms coming soon.' },
  { q: 'How exactly do I get paid?', a: 'You earn money for every approved task. Earnings go into your wallet. Withdraw via UPI, Crypto (USDT), or Cozy Wallet.' },
  { q: 'What kind of content is allowed?', a: 'Only 100% original, human-written content. No AI-generated content, spam, or fake engagement. Tasks must add genuine value.' },
];

const sampleTasks = [
  { community: 'r/ContentCreators', type: 'COMMENT', title: 'Task ID: 12 - Explain training datasets', desc: 'Provide a helpful 2-3 sentence comment explaining how transformer-based models utilize tokenizers during pre-training.', price: '+$0.40' },
  { community: 'r/gaming', type: 'TEXT', title: 'Task ID: 15 - Discussion: Future of VR', desc: 'Post a text thread discussing upcoming haptic technologies. Must engage readers with an open-ended question.', price: '+$0.65' },
  { community: 'r/programming', type: 'IMAGE', title: 'Task ID: 19 - Clean workspace setup', desc: 'Share an image post showcasing a clean minimal programming workspace. Submissions must use the discussion flair.', price: '+$0.50' },
];

export default function HowItWorksPage() {
  return (
    <div>
      {/* ════════ HERO ════════ */}
      <section className="mk-section mk-pt-header" style={{ textAlign: 'center' }}>
        <div className="mk-container">
          <h1 className="mk-section__title" style={{ fontSize: 'clamp(36px, 5vw, 52px)' }}>How It Works</h1>
          <p className="mk-section__subtitle" style={{ margin: '0 auto 56px' }}>Simple steps to start earning</p>

          {/* Step Flow */}
          <div className="mk-steps">
            {steps.map((step, i) => (
              <div key={step.title} style={{ display: 'contents' }}>
                <div className="mk-step">
                  <div className="mk-step__icon" style={{ background: step.bg, color: step.color }}>
                    <step.icon size={28} />
                  </div>
                  <div className="mk-step__number">{i + 1}. {step.title}</div>
                  <div className="mk-step__desc">{step.desc}</div>
                </div>
                {i < steps.length - 1 && (
                  <div className="mk-step-arrow">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ STATS BAR ════════ */}
      <section className="mk-section" style={{ paddingTop: '0' }}>
        <div className="mk-container">
          <div className="mk-stats-bar">
            {stats.map(stat => (
              <div key={stat.label} className="mk-stats-bar__item">
                <div className="mk-stats-bar__icon">
                  <stat.icon size={20} />
                </div>
                <div>
                  <div className="mk-stats-bar__value">{stat.value}</div>
                  <div className="mk-stats-bar__label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ PAYMENT + FAQ + TASKS ════════ */}
      <section className="mk-section mk-section--subtle">
        <div className="mk-container">
          <div className="mk-split-layout">
            {/* Left: Payment + FAQ */}
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '24px' }}>
                Get paid however you want
              </h2>

              <div className="mk-payment-cards" style={{ marginBottom: '32px' }}>
                <div className="mk-payment-card">
                  <div className="mk-payment-card__icon"><Smartphone size={22} /></div>
                  <div className="mk-payment-card__name">UPI</div>
                  <div className="mk-payment-card__desc">Instant & easy payments</div>
                </div>
                <div className="mk-payment-card">
                  <div className="mk-payment-card__icon"><Bitcoin size={22} /></div>
                  <div className="mk-payment-card__name">USDT (Polygon)</div>
                  <div className="mk-payment-card__desc">Fast crypto payments</div>
                </div>
                <div className="mk-payment-card">
                  <div className="mk-payment-card__icon"><Wallet size={22} /></div>
                  <div className="mk-payment-card__name">Cozy Wallet</div>
                  <div className="mk-payment-card__desc">Secure wallet withdrawals</div>
                </div>
              </div>

              {/* FAQ */}
              <div>
                {faqs.map((faq, i) => (
                  <details key={i} className="mk-faq">
                    <summary>{faq.q}</summary>
                    <p>{faq.a}</p>
                  </details>
                ))}
              </div>

              {/* Discord CTA */}
              <div className="mk-discord-cta">
                <div className="mk-discord-cta__icon">
                  <Users size={20} color="var(--mk-primary)" />
                </div>
                <div className="mk-discord-cta__text">
                  <div className="mk-discord-cta__title">Common questions, straight answers</div>
                  <div className="mk-discord-cta__subtitle">For more queries: <span style={{ textDecoration: 'underline', fontWeight: 600 }}>Join our Discord</span></div>
                </div>
                <a
                  href="https://discord.gg/5qu5s87kKu"
                  target="_blank"
                  rel="noreferrer"
                  className="mk-discord-cta__btn"
                >
                  <svg width="16" height="16" viewBox="0 0 127.14 96.36" fill="currentColor"><path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.87-.64,1.71-1.32,2.51-2a75.52,75.52,0,0,0,73,0c.8.7,1.64,1.38,2.51,2a68.43,68.43,0,0,1-10.5,5A77.7,77.7,0,0,0,102,96.36a105.73,105.73,0,0,0,31-18.83C130.1,49.22,124.55,26.41,107.7,8.07Z"/></svg>
                  Join Discord
                </a>
              </div>
            </div>

            {/* Right: Browse Tasks + Simulator */}
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '8px' }}>Browse Tasks</h2>
                <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', marginBottom: '16px' }}>
                  Browse a massive marketplace of paid tasks. Find communities you actually care about.
                </p>
                <Link href="/signup" className="mk-btn mk-btn--primary mk-btn--sm">
                  Browse Tasks <ArrowRight size={16} />
                </Link>
              </div>

              {/* Task Simulator */}
              <div className="mk-task-preview">
                <div className="mk-task-preview__header">Simulator Tasks</div>
                {sampleTasks.map((task, i) => (
                  <div key={i} className="mk-task-preview__item">
                    <div className="mk-task-preview__info">
                      <div className="mk-task-preview__community">
                        <span className="mk-task-preview__community-badge">{task.community}</span>
                        <span className="mk-task-preview__type-badge">{task.type}</span>
                      </div>
                      <div className="mk-task-preview__task-title">{task.title}</div>
                      <div className="mk-task-preview__task-desc">{task.desc}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <span className="mk-task-preview__price">{task.price}</span>
                      <button className="mk-task-preview__claim">Claim Task</button>
                    </div>
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
