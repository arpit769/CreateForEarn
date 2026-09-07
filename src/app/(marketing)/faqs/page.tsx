'use client';

import { HelpCircle, ChevronDown, Sparkles, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function FAQsPage() {
  const faqs = [
    {
      q: "How does verification work?",
      a: "To ensure high-quality interactions, we automatically verify every linked Reddit and YouTube account. Your accounts must meet minimum requirements (e.g. account age, organic history). Passwords are never requested; verification is done securely."
    },
    {
      q: "How do I get paid?",
      a: "Once you complete a task and submit proof, our system tracks and validates it. After approval, the earnings are added directly to your wallet balance. You can request a withdrawal to UPI or your preferred Crypto (USDT) address anytime."
    },
    {
      q: "What is the minimum withdrawal amount?",
      a: "The minimum withdrawal limit is set to a creator-friendly $1.00. This ensures that you can withdraw your money quickly without having to wait to build up a large balance."
    },
    {
      q: "Can I link multiple social accounts?",
      a: "Yes, you can link multiple verified Reddit and YouTube accounts to your profile. This allows you to claim more matched tasks across different niches while still keeping our platform spam-free."
    },
    {
      q: "Is promotional spam allowed?",
      a: "No. Non-promotional, authentic engagement is strictly required. Posting direct advertising, promotional spam, affiliate links, or deceptive marketing content is not allowed and will result in immediate rejection of your submissions."
    },
    {
      q: "Are there any fees for creators?",
      a: "CreateForEarn is completely free for workers and creators. There are no registration or subscription fees. You keep 100% of the listed task bounty."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mk-mesh-container">
      {/* Blueprint Grid Background Pattern */}
      <div className="mk-grid-bg" />

      <div style={{ maxWidth: '850px', margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="mk-live-pill" style={{ margin: '0 auto 16px' }}>
            <span className="mk-live-dot" />
            <span>Help &amp; Answers</span>
          </div>

          <h1 className="mk-section__title" style={{ fontSize: 'clamp(32px, 5vw, 50px)', marginBottom: '16px' }}>
            Frequently Asked <span className="mk-gradient-text">Questions</span>
          </h1>
          <p className="mk-section__subtitle" style={{ fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
            Got questions? We've got answers. Learn how to maximize your earnings on CreateForEarn.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '48px' }}>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className="mk-bento-card"
                style={{ 
                  padding: 0,
                  overflow: 'hidden',
                  border: isOpen ? '1px solid var(--mk-primary-border)' : '1px solid var(--mk-border)',
                }}
              >
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  style={{ 
                    width: '100%', 
                    padding: '20px 24px', 
                    background: 'none', 
                    border: 'none', 
                    textAlign: 'left', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    color: 'var(--mk-text)',
                    fontWeight: 700,
                    fontSize: '16px'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <HelpCircle size={18} color="var(--mk-primary)" />
                    {faq.q}
                  </span>
                  <ChevronDown 
                    size={18} 
                    style={{ 
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                      transition: 'transform 0.2s',
                      color: 'var(--mk-text-muted)',
                      flexShrink: 0
                    }} 
                  />
                </button>

                {isOpen && (
                  <div style={{ 
                    padding: '0 24px 20px 54px', 
                    fontSize: '14px', 
                    lineHeight: 1.7, 
                    color: 'var(--mk-text-secondary)' 
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Discord Help Banner */}
        <div className="mk-bento-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', padding: '28px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '4px' }}>
              Still have questions?
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', margin: 0 }}>
              Join our active Discord community for real-time support from our team and fellow creators.
            </p>
          </div>
          <a
            href="https://discord.gg/5qu5s87kKu"
            target="_blank"
            rel="noreferrer"
            className="mk-btn mk-btn--primary mk-btn--md"
          >
            Join Discord Community <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
