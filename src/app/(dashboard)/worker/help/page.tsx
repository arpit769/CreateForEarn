'use client';

import React from 'react';
import { HelpCircle, AlertCircle } from 'lucide-react';

const DiscordIcon = ({ size = 32, color = "#5865F2", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 127.14 96.36" fill={color} style={style}>
    <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.87-.64,1.71-1.32,2.51-2a75.52,75.52,0,0,0,73,0c.8.7,1.64,1.38,2.51,2a68.43,68.43,0,0,1-10.5,5A77.7,77.7,0,0,0,102,96.36a105.73,105.73,0,0,0,31-18.83C130.1,49.22,124.55,26.41,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.78,46,53.78,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96,46,96,53,91,65.69,84.69,65.69Z" />
  </svg>
);

const TelegramIcon = ({ size = 32, color = "#24A1DE", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.84 8.67c-.14.62-.51.78-1.03.49l-2.8-2.06-1.35 1.3c-.15.15-.28.28-.57.28l.2-2.84 5.17-4.67c.23-.2-.05-.31-.35-.11L8.03 13.1l-2.75-.86c-.6-.19-.61-.6.13-.89l10.74-4.14c.5-.18.96.13.79.79z" />
  </svg>
);

export default function WorkerHelpPage() {
  return (
    <div className="dashboard-content-container" style={{ maxWidth: '900px', margin: '0 auto', color: 'var(--text-secondary)' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Help & Support</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Have trouble with verification, tasks, or withdrawals? Get in touch with our team.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {/* Discord Card */}
        <div style={{ padding: '24px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '220px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(88, 101, 242, 0.1)', marginBottom: '16px' }}>
              <DiscordIcon size={24} color="#5865F2" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Discord Community</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>Join our community to chat with other creators and get direct support.</p>
          </div>
          <a href="https://discord.gg/5qu5s87kKu" target="_blank" rel="noopener noreferrer" style={{ color: '#5865F2', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>Join Discord →</a>
        </div>

        {/* Telegram Card */}
        <div style={{ padding: '24px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '220px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(36, 161, 222, 0.1)', marginBottom: '16px' }}>
              <TelegramIcon size={24} color="#24A1DE" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Telegram Channel</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>Get instant updates, announcements, and quick support.</p>
          </div>
          <a href="https://t.me/+S9XRvJ5mELkyYmI1" target="_blank" rel="noopener noreferrer" style={{ color: '#24A1DE', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>Join Telegram →</a>
        </div>

        {/* FAQs Card */}
        <div style={{ padding: '24px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '220px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', marginBottom: '16px' }}>
              <HelpCircle size={24} color="var(--accent-purple)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>FAQs</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>Check if your question is already answered in our FAQ documentation.</p>
          </div>
          <a href="/faqs" style={{ color: 'var(--accent-purple)', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>Go to FAQ Page →</a>
        </div>
      </div>

      <div style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '16px', display: 'flex', gap: '16px' }}>
        <AlertCircle size={24} color="var(--accent-orange)" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>Before reaching out to support</h4>
          <p style={{ fontSize: '13px', lineHeight: 1.6 }}>
            Please make sure your linked Reddit profile link is set correctly on the Profile page. Incorrect profile URLs are the most common cause of task verification rejections.
          </p>
        </div>
      </div>
    </div>
  );
}
