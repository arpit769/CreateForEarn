'use client';

import React, { useState } from 'react';
import { submitFacebookDetails } from '@/actions/users';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import { FacebookIcon } from '@/utils/facebook';

export default function FacebookOnboardingScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const res = await submitFacebookDetails(formData);
    
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
            background: 'linear-gradient(135deg, #1877F2 0%, #0c56c2 100%)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto',
            color: '#fff', boxShadow: '0 8px 24px rgba(24, 119, 242, 0.35)'
          }}>
            <FacebookIcon size={34} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Verify Facebook Account
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            To claim Facebook tasks, please link your active Facebook profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Facebook Profile Link / URL <span style={{ color: '#ef4444' }}>* (Compulsory)</span>
            </label>
            <input 
              name="profile_url"
              type="url"
              placeholder="e.g. https://www.facebook.com/yourprofile"
              required
              className="form-input"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', outline: 'none'
              }}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Provide your direct profile URL (e.g., https://www.facebook.com/yourprofile or profile.php?id=...).
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Facebook Username / Account Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              name="username"
              type="text"
              placeholder="e.g. yourhandle or Your Profile Name"
              required
              className="form-input"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', outline: 'none'
              }}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Your exact Facebook username or display name as shown on your profile.
            </p>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px', borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
              fontSize: '13px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '8px',
              background: '#1877F2', color: '#fff',
              border: 'none', fontWeight: 600, fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              marginTop: '8px',
              boxShadow: '0 4px 14px rgba(24, 119, 242, 0.3)'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Submitting for Verification...
              </>
            ) : (
              'Submit for Verification'
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Our admin team reviews Facebook accounts manually to ensure authenticity. Review usually takes 2-4 hours.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
