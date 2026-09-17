'use client';

import { useState } from 'react';
import { submitQuoraDetails } from '@/actions/users';
import { motion } from 'framer-motion';

export default function QuoraOnboardingScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const res = await submitQuoraDetails(formData);
    
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      window.location.reload();
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-primary)',
      padding: '24px'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-card"
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '14px',
            background: 'rgba(185, 43, 39, 0.12)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto',
            color: '#b92b27', boxShadow: '0 8px 24px rgba(185, 43, 39, 0.15)',
            fontSize: '32px', fontWeight: 900
          }}>
            Q
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Verify Quora Account
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            To claim Quora tasks, please link your Quora profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Quora Profile Link / URL <span style={{ color: '#ef4444' }}>* (Compulsory)</span>
            </label>
            <input 
              name="profile_url"
              type="url"
              placeholder="e.g. https://www.quora.com/profile/Your-Name"
              required
              className="form-input"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', outline: 'none'
              }}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Provide the direct link to your Quora profile (e.g., https://www.quora.com/profile/Your-Name).
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Quora Username / Handle <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              name="username"
              type="text"
              placeholder="e.g. Your-Name or @Your-Name"
              required
              className="form-input"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', outline: 'none'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444', fontSize: '13px', fontWeight: 500
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #b92b27, #aa221e)',
              color: '#fff', border: 'none', fontSize: '15px', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(185, 43, 39, 0.3)'
            }}
          >
            {loading ? 'Submitting Details...' : 'Submit Quora Account for Verification'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
