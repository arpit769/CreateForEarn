'use client';

import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 24px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <FileText size={48} color="var(--accent-purple)" style={{ marginBottom: '16px' }} />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Last updated: August 2026</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>1. Acceptance of Terms</h2>
          <p>
            By accessing or using CreateForEarn, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>2. Account Verification & Eligibility</h2>
          <p>
            To sign up and receive payouts, your Reddit account must meet our verification standards (including age and karma minimums). You agree to provide accurate and complete information and maintain only one account. Creating multiple accounts or linking invalid profiles will result in permanent ban and forfeiture of earnings.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>3. Quality Requirements & Rejections</h2>
          <p>
            Submissions must meet the specific instructions listed in the task description. Admins reserve the right to review all submitted proofs. Submissions that do not comply with the instructions (e.g. invalid links, low-effort or automated comments, deleting posts after approval) will be rejected, and repeat offences will lead to account termination.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>4. Payouts and Platform Fees</h2>
          <p>
            Payouts are processed weekly. The minimum withdrawal threshold is $3.00. We reserve the right to adjust platform fees and processing timelines as necessary to support transactional network changes.
          </p>
        </section>
      </div>
    </div>
  );
}
