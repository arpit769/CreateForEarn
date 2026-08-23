'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { usePathname } from 'next/navigation';

import { InteractiveMenu } from '@/components/ui/modern-mobile-menu';
import { Sparkles, Route, Info, DollarSign } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '/features', icon: Sparkles },
    { label: 'How It Works', href: '/how-it-works', icon: Route },
    { label: 'Pricing', href: '/pricing', icon: DollarSign },
    { label: 'About', href: '/about', icon: Info },
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="CreateForEarn Logo" style={{
            height: '36px', width: '36px', borderRadius: '10px',
            objectFit: 'cover',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }} />
          <span style={{ fontSize: 'clamp(17px, 4.5vw, 20px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>CreateForEarn</span>
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8">
        <div style={{ display: 'flex', gap: '28px' }}>
          <InteractiveMenu items={navLinks} />
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ThemeToggle />
          <Link href="/signup" className="btn-ghost" style={{ color: 'var(--text-secondary)' }}>
            Sign In
          </Link>
          <Link href="/signup" className="btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>
            Get Started →
          </Link>
        </div>
      </div>

      {/* Mobile Actions */}
      <div className="flex md:hidden items-center gap-4">
        <ThemeToggle />
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[var(--text-primary)]"
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div 
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            padding: '16px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 20px 40px var(--glass-shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            zIndex: 1000,
          }}
          className="md:hidden"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navLinks.map(link => (
              <Link 
                key={link.label} 
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'background 0.15s ease',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon size={18} color="var(--accent-purple)" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
            <Link 
              href="/signup" 
              className="btn-ghost" 
              style={{ justifyContent: 'center', textAlign: 'center', padding: '10px' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="btn-primary" 
              style={{ justifyContent: 'center', textAlign: 'center', width: '100%', padding: '12px' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
