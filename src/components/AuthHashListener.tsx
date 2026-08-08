'use client';

import { useEffect } from 'react';

export function AuthHashListener() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      if (hash.includes('type=recovery') && !window.location.pathname.startsWith('/reset-password')) {
        window.location.href = '/reset-password' + hash;
      }
    }
  }, []);

  return null;
}
