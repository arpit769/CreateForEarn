'use client';

import { HelpCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function FAQsPage() {
  const faqs = [
    {
      q: "How does verification work?",
      a: "To ensure high-quality interactions on Reddit, we manually review and verify every linked Reddit account. Your account must meet our minimum requirements (e.g. age of 20 days and 50 karma). Passwords are never requested; verification is done securely."
    },
    {
      q: "How do I get paid?",
      a: "Once you complete a task and submit proof, our system tracks it. After approval, the earnings are added to your wallet balance. You can request a withdrawal to UPI or your preferred Crypto address directly from the Wallet page. Payouts are processed weekly."
    },
    {
      q: "What is the minimum withdrawal amount?",
      a: "The minimum withdrawal limit is set to a user-friendly $3.00. This ensures that you can withdraw your money quickly without having to wait to build up a large balance."
    },
    {
      q: "Can I link multiple Reddit accounts?",
      a: "Currently, you can link up to 3 verified Reddit accounts to your profile. This allows you to claim more matched tasks across different niches while still keeping our platform spam-free."
    },
    {
      q: "Is promotional content allowed?",
      a: "No. Non-promotional, authentic engagement is strictly required. Posting direct advertising, promotional spam, affiliate links, or deceptive marketing content is not allowed and will result in immediate rejection of your submissions."
    },
    {
      q: "Are there any fees?",
      a: "CreateForEarn is completely free for workers. There are no registration or subscription fees. We deduct a small platform processing fee only during withdrawal to cover network transactional costs."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 24px', color: 'var(--text-secondary)' }}>
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ fontSize: '18px' }}>
          Got questions? We've got answers. Learn how to maximize your earnings on CreateForEarn.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index} 
              style={{ 
                background: 'var(--bg-elevated)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                transition: 'all 0.3s' 
              }}
            >
              <button 
                onClick={() => setOpenIndex(isOpen ? null : index)}
                style={{ 
                  width: '100%', 
                  padding: '24px', 
                  background: 'none', 
                  border: 'none', 
                  textAlign: 'left', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '17px'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <HelpCircle size={20} color="var(--accent-purple)" />
                  {faq.q}
                </span>
                <ChevronDown 
                  size={18} 
                  style={{ 
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.3s',
                    color: 'var(--text-muted)'
                  }} 
                />
              </button>

              {isOpen && (
                <div style={{ 
                  padding: '0 24px 24px 56px', 
                  fontSize: '15px', 
                  lineHeight: 1.7, 
                  color: 'var(--text-muted)' 
                }}>
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
