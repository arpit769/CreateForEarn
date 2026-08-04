export default function Loading() {
  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="skeleton" style={{ width: '160px', height: '28px', borderRadius: '8px', marginBottom: '10px' }} />
          <div className="skeleton" style={{ width: '220px', height: '16px', borderRadius: '4px' }} />
        </div>
        <div className="skeleton" style={{ width: '120px', height: '40px', borderRadius: '10px' }} />
      </div>
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '16px' }}>
          {[180, 90, 90, 80, 100].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: '14px', borderRadius: '4px', width: `${w}px` }} />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="skeleton" style={{ flex: 2, height: '14px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ flex: 1, height: '14px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '60px', height: '24px', borderRadius: '20px' }} />
            <div className="skeleton" style={{ flex: 1, height: '14px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '90px', height: '32px', borderRadius: '8px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
