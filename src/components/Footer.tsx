'use client';

import Link from 'next/link';
import {
  ShieldCheck,
  ShieldX,
  Lock,
  Headphones,
  Heart
} from 'lucide-react';

const trustBadges = [
  {
    icon: ShieldCheck,
    color: '#ef4444',
    title: '100% Original Content',
    desc: 'Human-written only. No AI generated content allowed.',
  },
  {
    icon: ShieldX,
    color: '#4F46E5',
    title: 'No Manipulation Policy',
    desc: 'No spam, no fake engagement, no shortcuts.',
  },
  {
    icon: Lock,
    color: '#10b981',
    title: 'Secure Payments',
    desc: 'Fast, safe & transparent payouts.',
  },
  {
    icon: Headphones,
    color: '#6366f1',
    title: '24/7 Support',
    desc: "We're here to help you succeed.",
  },
];

export function TrustBadgesStrip() {
  return (
    <section className="mk-trust-strip">
      <div className="mk-container">
        <div className="mk-trust-strip__grid">
          {trustBadges.map((badge) => (
            <div key={badge.title} className="mk-trust-badge">
              <div
                className="mk-trust-badge__icon"
                style={{ color: badge.color }}
              >
                <badge.icon size={22} />
              </div>
              <div>
                <div className="mk-trust-badge__title">{badge.title}</div>
                <div className="mk-trust-badge__desc">{badge.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const footerLinks = {
  Product: [
    { label: 'For Writers', href: '/for-writers' },
    { label: 'For Clients', href: '/for-clients' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Pricing', href: '/pricing' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'FAQs', href: '/faqs' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
  Resources: [
    { label: 'Blog', href: '/blog' },
    { label: 'Changelog', href: '/changelog' },
    { label: 'Help Center', href: '/help' },
    { label: 'Brand', href: '/about' },
  ],
};

export default function Footer() {
  return (
    <>
      <TrustBadgesStrip />
      <footer className="mk-footer">
        <div className="mk-container">
          <div className="mk-footer__grid">
            {/* Brand column */}
            <div className="mk-footer__brand">
              <Link href="/" className="mk-footer__logo">
                <img
                  src="/logo.png"
                  alt="CreateForEarn Logo"
                  className="mk-nav__logo-img"
                />
                <span className="mk-nav__logo-name">CreateForEarn</span>
              </Link>
              <p className="mk-footer__tagline">
                Create Content. Earn More.
              </p>
              <p className="mk-footer__copyright">
                © {new Date().getFullYear()} CreateForEarn. All rights reserved.
              </p>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="mk-footer__col">
                <h4 className="mk-footer__col-title">{category}</h4>
                <ul className="mk-footer__links">
                  {links.map(link => (
                    <li key={link.label}>
                      <Link href={link.href} className="mk-footer__link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mk-footer__bottom">
            <p className="mk-footer__bottom-text">
              Made with <Heart size={14} style={{ display: 'inline', verticalAlign: 'middle', color: '#ef4444' }} /> for creators everywhere
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
