'use client';

import { useState } from 'react';
import { submitYoutubeDetails } from '@/actions/users';
import { motion } from 'framer-motion';

import { useRouter } from 'next/navigation';

export default function YoutubeOnboardingScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const res = await submitYoutubeDetails(formData);
    
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      // Redirect or reload
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
          <img src="/logo.png" alt="CreateForEarn" style={{ height: '64px', width: '64px', borderRadius: '14px', objectFit: 'cover', margin: '0 auto 16px auto', display: 'block', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Verify YouTube Account
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            To claim YouTube tasks, you need to verify your YouTube account.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              YouTube Account Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              name="channel_name"
              type="text"
              placeholder="e.g. John Doe Vlogs"
              required
              className="form-input"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Email ID <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              name="email_id"
              type="email"
              placeholder="e.g. johndoe@gmail.com"
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
            onClick={async () => {
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
