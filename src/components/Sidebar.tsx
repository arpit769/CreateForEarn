'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { subredditStats } from '@/data/mockData';

const navSections = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: '' },
      { name: 'Analytics', href: '/analytics', icon: '' },
    ],
  },
  {
    label: 'Moderation',
    items: [
      { name: 'Mod Queue', href: '/moderation', icon: '', badge: 23 },
      { name: 'AutoMod Rules', href: '/automod', icon: '' },
      { name: 'Users', href: '/users', icon: '' },
    ],
  },
  {
    label: 'Content',
    items: [
      { name: 'Post Scheduler', href: '/scheduler', icon: '' },
      { name: 'Flairs', href: '/flairs', icon: '' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { name: 'Settings', href: '/settings', icon: '' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo / Subreddit Selector */}
      <div style={{ padding: '20px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <img src="/logo.png" alt="CreateForEarn Logo" style={{
            height: '34px',
            width: 'auto',
            borderRadius: '8px',
            flexShrink: 0,
            objectFit: 'contain'
          }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1.1 }}>CreateForEarn</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
              Community Manager
            </span>
          </div>
        </div>

        {/* Subreddit Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <span style={{ fontSize: '20px' }}>{subredditStats.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {subredditStats.name}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {(subredditStats.subscribers / 1000).toFixed(0)}k members
            </p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
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
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
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
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to Homepage
        </Link>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--gradient-purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
          }}>
            A
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Arpit</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Admin</p>
          </div>
          <div className="pulse-dot" />
        </div>
      </div>
    </aside>
  );
}
