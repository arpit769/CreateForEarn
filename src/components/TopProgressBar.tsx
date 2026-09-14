'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Complete progress on pathname or searchParams change
  useEffect(() => {
    if (visible) {
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept internal link clicks to start loading immediately
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      
      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');
      
      // Only trigger for internal links that are not opening in new tab or jumping to hash
      if (
        href && 
        href.startsWith('/') && 
        !href.startsWith('/#') && 
        (!targetAttr || targetAttr === '_self') &&
        !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey
      ) {
        const currentUrl = window.location.pathname + window.location.search;
        if (href !== currentUrl) {
          setVisible(true);
          setProgress(25);
          
          setTimeout(() => {
            setProgress((prev) => (prev < 65 ? 65 : prev));
          }, 120);

          setTimeout(() => {
            setProgress((prev) => (prev < 85 ? 85 : prev));
          }, 350);
        }
      }
    };

    document.addEventListener('click', handleLinkClick, true);
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 999999,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      {/* Blooming Progress Bar */}
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
          transition: progress === 100 ? 'width 0.2s ease-out, opacity 0.3s ease-out' : 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 0 12px rgba(99, 102, 241, 0.8), 0 0 24px rgba(168, 85, 247, 0.6), 0 0 40px rgba(236, 72, 153, 0.4)',
          position: 'relative',
          borderRadius: '0 2px 2px 0',
        }}
      >
        {/* Trailing Blooming Glow Head */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '-3px',
            width: '100px',
            height: '9px',
            background: 'radial-gradient(ellipse at center, rgba(236, 72, 153, 0.9), rgba(139, 92, 246, 0.5), transparent)',
            filter: 'blur(3px)',
            borderRadius: '50%',
            transform: 'translateX(30%)',
          }}
        />
      </div>
    </div>
  );
}
