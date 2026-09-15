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
  ChevronRight,
  LogIn,
  ArrowRight,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';

import NavHeader from '@/components/ui/nav-header';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

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
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className={`mk-nav__hamburger ${mobileMenuOpen ? 'mk-nav__hamburger--open' : ''}`}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                <span className="mk-nav__hamburger-bar" />
                <span className="mk-nav__hamburger-bar" />
                <span className="mk-nav__hamburger-bar" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 bg-[var(--bg-primary)] border-l border-[var(--border-subtle)] text-[var(--text-primary)] w-[300px] sm:w-[360px] flex flex-col justify-between shadow-2xl">
              <div className="flex flex-col h-full overflow-y-auto p-4">
                {/* Brand Header & Close Button */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-3"
                >
                  <div className="flex items-center gap-2.5">
                    <img src="/logo.png" alt="CreateForEarn" className="w-7 h-7 rounded-lg object-contain" />
                    <div>
                      <span className="font-bold text-sm block text-[var(--text-primary)] leading-tight">CreateForEarn</span>
                      <span className="text-[10px] text-[var(--text-muted)]">Create Content. Earn More.</span>
                    </div>
                  </div>
                  <SheetClose
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-8 h-8 rounded-lg bg-[var(--hero-glow-1)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hero-glow-2)] flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-label="Close menu"
                  >
                    <X size={18} />
                  </SheetClose>
                </motion.div>

                {/* Nav items directly below header bar (shifted up to fill space) */}
                <div className="flex flex-col gap-1.5 flex-1">
                  {navLinks.map((link, index) => {
                    const active = isActive(link.href);
                    const Icon = link.icon;
                    return (
                      <motion.div
                        key={link.label}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.25,
                          delay: 0.05 + index * 0.04,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`mk-nav__sheet-link ${active ? 'mk-nav__sheet-link--active' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`mk-nav__sheet-link-icon ${active ? 'mk-nav__sheet-link-icon--active' : ''}`}>
                              <Icon size={16} />
                            </div>
                            <div>
                              <span className="font-semibold block text-sm">{link.label}</span>
                              <span className="text-xs text-[var(--text-muted)]">{link.desc}</span>
                            </div>
                          </div>
                          <ChevronRight size={15} className={`mk-nav__sheet-link-arrow ${active ? 'opacity-80' : 'opacity-40'}`} />
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Bottom CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.55 }}
                  className="pt-4 border-t border-[var(--border-subtle)] mt-auto flex flex-col gap-2.5"
                >
                  {isAuthenticated ? (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mk-btn mk-btn--primary mk-btn--full flex items-center justify-center gap-2 py-3"
                    >
                      <LayoutDashboard size={17} />
                      <span>Go to Dashboard</span>
                      <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/signup"
                        onClick={() => setMobileMenuOpen(false)}
                        className="mk-btn mk-btn--outline mk-btn--full flex items-center justify-center gap-2 py-2.5 text-sm"
                      >
                        <LogIn size={16} />
                        <span>Log In</span>
                      </Link>
                      <Link
                        href="/help"
                        onClick={() => setMobileMenuOpen(false)}
                        className="mk-btn mk-btn--primary mk-btn--full flex items-center justify-center gap-2 py-2.5 text-sm"
                      >
                        <span>Get Started</span>
                        <ArrowRight size={16} />
                      </Link>
                    </>
                  )}
                </motion.div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

