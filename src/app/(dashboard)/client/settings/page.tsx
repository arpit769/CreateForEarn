'use client';

import React, { useState } from 'react';
import { 
  Settings, User, Bell, Shield, Key, Save, Check
} from 'lucide-react';

export default function ClientSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [companyName, setCompanyName] = useState('Brand Connect Media');
  const [contactEmail, setContactEmail] = useState('marketing@brandconnect.io');
  const [website, setWebsite] = useState('https://brandconnect.io');
  const [autoApprove, setAutoApprove] = useState(true);
  const [minQualityScore, setMinQualityScore] = useState(85);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ padding: '8px 0 32px', maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Brand Settings & Preferences
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
          Manage your organization profile, notifications, and automated approval criteria.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Company Profile Section */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="#7c3aed" /> Company Profile
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Brand / Organization Name
              </label>
              <input 
                type="text" 
                value={companyName} 
                onChange={(e) => setCompanyName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Billing Contact Email
              </label>
              <input 
                type="email" 
                value={contactEmail} 
                onChange={(e) => setContactEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Company Website URL
            </label>
            <input 
              type="url" 
              value={website} 
              onChange={(e) => setWebsite(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Deliverables Automation */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#10b981" /> Verification & Auto-Approve Rules
          </h2>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Enable Automated Deliverable Approval
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Automatically verify live posts that meet minimum quality and karma requirements.
              </div>
            </div>

            <input 
              type="checkbox" 
              checked={autoApprove} 
              onChange={(e) => setAutoApprove(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#7c3aed', cursor: 'pointer' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Minimum AI Verification Score (out of 100): <strong style={{ color: 'var(--text-primary)' }}>{minQualityScore}</strong>
            </label>
            <input 
              type="range" 
              min="50" 
              max="100" 
              value={minQualityScore} 
              onChange={(e) => setMinQualityScore(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#7c3aed', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Notifications */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="#f59e0b" /> Email Notifications
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              'Email me whenever a writer submits a new deliverable',
              'Email me when a campaign budget is 80% consumed',
              'Send weekly summary performance reports'
            ].map((text, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: '#7c3aed' }} />
                {text}
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)'
            }}
          >
            <Save size={16} /> Save Changes
          </button>

          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
              <Check size={16} /> Settings saved successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
