'use client';

import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function RejectedScreen({ reason }: { reason: string | null }) {
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/signup';
  };

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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'var(--bg-card)',
          padding: '48px',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
          width: '100%',
          maxWidth: '480px',
          textAlign: 'center',
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', 
          background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px auto'
        }}>
          <XCircle size={40} />
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Application Not Approved
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
          Thank you for applying to CreateForEarn. Unfortunately, after reviewing your Reddit details, we are unable to approve your application at this time.
        </p>

        <div style={{ 
          background: 'var(--bg-elevated)', 
          padding: '20px', 
          borderRadius: '12px', 
          border: '1px solid var(--border-medium)',
          textAlign: 'left',
          marginBottom: '32px'
        }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Reason provided by team</p>
          <p style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500 }}>
            {reason || "Your account does not meet our current requirements."}
          </p>
        </div>

        <button 
          onClick={handleSignOut}
          style={{
            padding: '12px 24px', borderRadius: '8px',
            background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-medium)',
            fontWeight: 600, fontSize: '14px', cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Sign out
        </button>
      </motion.div>
    </div>
  );
}
