'use client';

import { Mail, HelpCircle, AlertCircle } from 'lucide-react';

export default function HelpPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 24px', color: 'var(--text-secondary)' }}>
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Help & Support
        </h1>
        <p style={{ fontSize: '18px' }}>
          Have trouble with verification, tasks, or withdrawals? Get in touch with our team.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '64px' }}>
        <div style={{ padding: '32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '24px', textAlign: 'center' }}>
          <Mail size={32} color="var(--accent-blue)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Email Support</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>Get a response within 24 hours.</p>
          <a href="mailto:support@createforearn.com" style={{ color: 'var(--accent-blue)', fontWeight: 600, textDecoration: 'none' }}>support@createforearn.com</a>
        </div>

        <div style={{ padding: '32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '24px', textAlign: 'center' }}>
          <HelpCircle size={32} color="var(--accent-purple)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>FAQs</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>Check if your question is already answered.</p>
          <a href="/faqs" style={{ color: 'var(--accent-purple)', fontWeight: 600, textDecoration: 'none' }}>Go to FAQ Page →</a>
        </div>
      </div>

      <div style={{ padding: '24px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '16px', display: 'flex', gap: '16px' }}>
        <AlertCircle size={24} color="var(--accent-orange)" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>Before opening a ticket</h4>
          <p style={{ fontSize: '14px', lineHeight: 1.6 }}>
            Please make sure your linked Reddit profile link is set correctly on the Profile page. Incorrect profile URLs are the most common cause of task verification rejections.
          </p>
        </div>
      </div>
    </div>
  );
}
