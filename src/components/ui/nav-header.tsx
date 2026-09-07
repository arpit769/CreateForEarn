"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export interface Position {
  left: number;
  width: number;
  height: number;
  opacity: number;
}

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
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#contact" },
];

export function NavHeader({ items = defaultTabs, className = "", activeHref }: NavHeaderProps) {
  const [position, setPosition] = useState<Position>({
    left: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const containerRef = useRef<HTMLUListElement>(null);
  const tabRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Find active index based on route
  const activeIdx = items.findIndex((item) => {
    if (!activeHref) return false;
    if (item.href === "/") return activeHref === "/";
    return activeHref.startsWith(item.href);
  });

  const moveToActive = () => {
    if (activeIdx !== -1 && tabRefs.current[activeIdx]) {
      const el = tabRefs.current[activeIdx]!;
      setPosition({
        left: el.offsetLeft,
        width: el.offsetWidth,
        height: el.offsetHeight,
        opacity: 1,
      });
      setHoveredIdx(activeIdx);
    } else {
      setPosition((pv) => ({ ...pv, opacity: 0 }));
      setHoveredIdx(null);
    }
  };

  useEffect(() => {
    // Initial positioning
    const timer = setTimeout(() => {
      moveToActive();
    }, 50);
    return () => clearTimeout(timer);
  }, [activeIdx, activeHref]);

  return (
    <ul
      ref={containerRef}
      className={`nav-header-bar ${className}`}
      onMouseLeave={moveToActive}
    >
      {items.map((item, i) => {
        const isSelected = hoveredIdx === i || (hoveredIdx === null && activeIdx === i);

        return (
          <li
            key={item.label}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            onMouseEnter={() => {
              const el = tabRefs.current[i];
              if (!el) return;
              setPosition({
                left: el.offsetLeft,
                width: el.offsetWidth,
                height: el.offsetHeight,
                opacity: 1,
              });
              setHoveredIdx(i);
            }}
            style={{ position: "relative", zIndex: 10, listStyle: "none" }}
          >
            <Link
              href={item.href}
              className={`nav-header-tab ${isSelected ? "nav-header-tab--active-cursor" : ""}`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}

      <motion.li
        animate={{
          left: position.left,
          width: position.width,
          height: position.height,
          opacity: position.opacity,
        }}
        transition={{ type: "spring", stiffness: 450, damping: 32 }}
        className="nav-header-cursor"
        style={{ top: 4 }}
      />
    </ul>
  );
}

export default NavHeader;
