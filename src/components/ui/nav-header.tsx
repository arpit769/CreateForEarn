'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export interface NavItem {
  label: string;
  href: string;
}

interface NavHeaderProps {
  items?: NavItem[];
  className?: string;
  activeHref?: string;
}

const defaultTabs: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'For Writers', href: '/for-writers' },
  { label: 'For Clients', href: '/for-clients' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
];

export function NavHeader({ items = defaultTabs, className = '', activeHref }: NavHeaderProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const activeIdx = items.findIndex((item) => {
    if (!activeHref) return false;
    if (item.href === '/') return activeHref === '/';
    return activeHref.startsWith(item.href);
  });

  return (
    <ul
      className={`nav-header-bar ${className}`}
      onMouseLeave={() => setHoveredIdx(null)}
    >
      {items.map((item, i) => {
        const isActive = activeIdx === i;
        const isHovered = hoveredIdx === i;
        const isSelected = hoveredIdx !== null ? isHovered : (hoveredIdx === null && isActive);

        return (
          <li
            key={item.label}
            onMouseEnter={() => setHoveredIdx(i)}
            style={{ position: 'relative', listStyle: 'none' }}
          >
            {isSelected && (
              <motion.div
                layoutId="nav-header-active-pill"
                className="nav-header-cursor"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <Link
              href={item.href}
              className={`nav-header-tab ${isSelected ? 'nav-header-tab--active-cursor' : ''}`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default NavHeader;

