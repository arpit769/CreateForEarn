'use client';

import { useState } from 'react';
import { submitRedditDetails } from '@/actions/users';
import { motion } from 'framer-motion';

export default function OnboardingScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const res = await submitRedditDetails(formData);
    
    if (res.error) {
      setError(res.error);
    }
    setLoading(false);
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
        style={{
          background: 'var(--bg-card)',
          padding: '40px',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="CreateForEarn" style={{ height: '56px', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Complete Your Profile
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            To start claiming tasks, you need to verify your Reddit account.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Reddit Profile Link <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              name="reddit_profile_link"
              type="url"
              placeholder="https://reddit.com/user/yourusername"
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
              Total Karma (Min. 50) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              name="reddit_karma"
              type="number"
              min="50"
              placeholder="e.g. 1500"
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
              Account Age (Min. 20 days) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              name="reddit_account_age"
              type="text"
              placeholder="e.g. 2 years, 3 months"
              required
              className="form-input"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px',
                background: 'var(--bg-default)', border: '1px solid var(--border-subtle)',
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
              const { createClient } = await import('@/utils/supabase/client');
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = '/signup';
            }}
            style={{
              width: '100%', padding: '14px', borderRadius: '8px',
              background: 'transparent', color: 'var(--text-secondary)',
              fontWeight: 600, fontSize: '14px', border: '1px solid var(--border-medium)',
              cursor: 'pointer',
              marginTop: '12px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            Sign out for now
          </button>
        </form>
      </motion.div>
    </div>
  );
}
