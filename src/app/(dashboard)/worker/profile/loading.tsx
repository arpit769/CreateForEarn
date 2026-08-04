export default function Loading() {
  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '40px' }}>
        <div className="skeleton" style={{ width: '160px', height: '32px', borderRadius: '8px', marginBottom: '12px' }} />
        <div className="skeleton" style={{ width: '320px', height: '18px', borderRadius: '6px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
        {/* Left: profile card skeleton */}
        <div>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
              <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0 }} />
              <div>
                <div className="skeleton" style={{ width: '160px', height: '26px', borderRadius: '6px', marginBottom: '10px' }} />
                <div className="skeleton" style={{ width: '200px', height: '16px', borderRadius: '4px' }} />
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
              <div className="skeleton" style={{ width: '180px', height: '20px', borderRadius: '6px', marginBottom: '20px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <div className="skeleton" style={{ width: '80px', height: '12px', borderRadius: '4px', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ width: '140px', height: '16px', borderRadius: '4px' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent-red)', borderRadius: '16px', padding: '24px' }}>
            <div className="skeleton" style={{ width: '130px', height: '22px', borderRadius: '6px' }} />
          </div>
        </div>
        {/* Right: accounts skeleton */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
          <div className="skeleton" style={{ width: '160px', height: '20px', borderRadius: '6px', marginBottom: '16px' }} />
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', marginBottom: '12px' }}>
              <div className="skeleton" style={{ width: '80%', height: '16px', borderRadius: '4px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ width: '60%', height: '12px', borderRadius: '4px' }} />
            </div>
          ))}
          <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '12px', marginTop: '4px' }} />
        </div>
      </div>
    </div>
  );
}
