'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wrench, RotateCcw, MessageSquare, LogOut, ShieldAlert, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function MaintenanceScreen({
  message,
  estimatedEndTime
}: {
  message?: string;
  estimatedEndTime?: string | null;
}) {
  const [countdown, setCountdown] = useState(20);
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();

  // Auto-refresh countdown to detect when admin turns maintenance off
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.location.reload();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleManualCheck = () => {
    setIsChecking(true);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/signup';
    } catch {
      window.location.href = '/signup';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary, #090d16)',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0) 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'var(--bg-card, rgba(17, 24, 39, 0.85))',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '24px',
          padding: '40px 32px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5), 0 0 32px rgba(245, 158, 11, 0.08)',
          backdropFilter: 'blur(16px)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Status Pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '30px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '24px' }}>
          <span className="pulse-dot" style={{ width: '8px', height: '8px', background: '#f59e0b' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            System Under Maintenance
          </span>
        </div>

        {/* Wrench & Sparkle Icon container */}
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '22px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: '#f59e0b',
          boxShadow: '0 12px 24px rgba(245, 158, 11, 0.15)'
        }}>
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            <Wrench size={36} />
          </motion.div>
        </div>

        {/* Main Title */}
        <h1 style={{
          fontSize: '26px',
          fontWeight: 800,
          color: 'var(--text-primary, #fff)',
          marginBottom: '12px',
          letterSpacing: '-0.02em'
        }}>
          We’re Upgrading CreateForEarn
        </h1>

        {/* Description Message */}
        <p style={{
          fontSize: '14.5px',
          lineHeight: '1.6',
          color: 'var(--text-secondary, #94a3b8)',
          margin: '0 auto 24px',
          maxWidth: '460px'
        }}>
          {message || "We are currently performing scheduled maintenance and updates to improve your experience. Worker tasks and submissions are temporarily paused. We'll be back online shortly!"}
        </p>

        {/* Estimated Time Badge (if provided) */}
        {estimatedEndTime && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
            padding: '8px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
            marginBottom: '24px',
            fontSize: '13px',
            color: 'var(--text-secondary, #cbd5e1)'
          }}>
            <Clock size={15} style={{ color: '#f59e0b' }} />
            <span>Estimated return: <strong style={{ color: 'var(--text-primary, #fff)' }}>{estimatedEndTime}</strong></span>
          </div>
        )}

        {/* Auto-Refresh Counter Bar */}
        <div style={{
          background: 'var(--bg-secondary, rgba(0,0,0,0.25))',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '24px',
          border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12.5px',
          color: 'var(--text-muted, #94a3b8)'
        }}>
          <span>Auto-checking for status update:</span>
          <span style={{ fontWeight: 700, color: '#f59e0b' }}>in {countdown}s</span>
        </div>

        {/* Actions Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleManualCheck}
            disabled={isChecking}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '12px',
              border: 'none',
              background: '#f59e0b',
              color: '#000',
              fontWeight: 700,
              fontSize: '14px',
              cursor: isChecking ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            <RotateCcw size={16} className={isChecking ? 'animate-spin' : ''} />
            {isChecking ? 'Checking status...' : 'Check Status Now'}
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <a
              href="https://discord.gg/createforearn"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '11px',
                borderRadius: '12px',
                border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
                color: 'var(--text-primary, #fff)',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <MessageSquare size={15} style={{ color: '#5865F2' }} />
              Discord
            </a>

            <button
              onClick={handleSignOut}
              style={{
                padding: '11px',
                borderRadius: '12px',
                border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
                color: 'var(--text-muted, #94a3b8)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

