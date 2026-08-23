// Shown instantly by Next.js while the server fetches data for this route
export default function Loading() {
  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page header skeleton */}
      <div style={{ marginBottom: '32px' }}>
        <div className="skeleton" style={{ width: '220px', height: '32px', borderRadius: '8px', marginBottom: '12px' }} />
        <div className="skeleton" style={{ width: '360px', height: '18px', borderRadius: '6px' }} />
      </div>

      {/* Stats row skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
            <div className="skeleton" style={{ width: '100px', height: '14px', borderRadius: '4px', marginBottom: '16px' }} />
            <div className="skeleton" style={{ width: '80px', height: '28px', borderRadius: '6px' }} />
          </div>
        ))}
      </div>

      {/* Content area skeleton */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
        <div className="skeleton" style={{ width: '180px', height: '22px', borderRadius: '6px', marginBottom: '20px' }} />
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '14px 0', borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none' }}>
            <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '60%', height: '14px', borderRadius: '4px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ width: '40%', height: '12px', borderRadius: '4px' }} />
            </div>
            <div className="skeleton" style={{ width: '80px', height: '28px', borderRadius: '8px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
