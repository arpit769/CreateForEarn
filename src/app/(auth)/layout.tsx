export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main style={{ height: '100vh', width: '100vw', display: 'flex', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {children}
    </main>
  );
}
