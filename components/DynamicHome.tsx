'use client';

import dynamic from 'next/dynamic';

// ssr: false must live inside a 'use client' component in Next.js 16.
// This ensures HomeClient is never server-rendered, so React never tries
// to hydrate date/time output from the server against the client.
const HomeClient = dynamic(() => import('@/components/HomeClient'), {
  ssr: false,
  loading: () => <div className="min-h-screen" style={{ background: 'var(--bg-0)' }} />,
});

export default function DynamicHome() {
  return <HomeClient />;
}
