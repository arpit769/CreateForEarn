'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import CommandPalette from './CommandPalette';
import { Wrench, X, AlertTriangle, Clock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { setMaintenanceMode, MaintenanceStatus } from '@/actions/maintenance';

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
  initialMaintenanceStatus?: MaintenanceStatus;
}

export default function Header({ adminStats, profile, initialMaintenanceStatus }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const route = routeTitles[pathname] || { title: 'CreateForEarn', subtitle: '' };
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Maintenance state
  const [maintenance, setMaintenance] = useState<MaintenanceStatus>(
    initialMaintenanceStatus || { enabled: false }
  );
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [targetEnabled, setTargetEnabled] = useState(maintenance.enabled);
  const [customMessage, setCustomMessage] = useState(
    maintenance.message || "We are currently performing scheduled maintenance and updates to improve your experience. Worker tasks and submissions are temporarily paused. We'll be back online shortly!"
  );
  const [estimatedTime, setEstimatedTime] = useState(maintenance.estimatedEndTime || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync internal modal states when opened
  const openMaintenanceModal = () => {
    setTargetEnabled(maintenance.enabled);
    setCustomMessage(
      maintenance.message || "We are currently performing scheduled maintenance and updates to improve your experience. Worker tasks and submissions are temporarily paused. We'll be back online shortly!"
    );
    setEstimatedTime(maintenance.estimatedEndTime || '');
    setErrorMsg('');
    setSaveSuccessMsg('');
    setIsMaintenanceModalOpen(true);
  };

  const handleSaveMaintenance = async () => {
    setIsSaving(true);
    setErrorMsg('');
    setSaveSuccessMsg('');
    try {
      const res = await setMaintenanceMode(targetEnabled, customMessage, estimatedTime || null);
      if (res?.error) {
        setErrorMsg(res.error);
      } else if (res?.success && res.status) {
        setMaintenance(res.status);
        setSaveSuccessMsg(targetEnabled ? 'Maintenance mode is now ACTIVE!' : 'Maintenance mode deactivated.');
        setTimeout(() => {
          setIsMaintenanceModalOpen(false);
          router.refresh();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update maintenance mode');
    } finally {
      setIsSaving(false);
    }
  };

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

        {/* Maintenance Toggle (Admins Only) */}
        {profile?.role === 'admin' && (
          <button
            onClick={openMaintenanceModal}
            className="header-stat-badge"
            title="Toggle Site Maintenance Mode"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '10px',
              border: maintenance.enabled
                ? '1px solid rgba(245, 158, 11, 0.5)'
                : '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
              background: maintenance.enabled
                ? 'rgba(245, 158, 11, 0.16)'
                : 'var(--hero-glow-1, rgba(255,255,255,0.04))',
              fontSize: '12px',
              fontWeight: 600,
              color: maintenance.enabled ? '#f59e0b' : 'var(--text-secondary, #94a3b8)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Wrench size={13} style={{ color: maintenance.enabled ? '#f59e0b' : 'currentColor' }} />
            <span>{maintenance.enabled ? 'Maintenance ON' : 'Maintenance'}</span>
            {maintenance.enabled && (
              <span className="pulse-dot" style={{ width: '6px', height: '6px', background: '#f59e0b' }} />
            )}
          </button>
        )}

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

      {/* Maintenance Settings Modal */}
      <AnimatePresence>
        {isMaintenanceModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSaving && setIsMaintenanceModalOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
              }}
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '520px',
                background: 'var(--bg-card, #111827)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
                zIndex: 10000,
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: targetEnabled ? 'rgba(245, 158, 11, 0.18)' : 'rgba(148, 163, 184, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: targetEnabled ? '#f59e0b' : 'var(--text-secondary)'
                  }}>
                    <Wrench size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>Site Maintenance Mode</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Show maintenance screen to workers while keeping admin access</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  disabled={isSaving}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Status Switcher Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div
                  onClick={() => setTargetEnabled(false)}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: !targetEnabled ? '2px solid #10b981' : '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                    background: !targetEnabled ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary, rgba(255,255,255,0.03))',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: !targetEnabled ? '#10b981' : 'var(--text-primary)' }}>
                      Normal (Live)
                    </span>
                    {!targetEnabled && <Check size={16} color="#10b981" />}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                    Workers have normal access to dashboard and tasks.
                  </p>
                </div>

                <div
                  onClick={() => setTargetEnabled(true)}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: targetEnabled ? '2px solid #f59e0b' : '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                    background: targetEnabled ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-secondary, rgba(255,255,255,0.03))',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: targetEnabled ? '#f59e0b' : 'var(--text-primary)' }}>
                      Maintenance Mode
                    </span>
                    {targetEnabled && <Check size={16} color="#f59e0b" />}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                    Workers are paused and see the Under Maintenance page.
                  </p>
                </div>
              </div>

              {/* Maintenance Notice Message */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Worker Notice Message
                </label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Explain why the site is down and what is being updated..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
                    background: 'var(--bg-secondary, rgba(0,0,0,0.25))',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Estimated Completion */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Estimated Completion (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    placeholder="e.g. 30 minutes, 11:45 PM EST, Tonight"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
                      background: 'var(--bg-secondary, rgba(0,0,0,0.25))',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              {/* Informational Alert */}
              <div style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: targetEnabled ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                border: targetEnabled ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(59, 130, 246, 0.2)',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '11.5px',
                color: targetEnabled ? '#f59e0b' : '#60a5fa'
              }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  {targetEnabled
                    ? 'Admins maintain full access to all panels and test features while workers see the maintenance screen with auto-reload.'
                    : 'Saving will immediately allow all workers to log in and access tasks normally.'}
                </span>
              </div>

              {errorMsg && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px' }}>
                  {errorMsg}
                </div>
              )}

              {saveSuccessMsg && (
                <div style={{ color: '#10b981', fontSize: '12px', marginBottom: '12px' }}>
                  {saveSuccessMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  disabled={isSaving}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMaintenance}
                  disabled={isSaving}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background: targetEnabled ? '#f59e0b' : '#3b82f6',
                    color: targetEnabled ? '#000' : '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
