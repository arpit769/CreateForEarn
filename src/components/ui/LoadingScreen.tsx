'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingScreen({ message = 'Loading details, please wait...' }: { message?: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      padding: '48px',
      textAlign: 'center'
    }}>
      {/* Animated Spinner with Neon Glowing Rings */}
      <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '24px' }}>
        
        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: 'var(--accent-blue)',
            borderBottomColor: 'var(--accent-purple)',
            filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))'
          }}
        />

        {/* Inner Ring (rotating in opposite direction) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: '8px',
            borderRadius: '50%',
            border: '2px solid transparent',
            borderLeftColor: '#10b981',
            borderRightColor: '#f59e0b',
            filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.3))'
          }}
        />

        {/* Center Pulse Dot */}
        <motion.div
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: '24px',
            borderRadius: '50%',
            background: 'var(--text-primary)',
            opacity: 0.8
          }}
        />
      </div>

      {/* Loading Text */}
      <motion.p
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          letterSpacing: '0.02em',
          maxWidth: '300px',
          lineHeight: 1.5
        }}
      >
        {message}
      </motion.p>
    </div>
  );
}
