'use client';

import { useState } from 'react';
import { submitLinkedInDetails } from '@/actions/users';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import { LinkedInIcon } from '@/utils/linkedin';

export default function LinkedInOnboardingScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const res = await submitLinkedInDetails(formData);
    
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
            background: 'rgba(10, 102, 194, 0.1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto',
            color: '#0A66C2', boxShadow: '0 8px 24px rgba(10, 102, 194, 0.25)'
          }}>
            <LinkedInIcon size={36} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Verify LinkedIn Profile
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            To claim LinkedIn tasks, please link your public LinkedIn profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              LinkedIn Profile URL <span style={{ color: '#ef4444' }}>* (Compulsory)</span>
            </label>
            <input 
              name="profile_url"
              type="url"
              placeholder="e.g. https://www.linkedin.com/in/yourprofile"
              required
              className="form-input"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', outline: 'none'
              }}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Use your exact public profile URL (e.g. https://www.linkedin.com/in/username).
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Headline / Title <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
            </label>
            <input 
              name="headline"
              type="text"
              placeholder="e.g. Software Engineer | Marketing Strategist"
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
              Approximate Connections / Followers <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
            </label>
            <input 
              name="connections_count"
              type="number"
              min="0"
              placeholder="e.g. 500"
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
            style={{
              width: '100%', padding: '14px', borderRadius: '8px',
              background: '#0A66C2',
              color: '#fff', border: 'none',
              fontSize: '15px', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 4px 14px rgba(10, 102, 194, 0.35)',
              marginTop: '8px'
            }}
          >
            {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Submit for Verification'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
