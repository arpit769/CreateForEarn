'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import CommandPalette from './CommandPalette';

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Admin Dashboard', subtitle: 'Community overview and key metrics' },
  '/admin/users': { title: 'Manage Users', subtitle: 'Review and approve worker applications' },
  '/admin/youtube-users': { title: 'YouTube Users', subtitle: 'Review and verify worker YouTube accounts' },
  '/admin/x-users': { title: 'X Users', subtitle: 'Review and verify worker X accounts' },
  '/admin/quora-users': { title: 'Quora Users', subtitle: 'Review and verify worker Quora accounts' },
  '/admin/instagram-users': { title: 'Instagram Users', subtitle: 'Review and verify worker Instagram accounts' },
  '/admin/linkedin-users': { title: 'LinkedIn Users', subtitle: 'Review and verify worker LinkedIn accounts' },
  '/admin/facebook-users': { title: 'Facebook Users', subtitle: 'Review and verify worker Facebook accounts' },
  '/admin/client-users': { title: 'Brand Clients', subtitle: 'Review and verify brand client accounts' },
  '/admin/campaign-moderation': { title: 'Campaign Moderation', subtitle: 'Review and moderate brand client campaigns' },
  '/admin/tasks': { title: 'Manage Tasks', subtitle: 'Create and manage tasks for workers' },
  '/admin/youtube-tasks': { title: 'YouTube Tasks', subtitle: 'Create and manage YouTube tasks' },
  '/admin/x-tasks': { title: 'X Tasks', subtitle: 'Create and manage X tasks' },
  '/admin/quora-tasks': { title: 'Quora Tasks', subtitle: 'Create and manage Quora tasks' },
  '/admin/instagram-tasks': { title: 'Manage Instagram Tasks', subtitle: 'Create and manage all 7 categories of Instagram tasks for workers.' },
  '/admin/linkedin-tasks': { title: 'LinkedIn Tasks', subtitle: 'Create and manage LinkedIn tasks' },
  '/admin/facebook-tasks': { title: 'Manage Facebook Tasks', subtitle: 'Create and manage all 7 categories of Facebook tasks for workers.' },
  '/admin/karma-farm': { title: 'Karma Farm', subtitle: 'Manage Reddit karma growth tasks' },
  '/admin/expired-tasks': { title: 'Task Expiration Lookup', subtitle: 'Review expired task claims and decide whether tasks should reflect to users' },
  '/admin/submissions': { title: 'Review Submissions', subtitle: 'Approve or reject work submitted by workers' },
  '/admin/youtube-submissions': { title: 'YouTube Submissions', subtitle: 'Review submitted YouTube tasks' },
  '/admin/x-submissions': { title: 'X Submissions', subtitle: 'Review submitted X tasks' },
  '/admin/quora-submissions': { title: 'Quora Submissions', subtitle: 'Review submitted Quora tasks' },
  '/admin/instagram-submissions': { title: 'Instagram Submissions', subtitle: 'Review submitted Instagram tasks' },
  '/admin/linkedin-submissions': { title: 'LinkedIn Submissions', subtitle: 'Review submitted LinkedIn tasks' },
  '/admin/facebook-submissions': { title: 'Facebook Submissions', subtitle: 'Review and verify submitted Facebook tasks' },
  '/admin/withdrawals': { title: 'Manage Withdrawals', subtitle: 'Process pending payout requests' },
  '/admin/leaderboard': { title: 'Leaderboard', subtitle: 'Top performers and community rankings' },
  '/admin/subreddit-posts': { title: 'Subreddit Post Tracker', subtitle: 'Track Reddit account post counts across subreddits' },
  '/worker/youtube-tasks': { title: 'YouTube Tasks', subtitle: 'Complete YouTube tasks and earn rewards' },
  '/worker/x-tasks': { title: 'X Tasks', subtitle: 'Complete X tasks and earn rewards' },
  '/worker/quora-tasks': { title: 'Quora Tasks', subtitle: 'Complete Quora tasks and earn rewards' },
  '/worker/instagram-tasks': { title: 'Instagram Tasks', subtitle: 'Complete Instagram tasks and earn rewards' },
  '/worker/linkedin-tasks': { title: 'LinkedIn Tasks', subtitle: 'Complete LinkedIn tasks and earn rewards' },
  '/worker/facebook-tasks': { title: 'Facebook Tasks', subtitle: 'Complete Facebook tasks and earn rewards' },
  '/worker/karma-farm': { title: 'Karma Farm', subtitle: 'Participate in karma farming tasks' },
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
  '/worker/help': { title: 'Help & Support', subtitle: 'Get in touch with our team' },
  // Client routes
  '/client/home': { title: 'Client Dashboard', subtitle: 'Manage campaigns, track performance & wallet' },
  '/client/campaigns': { title: 'My Campaigns', subtitle: 'View and manage all your active campaigns' },
  '/client/payments': { title: 'Wallet & Billing', subtitle: 'Top up funds, manage transactions & receipts' },
  '/client/reports': { title: 'Reports & Analytics', subtitle: 'Detailed insights on campaign engagement' },
  '/client/support': { title: 'Support & Help', subtitle: 'Get 24/7 dedicated support from our team' },
};

interface HeaderProps {
  /** Admin stats pre-fetched server-side. Null for non-admin users. */
  adminStats: { activeUsers: number; pendingCount: number } | null;
  profile?: any;
}

export default function Header({ adminStats, profile }: HeaderProps) {
  const pathname = usePathname();
  const route = routeTitles[pathname] || { title: 'CreateForEarn', subtitle: '' };
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
          <h2 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
            {route.title}
          </h2>
          <p className="header-subtitle" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {route.subtitle}
          </p>
        </div>
      </div>

      {/* Right — Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Search */}
        <div 
          className="header-search"
          onClick={() => setIsSearchOpen(true)}
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
            minWidth: '180px',
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

        {/* Notifications Icon (Client & Worker) */}
        <div style={{ position: 'relative' }}>
          <button
            title="Notifications"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              position: 'relative',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-medium)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {/* Red notification dot */}
            <span style={{
              position: 'absolute',
              top: '7px',
              right: '8px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#ef4444',
              boxShadow: '0 0 4px #ef4444'
            }} />
          </button>
        </div>

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

      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} isAdmin={adminStats !== null} />
    </header>
  );
}
