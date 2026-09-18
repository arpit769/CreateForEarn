'use client';

import { useState } from 'react';
import { submitInstagramDetails } from '@/actions/users';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import { InstagramIcon } from '@/utils/instagram';

export default function InstagramOnboardingScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const res = await submitInstagramDetails(formData);
    
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
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto',
            color: '#fff', boxShadow: '0 8px 24px rgba(225, 48, 108, 0.35)'
          }}>
            <InstagramIcon size={34} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Verify Instagram Account
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            To claim Instagram tasks, please link your Instagram profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Instagram Profile Link / URL <span style={{ color: '#ef4444' }}>* (Compulsory)</span>
            </label>
            <input 
              name="profile_url"
              type="url"
              placeholder="e.g. https://www.instagram.com/yourhandle"
              required
              className="form-input"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', outline: 'none'
              }}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Provide your direct profile URL (e.g., https://www.instagram.com/yourhandle).
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Instagram Username / Handle <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              name="username"
              type="text"
              placeholder="e.g. yourhandle or @yourhandle"
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
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px', borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444', fontSize: '13px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%', padding: '12px', borderRadius: '8px',
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              color: '#fff', border: 'none',
              fontWeight: 600, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Submitting Details...' : 'Submit for Verification'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
