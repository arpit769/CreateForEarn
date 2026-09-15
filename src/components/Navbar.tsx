'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  Sparkles,
  PenTool,
  Building2,
  CreditCard,
  Info,
  LogIn,
  ArrowRight,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import NavHeader from '@/components/ui/nav-header';

const navLinks = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'How It Works', href: '/how-it-works', icon: Sparkles },
  { label: 'For Writers', href: '/for-writers', icon: PenTool },
  { label: 'For Clients', href: '/for-clients', icon: Building2 },
  { label: 'Pricing', href: '/pricing', icon: CreditCard },
  { label: 'About', href: '/about', icon: Info },
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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className={`mk-nav ${scrolled ? 'mk-nav--scrolled' : ''}`}>
      <div className="mk-nav__inner">
        {/* Logo */}
        <Link href="/" className="mk-nav__logo">
          <div className="mk-nav__logo-icon-box">
            <img
              src="/logo.png"
              alt="CreateForEarn"
              className="mk-nav__logo-img"
            />
          </div>
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
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`mk-nav__hamburger ${mobileMenuOpen ? 'mk-nav__hamburger--open' : ''}`}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className="mk-nav__hamburger-bar" />
            <span className="mk-nav__hamburger-bar" />
            <span className="mk-nav__hamburger-bar" />
          </button>
        </div>
      </div>

      {/* Mobile Right Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mk-nav__mobile-backdrop"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              key="mobile-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="mk-nav__mobile-drawer"
            >
              {/* Drawer Header */}
              <div className="mk-nav__mobile-drawer-header">
                <span className="mk-nav__mobile-drawer-title">Navigation</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mk-nav__mobile-close"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="mk-nav__mobile-links">
                {navLinks.map((link) => {
                  const active = isActive(link.href);
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`mk-nav__mobile-link ${active ? 'mk-nav__mobile-link--active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon size={18} className="mk-nav__mobile-link-icon" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="mk-nav__mobile-cta">
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="mk-btn mk-btn--primary mk-btn--full mk-nav__mobile-cta-btn"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard size={17} />
                    <span>Go to Dashboard</span>
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <div className="mk-nav__mobile-cta-stack">
                    <Link
                      href="/signup"
                      className="mk-btn mk-btn--outline mk-btn--full mk-nav__mobile-login-btn"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LogIn size={16} />
                      <span>Log In</span>
                    </Link>
                    <Link
                      href="/help"
                      className="mk-btn mk-btn--primary mk-btn--full mk-nav__mobile-getstarted-btn"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>Get Started</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}


