'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { usePathname } from 'next/navigation';

import { InteractiveMenu } from '@/components/ui/modern-mobile-menu';
import { Sparkles, Route, Info } from 'lucide-react';

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
    { label: 'About', href: '/about', icon: Info },
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="CreateForEarn Logo" style={{
            width: '36px', height: '36px', borderRadius: '10px',
            boxShadow: '0 4px 12px var(--btn-shadow-2)',
            objectFit: 'cover'
          }} />
          <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            CreateFor<span style={{ color: 'var(--text-secondary)' }}>Earn</span>
          </span>
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8">
        <div style={{ display: 'flex', gap: '28px' }}>
          <InteractiveMenu items={navLinks} />
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ThemeToggle />
          <Link href="/dashboard" className="btn-ghost" style={{ color: 'var(--text-secondary)' }}>
            Sign In
          </Link>
          <Link href="/dashboard" className="btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>
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
        <div className="absolute top-[100%] left-0 right-0 p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] backdrop-blur-md flex flex-col gap-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map(link => (
              <Link 
                key={link.label} 
                href={link.href}
                className="flex items-center gap-3 p-3 rounded-lg text-[var(--text-primary)] hover:bg-[var(--hero-glow-4)] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon size={18} />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <Link href="/dashboard" className="btn-ghost justify-center">
              Sign In
            </Link>
            <Link href="/dashboard" className="btn-primary justify-center w-full text-center">
              Get Started →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
