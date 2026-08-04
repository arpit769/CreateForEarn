export default function Loading() {
  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="skeleton" style={{ width: '140px', height: '28px', borderRadius: '8px', marginBottom: '10px' }} />
          <div className="skeleton" style={{ width: '280px', height: '16px', borderRadius: '4px' }} />
        </div>
        <div className="skeleton" style={{ width: '130px', height: '40px', borderRadius: '10px' }} />
      </div>
      {/* Table skeleton */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '12px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '14px', borderRadius: '4px', width: i === 0 ? '180px' : i === 1 ? '120px' : '90px' }} />
          ))}
        </div>
        {[...Array(7)].map((_, i) => (
          <div key={i} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '55%', height: '14px', borderRadius: '4px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ width: '35%', height: '12px', borderRadius: '4px' }} />
            </div>
            <div className="skeleton" style={{ width: '70px', height: '24px', borderRadius: '20px' }} />
            <div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: '8px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
