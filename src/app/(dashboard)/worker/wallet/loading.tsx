export default function Loading() {
  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <div className="skeleton" style={{ width: '150px', height: '32px', borderRadius: '8px', marginBottom: '12px' }} />
        <div className="skeleton" style={{ width: '400px', height: '18px', borderRadius: '6px' }} />
      </div>

      {/* Balance cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="skeleton" style={{ width: '110px', height: '14px', borderRadius: '4px' }} />
              <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
            </div>
            <div className="skeleton" style={{ width: '90px', height: '32px', borderRadius: '8px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '140px', height: '12px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
          <div className="skeleton" style={{ width: '220px', height: '22px', borderRadius: '6px', marginBottom: '20px' }} />
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', marginBottom: '12px' }}>
              <div>
                <div className="skeleton" style={{ width: '120px', height: '16px', borderRadius: '4px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ width: '180px', height: '12px', borderRadius: '4px' }} />
              </div>
              <div className="skeleton" style={{ width: '70px', height: '22px', borderRadius: '6px' }} />
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
          <div className="skeleton" style={{ width: '180px', height: '22px', borderRadius: '6px', marginBottom: '20px' }} />
          <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '8px', marginBottom: '12px' }} />
          <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '8px', marginBottom: '12px' }} />
          <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '8px', marginBottom: '12px' }} />
          <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '8px' }} />
        </div>
      </div>
    </div>
  );
}
