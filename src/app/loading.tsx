export default function RootLoading() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 10, 12, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      gap: '20px'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '3px solid rgba(124, 58, 237, 0.1)',
        borderTop: '3px solid #7c3aed',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>Loading</h2>
      <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>Please wait...</p>
    </div>
  );
}
