'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LogOut, Users, ClipboardList, CheckSquare, CreditCard, List, Wallet, 
  User as UserIcon, Gift, HelpCircle, ChevronDown, ChevronUp, ChevronsUpDown, 
  Check, Loader2, Sparkles, PlaySquare, Home, Megaphone, FileText, 
  BarChart2, Settings, Plus, Trophy, ExternalLink 
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { 
  setActiveRedditAccount, 
  setActiveYoutubeAccount, 
  setActiveXAccount, 
  setActiveQuoraAccount, 
  setActiveInstagramAccount 
} from '@/actions/users';
import { getRedditUsername } from '@/utils/reddit';

const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'pending_approval': return { text: 'Pending Verification', color: '#eab308', bg: 'rgba(234,179,8,0.1)' };
    case 'verified': return { text: 'Verified', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
    case 'banned': return { text: 'Banned', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    case 'rejected': return { text: 'Suspended', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    case 'pending_details': return { text: 'Onboarding', color: 'var(--text-muted)', bg: 'var(--bg-elevated)' };
    default: return { text: status || 'Pending', color: 'var(--text-muted)', bg: 'var(--bg-elevated)' };
  }
};

export default function Sidebar({ role, profile: initialProfile }: { role?: 'admin' | 'worker' | 'client'; profile?: any }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [isSwitching, setIsSwitching] = useState(false);
  
  // Shrinkable Switcher States
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const [isSwitcherCollapsed, setIsSwitcherCollapsed] = useState(false);
  const [selectedPlatformTab, setSelectedPlatformTab] = useState<'reddit' | 'youtube' | 'x' | 'quora' | 'instagram'>('reddit');
  const accountSwitcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  // Sync selected platform tab with current route
  useEffect(() => {
    if (pathname?.includes('/worker/youtube')) setSelectedPlatformTab('youtube');
    else if (pathname?.includes('/worker/x')) setSelectedPlatformTab('x');
    else if (pathname?.includes('/worker/quora')) setSelectedPlatformTab('quora');
    else if (pathname?.includes('/worker/instagram')) setSelectedPlatformTab('instagram');
    else if (pathname?.includes('/worker/available') || pathname?.includes('/worker/karma')) setSelectedPlatformTab('reddit');
  }, [pathname]);

  // Auto-close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountSwitcherRef.current && !accountSwitcherRef.current.contains(e.target as Node)) {
        setIsAccountSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = async (platform: 'reddit' | 'youtube' | 'x' | 'quora' | 'instagram', id: string) => {
    if (isSwitching) return;
    setIsSwitching(true);
    let res: any = null;
    if (platform === 'reddit') res = await setActiveRedditAccount(id);
    else if (platform === 'youtube') res = await setActiveYoutubeAccount(id);
    else if (platform === 'x') res = await setActiveXAccount(id);
    else if (platform === 'quora') res = await setActiveQuoraAccount(id);
    else if (platform === 'instagram') res = await setActiveInstagramAccount(id);

    if (res && !res.error) {
      setIsAccountSwitcherOpen(false);
      window.location.reload();
    } else {
      alert('Error switching account: ' + (res?.error || 'Unknown error'));
    }
    setIsSwitching(false);
  };

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
    setIsAccountSwitcherOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    if (!confirm('Are you sure you want to sign out?')) return;
    setIsPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/signup';
  };

  const RedditNavIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#ff4500" style={{ display: 'inline-block', flexShrink: 0 }}>
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  );

  const YouTubeNavIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#ff0000" style={{ display: 'inline-block', flexShrink: 0 }}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );

  const XNavIcon = ({ size = 15 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', flexShrink: 0 }}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );

  const QuoraNavIcon = ({ size = 16 }: { size?: number }) => (
    <span style={{ 
      fontWeight: 900, 
      fontSize: `${size}px`, 
      color: '#b92b27', 
      fontFamily: 'serif, Georgia, "Times New Roman"', 
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: `${size}px`,
      height: `${size}px`,
      lineHeight: 1,
      flexShrink: 0
    }}>
      Q
    </span>
  );

  const InstagramNavIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', flexShrink: 0 }}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );

  type NavItem = { name: string; href: string; icon: React.ReactNode; badge?: string | number };
  type NavSection = { label: string; items: NavItem[] };

  const adminNavSections: NavSection[] = [
    {
      label: 'Users',
      items: [
        { name: 'Reddit Users', href: '/admin/users', icon: <RedditNavIcon size={18} /> },
        { name: 'YouTube Users', href: '/admin/youtube-users', icon: <YouTubeNavIcon size={18} /> },
        { name: 'X Users', href: '/admin/x-users', icon: <XNavIcon size={15} /> },
        { name: 'Quora Users', href: '/admin/quora-users', icon: <QuoraNavIcon size={16} /> },
        { name: 'Instagram Users', href: '/admin/instagram-users', icon: <InstagramNavIcon size={16} /> },
      ],
    },
    {
      label: 'Tasks',
      items: [
        { name: 'Reddit Tasks', href: '/admin/tasks', icon: <RedditNavIcon size={18} /> },
        { name: 'YouTube Tasks', href: '/admin/youtube-tasks', icon: <YouTubeNavIcon size={18} /> },
        { name: 'X Tasks', href: '/admin/x-tasks', icon: <XNavIcon size={15} /> },
        { name: 'Quora Tasks', href: '/admin/quora-tasks', icon: <QuoraNavIcon size={16} /> },
        { name: 'Instagram Tasks', href: '/admin/instagram-tasks', icon: <InstagramNavIcon size={16} /> },
        { name: 'Karma Farm', href: '/admin/karma-farm', icon: <RedditNavIcon size={18} /> },
      ],
    },
    {
      label: 'Submissions',
      items: [
        { name: 'Reddit Submissions', href: '/admin/submissions', icon: <RedditNavIcon size={18} /> },
        { name: 'YouTube Submissions', href: '/admin/youtube-submissions', icon: <YouTubeNavIcon size={18} /> },
        { name: 'X Submissions', href: '/admin/x-submissions', icon: <XNavIcon size={15} /> },
        { name: 'Quora Submissions', href: '/admin/quora-submissions', icon: <QuoraNavIcon size={16} /> },
        { name: 'Instagram Submissions', href: '/admin/instagram-submissions', icon: <InstagramNavIcon size={16} /> },
      ],
    },
    {
      label: 'Management',
      items: [
        { name: 'Leaderboard', href: '/admin/leaderboard', icon: <Trophy size={18} /> },
        { name: 'Withdrawals', href: '/admin/withdrawals', icon: <CreditCard size={18} /> },
      ],
    },
  ];

  const workerNavSections: NavSection[] = [
    {
      label: 'Tasks',
      items: [
        { name: 'Reddit Tasks', href: '/worker/available-tasks', icon: <RedditNavIcon size={18} /> },
        { name: 'YouTube Tasks', href: '/worker/youtube-tasks', icon: <YouTubeNavIcon size={18} /> },
        { name: 'X Tasks', href: '/worker/x-tasks', icon: <XNavIcon size={15} /> },
        { name: 'Quora Tasks', href: '/worker/quora-tasks', icon: <QuoraNavIcon size={16} /> },
        { name: 'Instagram Tasks', href: '/worker/instagram-tasks', icon: <InstagramNavIcon size={16} /> },
        { name: 'Karma Farm', href: '/worker/karma-farm', icon: <RedditNavIcon size={18} /> },
        { name: 'My Tasks', href: '/worker/my-tasks', icon: <ClipboardList size={18} /> },
      ],
    },
    {
      label: 'Account',
      items: [
        { name: 'Leaderboard', href: '/worker/leaderboard', icon: <Trophy size={18} /> },
        { name: 'Wallet', href: '/worker/wallet', icon: <Wallet size={18} /> },
        { name: 'Referral', href: '/worker/referral', icon: <Gift size={18} /> },
        { name: 'Profile', href: '/worker/profile', icon: <UserIcon size={18} /> },
        { name: 'Help & Support', href: '/worker/help', icon: <HelpCircle size={18} /> },
      ],
    },
  ];

  const clientNavSections: NavSection[] = [
    {
      label: 'Main',
      items: [
        { name: 'Dashboard', href: '/client/home', icon: <Home size={18} /> },
        { name: 'Campaigns', href: '/client/campaigns', icon: <Megaphone size={18} /> },
        { name: 'Browse Writers', href: '/client/writers', icon: <Users size={18} /> },
        { name: 'Submissions', href: '/client/submissions', icon: <FileText size={18} /> },
      ],
    },
    {
      label: 'Finance & Settings',
      items: [
        { name: 'Payments', href: '/client/payments', icon: <Wallet size={18} /> },
        { name: 'Reports', href: '/client/reports', icon: <BarChart2 size={18} /> },
        { name: 'Settings', href: '/client/settings', icon: <Settings size={18} /> },
      ],
    },
  ];

  const navSections = role === 'admin' ? adminNavSections : role === 'client' ? clientNavSections : workerNavSections;

  // Platform Accounts
  const allRedditAccounts = profile?.reddit_accounts || [];
  const allYoutubeAccounts = profile?.youtube_accounts || [];
  const allXAccounts = profile?.x_accounts || [];
  const allQuoraAccounts = profile?.quora_accounts || [];
  const allInstagramAccounts = profile?.instagram_accounts || [];

  const activeAccount = allRedditAccounts.find((acc: any) => acc.id === profile?.active_reddit_account_id) || allRedditAccounts[0];
  const activeYoutubeAccount = allYoutubeAccounts.find((a: any) => a.id === profile?.active_youtube_account_id) || allYoutubeAccounts[0];
  const activeXAccount = allXAccounts.find((a: any) => a.id === profile?.active_x_account_id) || allXAccounts[0];
  const activeQuoraAccount = allQuoraAccounts.find((a: any) => a.id === profile?.active_quora_account_id) || allQuoraAccounts[0];
  const activeInstagramAccount = allInstagramAccounts.find((a: any) => a.id === profile?.active_instagram_account_id) || allInstagramAccounts[0];

  const totalConnectedAccounts = allRedditAccounts.length + allYoutubeAccounts.length + allXAccounts.length + allQuoraAccounts.length + allInstagramAccounts.length;

  const getPlatformData = (platform: 'reddit' | 'youtube' | 'x' | 'quora' | 'instagram') => {
    switch(platform) {
      case 'reddit': return {
        name: 'Reddit',
        accounts: allRedditAccounts,
        activeId: profile?.active_reddit_account_id,
        activeAccount,
        getLabel: (a: any) => `u/${getRedditUsername(a.reddit_profile_link)}`,
        brandColor: '#FF4500',
        brandBg: 'rgba(255, 69, 0, 0.1)',
        icon: <RedditNavIcon size={16} />
      };
      case 'youtube': return {
        name: 'YouTube',
        accounts: allYoutubeAccounts,
        activeId: profile?.active_youtube_account_id,
        activeAccount: activeYoutubeAccount,
        getLabel: (a: any) => a.channel_name || a.email_id || 'YouTube Channel',
        brandColor: '#FF0000',
        brandBg: 'rgba(255, 0, 0, 0.1)',
        icon: <YouTubeNavIcon size={16} />
      };
      case 'x': return {
        name: 'X',
        accounts: allXAccounts,
        activeId: profile?.active_x_account_id,
        activeAccount: activeXAccount,
        getLabel: (a: any) => `@${a.username}`,
        brandColor: 'var(--text-primary)',
        brandBg: 'rgba(255, 255, 255, 0.08)',
        icon: <XNavIcon size={14} />
      };
      case 'quora': return {
        name: 'Quora',
        accounts: allQuoraAccounts,
        activeId: profile?.active_quora_account_id,
        activeAccount: activeQuoraAccount,
        getLabel: (a: any) => `q/${a.username}`,
        brandColor: '#B92B27',
        brandBg: 'rgba(185, 43, 39, 0.12)',
        icon: <QuoraNavIcon size={14} />
      };
      case 'instagram': return {
        name: 'Instagram',
        accounts: allInstagramAccounts,
        activeId: profile?.active_instagram_account_id,
        activeAccount: activeInstagramAccount,
        getLabel: (a: any) => `@${a.username}`,
        brandColor: '#E1306C',
        brandBg: 'rgba(225, 48, 108, 0.12)',
        icon: <InstagramNavIcon size={15} />
      };
    }
  };

  const currentPlatformData = getPlatformData(selectedPlatformTab);

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
                {role === 'admin' ? 'Community Manager' : role === 'client' ? 'Brand Client' : 'Worker'}
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
        {role === 'client' && (
          <div style={{ padding: '0 8px 16px 8px' }}>
            <button style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              background: 'rgba(124, 58, 237, 0.1)',
              color: '#7c3aed',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.1)'
            }}>
              <Plus size={16} /> Create Campaign
            </button>
          </div>
        )}
        {navSections.map((section, idx) => (
          <div 
            key={section.label} 
            style={{ 
              marginBottom: '16px',
              paddingTop: idx > 0 ? '14px' : '0px',
              borderTop: idx > 0 ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            <p style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              padding: '0 12px',
              marginBottom: '6px',
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

        {/* Unified Shrinkable Active Account Switcher */}
        {role === 'worker' && profile && (
          <div ref={accountSwitcherRef} style={{ position: 'relative', marginBottom: '12px' }}>
            
            {/* Header with Title + Shrink/Expand Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
              paddingLeft: '4px',
              paddingRight: '2px'
            }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 700,
                color: currentPlatformData.brandColor,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>Active Account</span>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  background: 'var(--border-subtle)',
                  color: 'var(--text-muted)',
                  padding: '1px 5px',
                  borderRadius: '10px'
                }}>
                  {totalConnectedAccounts} linked
                </span>
              </div>

              {/* Shrink / Expand Button */}
              <button
                type="button"
                onClick={() => {
                  setIsSwitcherCollapsed(prev => !prev);
                  setIsAccountSwitcherOpen(false);
                }}
                title={isSwitcherCollapsed ? "Expand Account Switcher" : "Shrink Account Switcher"}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'color 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                {isSwitcherCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>

            {/* COLLAPSED / SHRUNK VIEW: Compact Platform Icon Bar */}
            {isSwitcherCollapsed ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                gap: '4px'
              }}>
                {(['reddit', 'youtube', 'x', 'quora', 'instagram'] as const).map((plt) => {
                  const pData = getPlatformData(plt);
                  const isSelected = selectedPlatformTab === plt;
                  const hasAccount = pData.accounts.length > 0;
                  return (
                    <button
                      key={plt}
                      type="button"
                      onClick={() => {
                        setSelectedPlatformTab(plt);
                        setIsAccountSwitcherOpen(true);
                      }}
                      title={`${pData.name}: ${pData.activeAccount ? pData.getLabel(pData.activeAccount) : 'No account'}`}
                      style={{
                        background: isSelected ? pData.brandBg : 'transparent',
                        border: isSelected ? `1px solid ${pData.brandColor}` : '1px solid transparent',
                        borderRadius: '6px',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        position: 'relative',
                        flex: 1,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {pData.icon}
                      {hasAccount && (
                        <span style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: '#22c55e'
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* EXPANDED VIEW: Platform Mini Tabs + Single Unified Switcher Button */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                
                {/* Platform Mini Tab Strip */}
                <div style={{
                  display: 'flex',
                  background: 'var(--bg-card)',
                  borderRadius: '8px',
                  padding: '2px',
                  gap: '2px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {(['reddit', 'youtube', 'x', 'quora', 'instagram'] as const).map((plt) => {
                    const pData = getPlatformData(plt);
                    const isSelected = selectedPlatformTab === plt;
                    return (
                      <button
                        key={plt}
                        type="button"
                        onClick={() => setSelectedPlatformTab(plt)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px 2px',
                          borderRadius: '6px',
                          border: 'none',
                          background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                          boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          opacity: isSelected ? 1 : 0.6
                        }}
                        title={pData.name}
                      >
                        {pData.icon}
                      </button>
                    );
                  })}
                </div>

                {/* Main Switcher Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsAccountSwitcherOpen(prev => !prev)}
                  disabled={isSwitching}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'var(--bg-elevated)',
                    border: isAccountSwitcherOpen 
                      ? `1px solid ${currentPlatformData.brandColor}` 
                      : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = currentPlatformData.brandColor;
                    e.currentTarget.style.background = currentPlatformData.brandBg;
                  }}
                  onMouseLeave={(e) => {
                    if (!isAccountSwitcherOpen) {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.background = 'var(--bg-elevated)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1, minWidth: 0 }}>
                    {/* Platform Logo Avatar */}
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: currentPlatformData.activeAccount ? currentPlatformData.brandBg : 'rgba(239, 68, 68, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSwitching ? (
                        <Loader2 size={13} style={{ color: currentPlatformData.brandColor, animation: 'spin 1s linear infinite' }} />
                      ) : (
                        currentPlatformData.icon
                      )}
                    </div>
                    
                    {/* Account Username & Status */}
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minWidth: 0 }}>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {currentPlatformData.activeAccount 
                          ? currentPlatformData.getLabel(currentPlatformData.activeAccount) 
                          : `No ${currentPlatformData.name} Account`}
                      </span>
                      
                      <span style={{ 
                        fontSize: '9.5px', 
                        color: currentPlatformData.activeAccount 
                          ? getStatusDisplay(currentPlatformData.activeAccount.status).color 
                          : 'var(--text-muted)',
                        fontWeight: 500,
                        marginTop: '1px'
                      }}>
                        {currentPlatformData.activeAccount 
                          ? getStatusDisplay(currentPlatformData.activeAccount.status).text 
                          : 'Click to connect'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Right Switch Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px', flexShrink: 0 }}>
                    {currentPlatformData.accounts.length > 1 && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        background: currentPlatformData.brandBg,
                        color: currentPlatformData.brandColor,
                        padding: '1px 5px',
                        borderRadius: '6px'
                      }}>
                        {currentPlatformData.accounts.length}
                      </span>
                    )}
                    <ChevronsUpDown size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </button>
              </div>
            )}

            {/* POPUP / POPOVER: Interactive Account Switcher Menu */}
            {isAccountSwitcherOpen && (
              <div style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-medium)',
                borderRadius: '14px',
                boxShadow: '0 16px 36px rgba(0,0,0,0.35)',
                zIndex: 120,
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '340px',
                animation: 'slideUp 0.15s ease-out'
              }}>
                {/* Popover Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {currentPlatformData.icon}
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Switch {currentPlatformData.name} Account
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAccountSwitcherOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '0 4px',
                      lineHeight: 1
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Platform Selector Tabs */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '4px',
                  background: 'var(--bg-card)',
                  padding: '3px',
                  borderRadius: '8px'
                }}>
                  {(['reddit', 'youtube', 'x', 'quora', 'instagram'] as const).map((plt) => {
                    const pData = getPlatformData(plt);
                    const isSelected = selectedPlatformTab === plt;
                    return (
                      <button
                        key={plt}
                        type="button"
                        onClick={() => setSelectedPlatformTab(plt)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '2px',
                          padding: '5px 2px',
                          borderRadius: '6px',
                          border: 'none',
                          background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                          boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {pData.icon}
                        <span style={{ 
                          fontSize: '8.5px', 
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)'
                        }}>
                          {pData.accounts.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Accounts List for Selected Platform */}
                <div style={{
                  overflowY: 'auto',
                  maxHeight: '170px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  paddingRight: '2px'
                }}>
                  {currentPlatformData.accounts.length === 0 ? (
                    <div style={{
                      padding: '16px 8px',
                      textAlign: 'center',
                      background: 'var(--bg-elevated)',
                      borderRadius: '8px',
                      border: '1px dashed var(--border-subtle)'
                    }}>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        No {currentPlatformData.name} accounts connected.
                      </p>
                      <Link
                        href="/worker/profile"
                        onClick={() => setIsAccountSwitcherOpen(false)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: currentPlatformData.brandColor,
                          textDecoration: 'none'
                        }}
                      >
                        <Plus size={12} /> Add {currentPlatformData.name} Account
                      </Link>
                    </div>
                  ) : (
                    currentPlatformData.accounts.map((acc: any) => {
                      const isActive = acc.id === currentPlatformData.activeId;
                      const label = currentPlatformData.getLabel(acc);
                      const statusInfo = getStatusDisplay(acc.status);

                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => {
                            if (!isActive && !isSwitching) {
                              handleSwitch(selectedPlatformTab, acc.id);
                            }
                          }}
                          disabled={isSwitching || isActive}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            background: isActive ? currentPlatformData.brandBg : 'var(--bg-elevated)',
                            border: isActive 
                              ? `1px solid ${currentPlatformData.brandColor}` 
                              : '1px solid var(--border-subtle)',
                            textAlign: 'left',
                            cursor: isActive ? 'default' : 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = 'var(--hero-glow-1)';
                              e.currentTarget.style.borderColor = 'var(--border-medium)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = 'var(--bg-elevated)';
                              e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                              <span style={{
                                fontSize: '12px',
                                fontWeight: isActive ? 700 : 500,
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {label}
                              </span>
                              <span style={{ fontSize: '9.5px', color: statusInfo.color, marginTop: '1px' }}>
                                {statusInfo.text}
                              </span>
                            </div>
                          </div>

                          {/* Active Checkmark or Click to Switch prompt */}
                          <div style={{ flexShrink: 0, marginLeft: '6px' }}>
                            {isActive ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#22c55e',
                                background: 'rgba(34, 197, 94, 0.12)',
                                padding: '2px 6px',
                                borderRadius: '6px'
                              }}>
                                <Check size={10} strokeWidth={3} /> Active
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '10px',
                                color: 'var(--text-muted)',
                                fontWeight: 500
                              }}>
                                Switch
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Popover Footer */}
                <div style={{
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Link
                    href="/worker/profile"
                    onClick={() => setIsAccountSwitcherOpen(false)}
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'color 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    Manage all accounts in Profile <ExternalLink size={10} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Client Account Balance Widget */}
        {role === 'client' && (
          <div style={{ marginBottom: '16px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Account Balance
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
              $1,250.00
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Available Balance
            </div>
            <button style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              background: 'var(--accent-blue)',
              color: '#fff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}>
              <Plus size={14} /> Add Funds
            </button>
          </div>
        )}

        {/* Client Support Widget */}
        {role === 'client' && (
          <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Need Help?
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
              Our support team is here 24/7 to help you.
            </div>
            <button style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              background: '#fff',
              color: 'var(--accent-blue)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}>
              <HelpCircle size={14} /> Contact Support
            </button>
          </div>
        )}

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
