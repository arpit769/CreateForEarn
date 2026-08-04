export default function Loading() {
  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <div className="skeleton" style={{ width: '160px', height: '32px', borderRadius: '8px', marginBottom: '12px' }} />
        <div className="skeleton" style={{ width: '300px', height: '18px', borderRadius: '6px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '55%', height: '18px', borderRadius: '6px', marginBottom: '10px' }} />
              <div className="skeleton" style={{ width: '80%', height: '13px', borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="skeleton" style={{ width: '70px', height: '24px', borderRadius: '20px' }} />
                <div className="skeleton" style={{ width: '90px', height: '24px', borderRadius: '20px' }} />
              </div>
            </div>
            <div className="skeleton" style={{ width: '100px', height: '38px', borderRadius: '10px', flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
