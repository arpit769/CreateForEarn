'use client';
import { useTheme } from './ThemeProvider';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  
  if (!mounted) return <div style={{ width: 38, height: 38 }} />;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '38px',
        height: '38px',
        borderRadius: '10px',
        background: 'var(--hero-glow-1)',
        border: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        transition: 'all 0.2s ease',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.2)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

