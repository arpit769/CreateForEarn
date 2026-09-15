'use client';

import { useState } from 'react';
import { submitXDetails } from '@/actions/users';
import { motion } from 'framer-motion';

export default function XOnboardingScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const res = await submitXDetails(formData);
    
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
            background: 'rgba(255, 255, 255, 0.08)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto',
            color: 'var(--text-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Verify X (Twitter) Account
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            To claim X tasks, please link your X (Twitter) profile handle.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              X (Twitter) Profile Link / URL <span style={{ color: '#ef4444' }}>* (Compulsory)</span>
            </label>
            <input 
              name="profile_url"
              type="url"
              placeholder="e.g. https://x.com/your_handle"
              required
              className="form-input"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', outline: 'none'
              }}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Provide the direct link to your X profile (e.g., https://x.com/username).
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              X Handle / Username <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              name="username"
              type="text"
              placeholder="e.g. @your_handle or your_handle"
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
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '13px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '8px',
              background: 'var(--text-primary)', color: 'var(--bg-primary)',
              fontWeight: 600, fontSize: '15px', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '8px'
            }}
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </button>
          
          <button 
            type="button"
            onClick={() => {
              window.location.href = '/worker/home';
            }}
            style={{
              width: '100%', padding: '14px', borderRadius: '8px',
              background: 'transparent', color: 'var(--text-secondary)',
              fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            Cancel and Return Home
          </button>
        </form>
      </motion.div>
    </div>
  );
}
