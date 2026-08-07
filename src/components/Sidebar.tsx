'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Users, ClipboardList, CheckSquare, CreditCard, List, Wallet, User as UserIcon, Gift } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function Sidebar({ role }: { role?: 'admin' | 'worker' }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsPending(false);
    const handleToggle = () => setIsOpen(prev => !prev);
    const handleClose = () => setIsOpen(false);
    
    const handlePageShow = () => {
      setIsPending(false);
    };

    window.addEventListener('toggle-sidebar', handleToggle);
    window.addEventListener('close-sidebar', handleClose);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('toggle-sidebar', handleToggle);
      window.removeEventListener('close-sidebar', handleClose);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    setIsPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/signup';
  };

  type NavItem = { name: string; href: string; icon: React.ReactNode; badge?: string | number };
  type NavSection = { label: string; items: NavItem[] };

  const adminNavSections: NavSection[] = [
    {
      label: 'Admin Dashboard',
      items: [
        { name: 'Users', href: '/admin/users', icon: <Users size={18} /> },
        { name: 'Tasks', href: '/admin/tasks', icon: <ClipboardList size={18} /> },
        { name: 'Submissions', href: '/admin/submissions', icon: <CheckSquare size={18} /> },
        { name: 'Withdrawals', href: '/admin/withdrawals', icon: <CreditCard size={18} /> },
      ],
    },
  ];

  const workerNavSections: NavSection[] = [
    {
      label: 'Worker Dashboard',
      items: [
        { name: 'Available Tasks', href: '/worker/available-tasks', icon: <List size={18} /> },
        { name: 'My Tasks', href: '/worker/my-tasks', icon: <ClipboardList size={18} /> },
        { name: 'Wallet', href: '/worker/wallet', icon: <Wallet size={18} /> },
        { name: 'Referral', href: '/worker/referral', icon: <Gift size={18} /> },
        { name: 'Profile', href: '/worker/profile', icon: <UserIcon size={18} /> },
      ],
    },
  ];

  const navSections = role === 'admin' ? adminNavSections : workerNavSections;

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 35,
          }}
          className="sidebar-overlay"
        />
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo / Subreddit Selector */}
        <div style={{ padding: '20px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="CreateForEarn Logo" style={{
              height: '36px',
              width: '36px',
              borderRadius: '8px',
              flexShrink: 0,
              objectFit: 'cover',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1.1 }}>CreateForEarn</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
                {role === 'admin' ? 'Community Manager' : 'Worker'}
              </span>
            </div>
          </div>
          {/* Mobile close button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="mobile-sidebar-close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'none',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflow: 'auto', padding: '14px 8px' }}>
        {navSections.map((section) => (
          <div key={section.label} style={{ marginBottom: '22px' }}>
            <p style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              padding: '0 12px',
              marginBottom: '8px',
            }}>
              {section.label}
            </p>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '9px',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    marginBottom: '2px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--hero-glow-1)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '18px',
                      borderRadius: '0 4px 4px 0',
                      background: 'var(--gradient-purple)',
                      boxShadow: '0 0 8px rgba(124, 58, 237, 0.4)',
                    }} />
                  )}
                  <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.name}</span>
                  {item.badge && (
                    <span style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#f87171',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '6px',
                      minWidth: '22px',
                      textAlign: 'center',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom — Back to Site + User */}
      <div style={{
        padding: '14px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        {/* Discord Community Link */}
        <a
          href="https://discord.gg/5qu5s87kKu"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#5865F2',
            background: 'rgba(88, 101, 242, 0.08)',
            border: '1px solid rgba(88, 101, 242, 0.2)',
            textDecoration: 'none',
            transition: 'all 0.15s ease',
            marginBottom: '8px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(88, 101, 242, 0.18)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(88, 101, 242, 0.08)'; }}
        >
          <svg width="15" height="15" viewBox="0 0 127.14 96.36" fill="currentColor">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.87-.64,1.71-1.32,2.51-2a75.52,75.52,0,0,0,73,0c.8.7,1.64,1.38,2.51,2a68.43,68.43,0,0,1-10.5,5A77.7,77.7,0,0,0,102,96.36a105.73,105.73,0,0,0,31-18.83C130.1,49.22,124.55,26.41,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.78,46,53.78,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96,46,96,53,91,65.69,84.69,65.69Z"/>
          </svg>
          Join Discord
        </a>

        {/* Back to landing page */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            transition: 'all 0.15s ease',
            marginBottom: '10px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hero-glow-1)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to Homepage
        </Link>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '10px 12px',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>

    {/* Full-screen Loading Overlay for Sign Out */}
    {isPending && (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 12, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        zIndex: 99999
      }}>
        {/* Spinner */}
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
        
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>Signing out</h2>
        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>Please wait...</p>
      </div>
    )}
   </>
  );
}
