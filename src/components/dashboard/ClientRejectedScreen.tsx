'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, AlertTriangle, Headphones, LogOut, Mail, Building2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function ClientRejectedScreen({ reason, profile }: { reason?: string; profile?: any }) {
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/signup';
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          maxWidth: '600px',
          background: 'var(--bg-surface)',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.12)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{
          height: '6px',
          width: '100%',
          background: 'linear-gradient(90deg, #ef4444, #dc2626)',
        }} />

        <div style={{ padding: '36px 32px', textAlign: 'center' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            margin: '0 auto 18px',
            boxShadow: '0 8px 20px rgba(239, 68, 68, 0.15)'
          }}>
            <XCircle size={36} />
          </div>

          <h1 style={{
            fontSize: '24px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '10px'
          }}>
            Brand Account Not Approved
          </h1>

          <p style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '24px'
          }}>
            Unfortunately, your brand client registration was not approved by the admin team at this time.
          </p>

          {/* Reason box */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.05)',
            borderRadius: '14px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '16px',
            textAlign: 'left',
            marginBottom: '28px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Reason for Decision
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {reason || 'Your brand submission did not meet our verification criteria or lacked identifiable company details.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link
              href="/client/support"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                background: 'var(--accent-primary)',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              <Headphones size={16} />
              Contact Support
            </Link>

            <button
              onClick={handleSignOut}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
