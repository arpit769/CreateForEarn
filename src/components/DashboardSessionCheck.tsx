'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export function DashboardSessionCheck() {
  useEffect(() => {
    const supabase = createClient();
    
    // Subscribe to auth state changes to catch logouts and redirect immediately
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        window.location.replace('/');
      }
    });

    // Handle bfcache (Back/Forward Cache) restores when using the browser back button
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Check synchronously to avoid a flash of the dashboard
        let hasSession = false;
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
              hasSession = true;
              break;
            }
          }
        } catch (e) {
          // Ignore localStorage errors
        }

        if (!hasSession) {
          // Hide immediately to prevent UI flash
          document.documentElement.style.display = 'none';
          window.location.replace('/');
        } else {
          // Async fallback verification
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
              window.location.replace('/');
            }
          });
        }
      }
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  return null;
}
