'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function ReferralCodeCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap',
    }}>
      <div style={{
        fontSize: '32px',
        fontWeight: 800,
        color: 'var(--text-primary)',
        letterSpacing: '6px',
        fontFamily: 'monospace',
        background: 'var(--bg-elevated)',
        padding: '14px 24px',
        borderRadius: '12px',
        border: '2px dashed rgba(168, 85, 247, 0.3)',
        userSelect: 'all',
      }}>
        {code}
      </div>
      <button
        onClick={handleCopy}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 20px',
          borderRadius: '10px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 600,
          transition: 'all 0.2s ease',
          background: copied ? 'rgba(34, 197, 94, 0.1)' : 'rgba(168, 85, 247, 0.1)',
          color: copied ? '#22c55e' : '#a855f7',
        }}
        onMouseEnter={(e) => {
          if (!copied) {
            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (!copied) {
            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
          }
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? 'Copied!' : 'Copy Code'}
      </button>
    </div>
  );
}
