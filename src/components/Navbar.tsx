'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

import NavHeader from '@/components/ui/nav-header';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'For Writers', href: '/for-writers' },
  { label: 'For Clients', href: '/for-clients' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check auth session
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className={`mk-nav ${scrolled ? 'mk-nav--scrolled' : ''}`}>
      <div className="mk-nav__inner">
        {/* Logo */}
        <Link href="/" className="mk-nav__logo">
          <img
            src="/logo.png"
            alt="CreateForEarn Logo"
            className="mk-nav__logo-img"
          />
          <div className="mk-nav__logo-text">
            <span className="mk-nav__logo-name">CreateForEarn</span>
            <span className="mk-nav__logo-tagline">Create Content. Earn More.</span>
          </div>
        </Link>

        {/* Desktop Nav Links using animated NavHeader */}
        <div className="mk-nav__links">
          <NavHeader items={navLinks} activeHref={pathname} />
        </div>

        {/* Desktop Actions */}
        <div className="mk-nav__actions">
          <ThemeToggle />
          {isAuthenticated ? (
            <Link href="/dashboard" className="mk-btn mk-btn--primary mk-btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          ) : (
            <>
              <Link href="/signup" className="mk-btn mk-btn--outline mk-btn--sm">
                Log In
              </Link>
              <Link href="/help" className="mk-btn mk-btn--primary mk-btn--sm">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="mk-nav__mobile-actions">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mk-nav__hamburger"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="mk-nav__mobile-menu">
          <div className="mk-nav__mobile-links">
            {navLinks.map(link => (
              <Link
                key={link.label}
                href={link.href}
                className={`mk-nav__mobile-link ${isActive(link.href) ? 'mk-nav__mobile-link--active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mk-nav__mobile-cta">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="mk-btn mk-btn--primary mk-btn--full"
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <LayoutDashboard size={18} /> Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="mk-btn mk-btn--outline mk-btn--full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/help"
                  className="mk-btn mk-btn--primary mk-btn--full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
