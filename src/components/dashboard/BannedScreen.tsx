'use client';

import { motion } from 'framer-motion';
import { Ban } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function BannedScreen({ reason }: { reason?: string }) {
  const router = useRouter();

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-default)',
      padding: '24px'
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'var(--bg-surface)',
          padding: '48px 40px',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          width: '100%',
          maxWidth: '480px',
          textAlign: 'center',
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '50%', 
          background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: '32px'
        }}>
          <Ban size={32} />
        </div>
        
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Account Suspended
        </h2>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
          Your account has been banned from participating in CreateForEarn tasks. 
        </p>

        {reason && (
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '32px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Reason for Ban
            </p>
            <p style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.5 }}>
              {reason}
            </p>
          </div>
        )}

        <button 
          onClick={() => {
            // Sign out
            createClient().auth.signOut().then(() => router.push('/'));
          }}
          style={{
            padding: '12px 24px', borderRadius: '8px',
            background: 'transparent', color: 'var(--text-muted)',
            fontWeight: 600, fontSize: '14px', border: '1px solid var(--border-subtle)',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          Sign out
        </button>
      </motion.div>
    </div>
  );
}
