'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PendingApprovalScreen() {
  const router = useRouter();

  useEffect(() => {
    // Optionally, listen for status changes in real-time or just poll/refresh
    // For now, they can just refresh the page.
  }, []);

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
        className="auth-card"
        style={{
          background: 'var(--bg-surface)',
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
          background: 'rgba(234, 179, 8, 0.1)', color: '#eab308',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: '32px'
        }}>
          <Clock size={32} />
        </div>
        
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Verification in Progress
        </h2>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
          Your Reddit details have been submitted successfully! Our admin team is currently reviewing your profile to ensure it meets our quality standards. 
          <br /><br />
          This usually takes less than 24 hours. Please check back later.
        </p>
        
        <div style={{ marginBottom: '32px' }}>
          <a 
            href="https://discord.gg/5qu5s87kKu" 
            target="_blank" 
            rel="noreferrer" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px',
              background: '#5865f2', 
              color: '#ffffff', 
              padding: '12px 24px', 
              borderRadius: '4px', 
              textDecoration: 'none', 
              fontWeight: 600, 
              fontSize: '15px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#4752C4'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#5865f2'}
          >
            <svg width="22" height="17" viewBox="0 0 127.14 96.36" xmlns="http://www.w3.org/2000/svg">
              <path fill="#fff" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c0,0,.04-.06.09-.09C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.1,46,96,53,91,65.69,84.69,65.69Z"/>
            </svg>
            Join our Discord
          </a>
        </div>

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
          Sign out for now
        </button>
      </motion.div>
    </div>
  );
}
