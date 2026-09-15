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
            <SheetContent side="right" className="p-0 bg-[var(--bg-primary)] border-l border-[var(--border-subtle)] text-[var(--text-primary)] w-[88vw] max-w-[360px] flex flex-col justify-between shadow-2xl rounded-l-3xl overflow-hidden">
              <div className="flex flex-col h-full justify-between">
                {/* Brand Header & Close Button */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between p-4 px-5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 via-indigo-500/10 to-transparent p-1 border border-purple-500/30 shadow-sm flex items-center justify-center flex-shrink-0">
                      <img src="/logo.png" alt="CreateForEarn" className="w-full h-full object-contain rounded-lg" />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm block text-[var(--text-primary)] leading-tight tracking-tight">CreateForEarn</span>
                      <span className="text-[10.5px] text-[var(--text-muted)] font-medium block mt-0.5">Create Content. Earn More.</span>
                    </div>
                  </div>
                  <SheetClose
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-8 h-8 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-purple-500/40 hover:bg-purple-500/10 flex items-center justify-center transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    aria-label="Close menu"
                  >
                    <X size={17} />
                  </SheetClose>
                </motion.div>

                {/* Nav items list */}
                <div className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto">
                  {navLinks.map((link, index) => {
                    const active = isActive(link.href);
                    const Icon = link.icon;
                    return (
                      <motion.div
                        key={link.label}
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: 0.04 + index * 0.03,
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
                              <Icon size={17} />
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-sm ${active ? 'font-bold text-[var(--text-primary)]' : 'font-semibold text-[var(--text-primary)]'}`}>
                                {link.label}
                              </span>
                              <span className={`text-[11px] ${active ? 'text-purple-600 dark:text-purple-300 font-medium' : 'text-[var(--text-muted)]'}`}>
                                {link.desc}
                              </span>
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className={`mk-nav__sheet-link-arrow ${active ? 'text-purple-600 dark:text-purple-400 opacity-100 scale-110' : 'text-[var(--text-muted)] opacity-50'}`}
                          />
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Bottom Action CTAs */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 }}
                  className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 flex flex-col gap-2.5 mt-auto"
                >
                  {isAuthenticated ? (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
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
                        className="w-full py-2.5 px-4 rounded-xl border border-[var(--border-medium)] bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] hover:border-purple-500/30 text-[var(--text-primary)] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <LogIn size={16} />
                        <span>Log In</span>
                      </Link>
                      <Link
                        href="/help"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full py-2.5 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
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

