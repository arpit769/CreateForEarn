'use client';

import { useEffect, useRef, useState } from 'react';

interface StatsCardProps {
  icon: string;
  label: string;
  value: number;
  suffix?: string;
  trend?: number;
  color: 'purple' | 'cyan' | 'green' | 'red' | 'orange' | 'blue';
  sparklineData?: number[];
  delay?: number;
}

const colorMap = {
  purple: { gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)', glow: 'rgba(124, 58, 237, 0.15)', text: '#a855f7' },
  cyan: { gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)', glow: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee' },
  green: { gradient: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16, 185, 129, 0.15)', text: '#34d399' },
  red: { gradient: 'linear-gradient(135deg, #ef4444, #f87171)', glow: 'rgba(239, 68, 68, 0.15)', text: '#f87171' },
  orange: { gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
  blue: { gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)', glow: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa' },
};

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = w / (data.length - 1);

    ctx.clearRect(0, 0, w, h);

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, color + '30');
    gradient.addColorStop(1, color + '00');

    ctx.beginPath();
    ctx.moveTo(0, h);
    data.forEach((val, i) => {
      const x = i * step;
      const y = h - ((val - min) / range) * (h - 4) - 2;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = i * step;
      const y = h - ((val - min) / range) * (h - 4) - 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [data, color]);

  return <canvas ref={canvasRef} style={{ width: '80px', height: '32px', opacity: 0.8 }} />;
}

export default function StatsCard({ icon, label, value, suffix = '', trend, color, sparklineData, delay = 0 }: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const colors = colorMap[color];

  useEffect(() => {
    const duration = 800;
    const startTime = Date.now();
    const timer = setTimeout(() => {
      const animate = () => {
        const elapsed = Date.now() - startTime - delay;
        if (elapsed < 0) { requestAnimationFrame(animate); return; }
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.floor(value * eased));
        if (progress < 1) requestAnimationFrame(animate);
      };
      animate();
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  const formatNumber = (n: number): string => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(n >= 100_000 ? 0 : 1) + 'k';
    return n.toLocaleString();
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '20px',
        animation: `slide-up 0.4s ease-out forwards`,
        animationDelay: `${delay}ms`,
        opacity: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: colors.glow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
        }}>
          {icon}
        </div>
        {sparklineData && <MiniSparkline data={sparklineData} color={colors.text} />}
      </div>

      <div style={{ marginBottom: '6px' }}>
        <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          {formatNumber(displayValue)}
        </span>
        {suffix && (
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '4px', fontWeight: 500 }}>
            {suffix}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
        {trend !== undefined && (
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: trend >= 0 ? '#34d399' : '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
