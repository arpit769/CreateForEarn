'use client';

import React from 'react';

export type SupportedPlatform = 'reddit' | 'youtube' | 'x' | 'instagram' | 'linkedin' | 'quora';

interface PlatformLogoProps {
  platform: SupportedPlatform | string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function PlatformLogo({ platform, size = 26, className, style }: PlatformLogoProps) {
  const norm = (platform || '').toLowerCase().trim();

  switch (norm) {
    case 'reddit':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          style={{ borderRadius: `${Math.round(size * 0.22)}px`, overflow: 'hidden', flexShrink: 0, ...style }}
        >
          <rect width="24" height="24" rx="5.5" fill="#FF4500" />
          <path
            d="M19.4 12a1.6 1.6 0 0 0-2.6-1.2 7.7 7.7 0 0 0-4.3-1.4l.7-3.4 2.4.5a1.2 1.2 0 1 0 1.2-1.1 1.2 1.2 0 0 0-1.1.8l-2.7-.6a.3.3 0 0 0-.4.3l-.9 4.2a7.8 7.8 0 0 0-4.4 1.4A1.6 1.6 0 1 0 4.6 13a3.5 3.5 0 0 0 0 .8c0 2.4 3.3 4.4 7.4 4.4s7.4-2 7.4-4.4a3.5 3.5 0 0 0 0-.8c.6-.3 1-.9 1-1.6zm-11 .8a1.2 1.2 0 1 1 1.2 1.2 1.2 1.2 0 0 1-1.2-1.2zm6.7 3c-.7.7-2 1-3.1 1s-2.4-.3-3.1-1a.3.3 0 0 1 .4-.4c.5.5 1.6.8 2.7.8s2.2-.3 2.7-.8a.3.3 0 1 1 .4.4zm-.7-1.8a1.2 1.2 0 1 1 1.2-1.2 1.2 1.2 0 0 1-1.2 1.2z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'youtube':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          style={{ borderRadius: `${Math.round(size * 0.22)}px`, overflow: 'hidden', flexShrink: 0, ...style }}
        >
          <rect width="24" height="24" rx="5.5" fill="#FF0000" />
          <path
            d="M19.615 6.643a2.52 2.52 0 0 0-1.777-1.785C16.273 4.444 12 4.444 12 4.444s-4.272 0-5.838.414A2.52 2.52 0 0 0 4.385 6.643C3.974 8.217 3.974 12 3.974 12s0 3.783.411 5.357a2.52 2.52 0 0 0 1.777 1.785c1.566.414 5.838.414 5.838.414s4.273 0 5.838-.414a2.52 2.52 0 0 0 1.777-1.785C20.026 15.783 20.026 12 20.026 12s0-3.783-.411-5.357z"
            fill="#FF0000"
          />
          <polygon points="10,8.5 15.5,12 10,15.5" fill="#FFFFFF" />
        </svg>
      );

    case 'x':
    case 'twitter':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          style={{ borderRadius: `${Math.round(size * 0.22)}px`, overflow: 'hidden', flexShrink: 0, ...style }}
        >
          <rect width="24" height="24" rx="5.5" fill="#000000" />
          <path
            d="M17.53 4.5h2.46l-5.38 6.15 6.33 8.35h-4.96l-3.88-5.08-4.45 5.08H5.19l5.76-6.58L4.88 4.5h5.09l3.52 4.65zm-.86 13.03h1.36L9.42 5.91H7.96z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'instagram':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          style={{ borderRadius: `${Math.round(size * 0.22)}px`, overflow: 'hidden', flexShrink: 0, ...style }}
        >
          <defs>
            <radialGradient id={`ig-grad-${size}`} cx="20%" cy="105%" r="120%">
              <stop offset="0%" stopColor="#fdf497" />
              <stop offset="10%" stopColor="#fdf497" />
              <stop offset="45%" stopColor="#fd5949" />
              <stop offset="65%" stopColor="#d6249f" />
              <stop offset="90%" stopColor="#285AEB" />
            </radialGradient>
          </defs>
          <rect width="24" height="24" rx="5.5" fill={`url(#ig-grad-${size})`} />
          <rect x="5.5" y="5.5" width="13" height="13" rx="3.8" stroke="#FFFFFF" strokeWidth="1.6" fill="none" />
          <circle cx="12" cy="12" r="3.2" stroke="#FFFFFF" strokeWidth="1.6" fill="none" />
          <circle cx="15.8" cy="8.2" r="0.9" fill="#FFFFFF" />
        </svg>
      );

    case 'linkedin':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          style={{ borderRadius: `${Math.round(size * 0.22)}px`, overflow: 'hidden', flexShrink: 0, ...style }}
        >
          <rect width="24" height="24" rx="5.5" fill="#0A66C2" />
          <path
            d="M6.94 8.5H4.28V18.5H6.94V8.5zM5.61 4.5C4.76 4.5 4.07 5.19 4.07 6.04C4.07 6.89 4.76 7.58 5.61 7.58C6.46 7.58 7.15 6.89 7.15 6.04C7.15 5.19 6.46 4.5 5.61 4.5zM19.72 13.06C19.72 10.38 18.29 9.13 16.38 9.13C14.84 9.13 14.15 9.98 13.77 10.57V9.25H11.11C11.15 10 11.11 18.5 11.11 18.5H13.77V13.34C13.77 13.06 13.79 12.78 13.87 12.58C14.09 12.03 14.59 11.45 15.43 11.45C16.53 11.45 16.97 12.29 16.97 13.52V18.5H19.63C19.63 18.5 19.72 18.5 19.72 13.06z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'quora':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          style={{ borderRadius: `${Math.round(size * 0.22)}px`, overflow: 'hidden', flexShrink: 0, ...style }}
        >
          <rect width="24" height="24" rx="5.5" fill="#B92B27" />
          <path
            d="M12.63 16.74c-.58.11-1.15.17-1.71.17-3.77 0-6.17-2.61-6.17-6.52C4.75 6.48 7.2 3.87 11 3.87c3.78 0 6.18 2.61 6.18 6.52 0 1.63-.44 3.06-1.28 4.19l1.79 1.79-.88.88-1.52-1.52c-.78.58-1.74.92-2.66 1.01zm-1.71-1.44c.48 0 .96-.06 1.41-.18l-1.84-1.84.88-.88 1.83 1.83c.59-.87.89-1.92.89-3.32 0-2.88-1.63-4.74-4.27-4.74-2.63 0-4.26 1.86-4.26 4.74 0 2.87 1.63 4.39 5.36 4.39z"
            fill="#FFFFFF"
          />
        </svg>
      );

    default:
      return (
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: `${Math.round(size * 0.22)}px`,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${Math.round(size * 0.45)}px`,
            fontWeight: 800,
            color: 'var(--text-muted)',
            flexShrink: 0,
            ...style
          }}
          className={className}
        >
          {norm.charAt(0).toUpperCase()}
        </div>
      );
  }
}
