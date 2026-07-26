'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Info, Star } from 'lucide-react';

type IconComponentType = React.ElementType<{ className?: string }>;
export interface InteractiveMenuItem {
  label: string;
  icon: IconComponentType;
  href: string;
}

export interface InteractiveMenuProps {
  items: InteractiveMenuItem[];
  accentColor?: string;
}

const defaultAccentColor = 'var(--component-active-color-default, #fff)';

export const InteractiveMenu: React.FC<InteractiveMenuProps> = ({ items, accentColor }) => {
  const pathname = usePathname();
  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const setLineWidth = () => {
      // First, reset all line widths to 0px
      itemRefs.current.forEach((el) => {
        if (el) {
          el.style.setProperty('--lineWidth', '0px');
        }
      });

      const activeIndex = items.findIndex(item => pathname === item.href);
      if (activeIndex === -1) return;

      const activeItemElement = itemRefs.current[activeIndex];
      const activeTextElement = textRefs.current[activeIndex];

      if (activeItemElement && activeTextElement) {
        const textWidth = activeTextElement.offsetWidth;
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`);
      }
    };

    // Small delay to ensure fonts/layout are loaded before calculating width
    setTimeout(setLineWidth, 50);
    window.addEventListener('resize', setLineWidth);
    return () => {
      window.removeEventListener('resize', setLineWidth);
    };
  }, [pathname, items]);

  const navStyle = useMemo(() => {
      const activeColor = accentColor || defaultAccentColor;
      return { '--component-active-color': activeColor } as React.CSSProperties;
  }, [accentColor]); 

  return (
    <nav
      className="interactive-menu"
      role="navigation"
      style={navStyle}
    >
      {items.map((item, index) => {
        const isActive = pathname === item.href;
        const IconComponent = item.icon;

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`interactive-menu__item ${isActive ? 'active' : ''}`}
            ref={(el) => { itemRefs.current[index] = el; }}
            style={{ '--lineWidth': '0px' } as React.CSSProperties} 
          >
            <div className="interactive-menu__icon">
              <IconComponent className="icon" size={18} />
            </div>
            <strong
              className={`interactive-menu__text ${isActive ? 'active' : ''}`}
              ref={(el) => { textRefs.current[index] = el; }}
            >
              {item.label}
            </strong>
          </Link>
        );
      })}
    </nav>
  );
};
