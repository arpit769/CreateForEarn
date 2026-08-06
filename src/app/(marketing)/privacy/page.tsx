'use client';

import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 24px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <Shield size={48} color="var(--accent-cyan)" style={{ marginBottom: '16px' }} />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Last updated: August 2026</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us when you create an account, link a Reddit profile, or request a withdrawal. This includes your email, name, wallet address, and public Reddit profile data (username, post history, karma, and account age).
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>2. How We Use Your Data</h2>
          <p>
            We use your data strictly to operate and verify your account. Reddit details are verified once to match target subreddit requirements. Payout information is only used to transfer your earnings. We do not sell or lease your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>3. Security Measures</h2>
          <p>
            We implement high-grade physical, electronic, and managerial procedures to safeguard your information. We never request your Reddit account passwords or private credentials. All connections are secured via SSL/TLS.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>4. Cookies Policy</h2>
          <p>
            We use essential cookies to maintain user sessions. These cookies do not track cross-site behaviors or build marketing profiles. You can manage cookies directly through your browser settings.
          </p>
        </section>
      </div>
    </div>
  );
}
