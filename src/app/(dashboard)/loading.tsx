import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="page-bloom-wrapper" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Ambient Top Blooming Glow */}
      <div className="page-bloom-backdrop" />

      {/* Top Header Skeleton (Cascade 1) */}
      <div className="bloom-cascade-1" style={{ marginBottom: '32px', position: 'relative', zIndex: 1 }}>
        <div className="skeleton" style={{ height: '32px', width: '220px', marginBottom: '12px', borderRadius: '8px' }} />
        <div className="skeleton" style={{ height: '18px', width: '380px', maxWidth: '80%', borderRadius: '6px' }} />
      </div>

      {/* Filter & Search Bar Skeleton (Cascade 2) */}
      <div className="bloom-cascade-2" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px', 
        marginBottom: '28px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div className="skeleton" style={{ height: '40px', width: '90px', borderRadius: '20px' }} />
          <div className="skeleton" style={{ height: '40px', width: '110px', borderRadius: '20px' }} />
          <div className="skeleton" style={{ height: '40px', width: '100px', borderRadius: '20px' }} />
          <div className="skeleton" style={{ height: '40px', width: '120px', borderRadius: '20px' }} />
        </div>
        <div className="skeleton" style={{ height: '44px', width: '320px', maxWidth: '100%', borderRadius: '12px' }} />
      </div>

      {/* Cards Grid Skeleton (Cascade 3 & 4) */}
      <div 
        className="bloom-cascade-3"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', 
          gap: '24px',
          position: 'relative',
          zIndex: 1
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div 
            key={i} 
            className="bloom-skeleton-card"
            style={{ 
              padding: '24px', 
              minHeight: '260px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between' 
            }}
          >
            <div>
              {/* Card top chips */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div className="skeleton" style={{ height: '22px', width: '90px', borderRadius: '12px' }} />
                <div className="skeleton" style={{ height: '22px', width: '70px', borderRadius: '12px' }} />
              </div>

              {/* Title & subtitle lines */}
              <div className="skeleton" style={{ height: '20px', width: '85%', marginBottom: '10px', borderRadius: '6px' }} />
              <div className="skeleton" style={{ height: '16px', width: '60%', marginBottom: '20px', borderRadius: '6px' }} />

              {/* Type pill & price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <div className="skeleton" style={{ height: '18px', width: '75px', borderRadius: '6px' }} />
                <div className="skeleton" style={{ height: '24px', width: '50px', borderRadius: '6px' }} />
              </div>
            </div>

            {/* Bottom action button */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <div className="skeleton" style={{ height: '40px', width: '100%', borderRadius: '10px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
