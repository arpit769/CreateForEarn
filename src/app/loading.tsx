import React from 'react';

export default function RootLoading() {
  return (
    <div className="page-bloom-wrapper" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative' }}>
      {/* Ambient Blooming Glow */}
      <div className="page-bloom-backdrop" style={{ top: '20%' }} />

      <div className="bloom-cascade-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 1 }}>
        {/* Soft Blooming Indicator */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)',
          animation: 'pulse-glow 2s infinite'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid transparent',
            borderTop: '2px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>

        <div className="skeleton" style={{ height: '24px', width: '180px', borderRadius: '6px' }} />
        <div className="skeleton" style={{ height: '14px', width: '280px', borderRadius: '4px' }} />
      </div>
    </div>
  );
}
