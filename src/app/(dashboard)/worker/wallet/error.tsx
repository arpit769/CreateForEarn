'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl mx-auto max-w-lg mt-10">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
        <AlertCircle size={32} />
      </div>
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
        Failed to load wallet data
      </h2>
      <p className="text-[var(--text-secondary)] mb-8">
        A temporary network issue occurred. Please refresh the page to load your updated data.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-[var(--accent-blue)] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
        style={{ background: 'var(--accent-blue)' }}
      >
        Refresh Page
      </button>
    </div>
  );
}
