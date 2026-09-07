'use client';

import { Shield, Sparkles } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="mk-mesh-container">
      {/* Blueprint Grid Background Pattern */}
      <div className="mk-grid-bg" />

      <div style={{ maxWidth: '850px', margin: '0 auto', padding: '60px 24px', color: 'var(--mk-text-secondary)', lineHeight: 1.8, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="mk-live-pill" style={{ margin: '0 auto 16px' }}>
            <span className="mk-live-dot" />
            <span>User Data &amp; Security</span>
          </div>
          <h1 className="mk-section__title" style={{ fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: '12px' }}>
            Privacy <span className="mk-gradient-text">Policy</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mk-text-muted)' }}>Last updated: August 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="mk-bento-card">
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '10px' }}>1. Information We Collect</h2>
            <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.7, margin: 0 }}>
              We collect information you provide directly to us when you create an account, link a social profile, or request a withdrawal. This includes your email, name, wallet address, and public social profile data (username, post history, karma, and account age).
            </p>
          </div>

          <div className="mk-bento-card">
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '10px' }}>2. How We Use Your Data</h2>
            <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.7, margin: 0 }}>
              We use your data strictly to operate and verify your account. Social details are verified once to match target campaign requirements. Payout information is only used to transfer your earnings. We do not sell or lease your personal information to third parties.
            </p>
          </div>

          <div className="mk-bento-card">
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '10px' }}>3. Security Measures</h2>
            <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.7, margin: 0 }}>
              We implement high-grade physical, electronic, and managerial procedures to safeguard your information. We never request your social account passwords or private credentials. All connections are secured via SSL/TLS.
            </p>
          </div>

          <div className="mk-bento-card">
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '10px' }}>4. Cookies Policy</h2>
            <p style={{ fontSize: '14px', color: 'var(--mk-text-secondary)', lineHeight: 1.7, margin: 0 }}>
              We use essential cookies to maintain user authentication sessions. These cookies do not track cross-site behaviors or build marketing profiles. You can manage cookies directly through your browser settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
