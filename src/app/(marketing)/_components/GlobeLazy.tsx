'use client';

import dynamic from 'next/dynamic';

// Lazy-load the entire Three.js/WebGL globe — only on the client, after the
// hero text has already painted. This keeps Three.js (~600 KB) out of the
// critical JS path entirely.
const DotGlobeHero = dynamic(
  () => import('@/components/ui/globe-hero').then(m => m.DotGlobeHero),
  {
    ssr: false,
    // While the bundle is downloading, show a height-matched div so the
    // hero layout stays stable and text content can render immediately.
    loading: () => (
      <div
        className="h-auto min-h-0 md:h-screen md:min-h-screen w-full relative overflow-hidden flex items-center justify-center pt-20 pb-8 md:py-0"
        style={{
          background: 'var(--bg-primary)',
        }}
      />
    ),
  }
);

export { DotGlobeHero };
