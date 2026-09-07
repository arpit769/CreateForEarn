'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  LayoutDashboard,
  Home,
  Sparkles,
  PenTool,
  Building2,
  CreditCard,
  Info,
  ChevronRight,
  LogIn,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';

import NavHeader from '@/components/ui/nav-header';

const navLinks = [
  { label: 'Home', href: '/', icon: Home, desc: 'Return to homepage' },
  { label: 'How It Works', href: '/how-it-works', icon: Sparkles, desc: 'Step-by-step earnings guide' },
  { label: 'For Writers', href: '/for-writers', icon: PenTool, desc: 'Monetize your content creation' },
  { label: 'For Clients', href: '/for-clients', icon: Building2, desc: 'Scale organic Reddit reach' },
  { label: 'Pricing', href: '/pricing', icon: CreditCard, desc: 'Simple & transparent payouts' },
  { label: 'About', href: '/about', icon: Info, desc: 'Our mission and story' },
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
            className={`mk-nav__hamburger ${mobileMenuOpen ? 'mk-nav__hamburger--open' : ''}`}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={20} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Menu size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop & Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
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

            {/* Menu Card */}
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="mk-nav__mobile-menu"
            >
              {/* Top Trust / Live Badge */}
              <div className="mk-nav__mobile-badge">
                <div className="mk-nav__mobile-badge-live">
                  <span className="mk-nav__mobile-badge-dot" />
                  <span>Platform Live & Verified</span>
                </div>
                <span className="mk-nav__mobile-badge-tag">$1.00 Min Payout</span>
              </div>

              {/* Navigation Items */}
              <div className="mk-nav__mobile-links">
                {navLinks.map((link, idx) => {
                  const active = isActive(link.href);
                  const Icon = link.icon;
                  return (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18, delay: idx * 0.025 + 0.03 }}
                    >
                      <Link
                        href={link.href}
                        className={`mk-nav__mobile-link ${active ? 'mk-nav__mobile-link--active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="mk-nav__mobile-link-left">
                          <div className="mk-nav__mobile-link-icon">
                            <Icon size={18} />
                          </div>
                          <div className="mk-nav__mobile-link-text">
                            <span className="mk-nav__mobile-link-title">{link.label}</span>
                            <span className="mk-nav__mobile-link-desc">{link.desc}</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="mk-nav__mobile-link-arrow" />
                      </Link>
                    </motion.div>
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
                    <LayoutDashboard size={18} />
                    <span>Go to Dashboard</span>
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <div className="mk-nav__mobile-cta-grid">
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

