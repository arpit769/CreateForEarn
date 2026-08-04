'use client';

import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Admin Dashboard', subtitle: 'Community overview and key metrics' },
  '/moderation': { title: 'Mod Queue', subtitle: 'Review and moderate content' },
  '/scheduler': { title: 'Post Scheduler', subtitle: 'Plan and schedule content' },
  '/analytics': { title: 'Analytics', subtitle: 'Community insights and trends' },
  '/users': { title: 'Users', subtitle: 'Manage community members' },
  '/flairs': { title: 'Flairs', subtitle: 'Manage post and user flairs' },
  '/automod': { title: 'AutoMod Rules', subtitle: 'Automated moderation configuration' },
  '/settings': { title: 'Settings', subtitle: 'Community and app settings' },
  // Worker routes
  '/worker/available-tasks': { title: 'User Dashboard', subtitle: 'Browse and claim available tasks' },
  '/worker/my-tasks': { title: 'My Tasks', subtitle: 'Manage your claimed and active tasks' },
  '/worker/wallet': { title: 'Wallet', subtitle: 'View your earnings and request withdrawals' },
  '/worker/profile': { title: 'Profile', subtitle: 'Manage your account settings' },
};

interface HeaderProps {
  /** Admin stats pre-fetched server-side. Null for non-admin users. */
  adminStats: { activeUsers: number; pendingCount: number } | null;
}

export default function Header({ adminStats }: HeaderProps) {
  const pathname = usePathname();
  const route = routeTitles[pathname] || { title: 'CreateForEarn', subtitle: '' };

  return (
    <header className="header">
      {/* Left — Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('toggle-sidebar'));
            }
          }}
          className="mobile-menu-toggle"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        </button>
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
            {route.title}
          </h2>
          <p className="header-subtitle" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {route.subtitle}
          </p>
        </div>
      </div>

      {/* Right — Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Search */}
        <div 
          className="header-search"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            background: 'var(--hero-glow-1)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: '200px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', flex: 1 }}>Search...</span>
          <span style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            padding: '2px 6px',
            background: 'var(--hero-glow-3)',
            borderRadius: '4px',
            fontWeight: 500,
          }}>
            ⌘K
          </span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button style={{
          position: 'relative',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'var(--hero-glow-1)',
          border: '1px solid var(--border-subtle)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--accent-red)',
            border: '2px solid var(--bg-primary)',
            boxShadow: '0 0 6px rgba(239, 68, 68, 0.4)',
          }} />
        </button>

        {adminStats && (
          <>
            {/* Mod Queue Badge */}
            <div 
              className="header-stat-badge"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                background: 'rgba(239, 68, 68, 0.08)',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.12)',
                fontSize: '12px',
                fontWeight: 600,
                color: '#f87171',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              {adminStats.pendingCount} pending
            </div>

            {/* Live Users */}
            <div 
              className="header-stat-badge"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                background: 'rgba(16, 185, 129, 0.08)',
                borderRadius: '10px',
                border: '1px solid rgba(16, 185, 129, 0.12)',
                fontSize: '12px',
                fontWeight: 600,
                color: '#34d399',
              }}
            >
              <div className="pulse-dot" style={{ width: '6px', height: '6px' }} />
              {adminStats.activeUsers.toLocaleString()} online
            </div>
          </>
        )}
      </div>
    </header>
  );
}
