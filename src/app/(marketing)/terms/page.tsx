'use client';

import { FileText, Sparkles } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="mk-mesh-container">
      {/* Blueprint Grid Background Pattern */}
      <div className="mk-grid-bg" />

      <div style={{ maxWidth: '850px', margin: '0 auto', padding: '60px 24px', color: 'var(--mk-text-secondary)', lineHeight: 1.8, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="mk-live-pill" style={{ margin: '0 auto 16px' }}>
            <span className="mk-live-dot" />
            <span>Platform Agreement</span>
          </div>
          <h1 className="mk-section__title" style={{ fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: '12px' }}>
            Terms of <span className="mk-gradient-text">Service</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mk-text-muted)' }}>Last updated: August 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="mk-bento-card">
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '10px' }}>1. Acceptance of Terms</h2>
            <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.7, margin: 0 }}>
              By accessing or using CreateForEarn, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </div>

          <div className="mk-bento-card">
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '10px' }}>2. Account Verification &amp; Eligibility</h2>
            <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.7, margin: 0 }}>
              To sign up and receive payouts, your social accounts must meet our verification standards (including age and karma minimums). You agree to provide accurate and complete information and maintain only one account. Creating multiple fake accounts or linking invalid profiles will result in permanent ban and forfeiture of earnings.
            </p>
          </div>

          <div className="mk-bento-card">
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '10px' }}>3. Quality Requirements &amp; Content Policy</h2>
            <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.7, margin: 0 }}>
              Submissions must strictly adhere to the specific instructions provided in each task. <strong>Non-promotional and organic content only:</strong> Direct self-promotion, promotional spam, affiliate links, repetitive marketing ads, and low-effort automated comments are strictly prohibited. Admins review all submitted proofs. Submissions containing prohibited promotional content or violating task guidelines will be rejected immediately.
            </p>
          </div>

          <div className="mk-bento-card">
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '10px' }}>4. Payouts and Platform Rules</h2>
            <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.7, margin: 0 }}>
              Payouts are processed within 24 hours of request. The minimum withdrawal threshold is $1.00. We reserve the right to adjust processing procedures as necessary to support transactional network changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
