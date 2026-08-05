export default function ReferralLoading() {
  return (
    <div className="dashboard-content-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton-block {
          background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--border-subtle) 50%, var(--bg-elevated) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 12px;
        }
      `}</style>

      {/* Header skeleton */}
      <div style={{ marginBottom: '32px' }}>
        <div className="skeleton-block" style={{ width: '280px', height: '32px', marginBottom: '12px' }} />
        <div className="skeleton-block" style={{ width: '420px', height: '18px' }} />
      </div>

      {/* Referral Code Card skeleton */}
      <div className="skeleton-block" style={{
        height: '160px',
        borderRadius: '20px',
        marginBottom: '32px',
      }} />

      {/* Stats Cards skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-block" style={{ height: '130px', borderRadius: '16px' }} />
        ))}
      </div>

      {/* How It Works skeleton */}
      <div className="skeleton-block" style={{
        height: '140px',
        borderRadius: '16px',
        marginBottom: '32px',
      }} />

      {/* Table skeleton */}
      <div className="skeleton-block" style={{
        height: '200px',
        borderRadius: '16px',
      }} />
    </div>
  );
}
