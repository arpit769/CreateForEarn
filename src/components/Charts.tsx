'use client';

import { useEffect, useRef } from 'react';
import type { ChartDataPoint } from '@/data/mockData';

// ---- Area Chart ----
interface AreaChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  secondaryColor?: string;
  showLabels?: boolean;
  showGrid?: boolean;
}

export function AreaChart({ data, height = 200, color = '#7c3aed', secondaryColor = '#06b6d4', showLabels = true, showGrid = true }: AreaChartProps) {
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
    const padding = { top: 10, right: 10, bottom: showLabels ? 30 : 10, left: 45 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    const allValues = data.flatMap(d => [d.value, d.value2 || 0]);
    const maxVal = Math.max(...allValues) * 1.1;
    const step = chartW / (data.length - 1);

    // Grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();

        // Y labels
        const val = Math.round(maxVal - (maxVal / 4) * i);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toString(), padding.left - 8, y + 3);
      }
    }

    // Draw area + line for secondary data
    if (data[0].value2 !== undefined) {
      drawArea(ctx, data.map(d => d.value2!), maxVal, step, padding, chartH, secondaryColor, 0.08);
      drawLine(ctx, data.map(d => d.value2!), maxVal, step, padding, chartH, secondaryColor);
    }

    // Draw area + line for primary data
    drawArea(ctx, data.map(d => d.value), maxVal, step, padding, chartH, color, 0.15);
    drawLine(ctx, data.map(d => d.value), maxVal, step, padding, chartH, color);

    // X labels
    if (showLabels) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      const labelStep = Math.max(1, Math.floor(data.length / 8));
      data.forEach((d, i) => {
        if (i % labelStep === 0) {
          const x = padding.left + i * step;
          ctx.fillText(d.label, x, h - 8);
        }
      });
    }
  }, [data, height, color, secondaryColor, showLabels, showGrid]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px` }} />;
}

function drawArea(ctx: CanvasRenderingContext2D, values: number[], max: number, step: number, padding: { top: number; left: number; bottom: number; right: number }, chartH: number, color: string, opacity: number) {
  const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
  gradient.addColorStop(0, color + Math.round(opacity * 255).toString(16).padStart(2, '0'));
  gradient.addColorStop(1, color + '00');

  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + chartH);
  values.forEach((val, i) => {
    const x = padding.left + i * step;
    const y = padding.top + chartH - (val / max) * chartH;
    ctx.lineTo(x, y);
  });
  ctx.lineTo(padding.left + (values.length - 1) * step, padding.top + chartH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
}

function drawLine(ctx: CanvasRenderingContext2D, values: number[], max: number, step: number, padding: { top: number; left: number; bottom: number; right: number }, chartH: number, color: string) {
  ctx.beginPath();
  values.forEach((val, i) => {
    const x = padding.left + i * step;
    const y = padding.top + chartH - (val / max) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ---- Bar Chart ----
interface BarChartProps {
  data: ChartDataPoint[];
  height?: number;
  colors?: string[];
}

export function BarChart({ data, height = 200, colors = ['#7c3aed', '#06b6d4', '#10b981'] }: BarChartProps) {
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
    const padding = { top: 10, right: 10, bottom: 30, left: 45 };
    const chartH = h - padding.top - padding.bottom;
    const chartW = w - padding.left - padding.right;

    ctx.clearRect(0, 0, w, h);

    const hasSecondary = data[0].value2 !== undefined;
    const hasTertiary = data[0].value3 !== undefined;
    const allValues = data.flatMap(d => [d.value, d.value2 || 0, d.value3 || 0]);
    const maxVal = Math.max(...allValues) * 1.1;

    const groupCount = hasSecondary ? (hasTertiary ? 3 : 2) : 1;
    const barGroupWidth = chartW / data.length;
    const barWidth = (barGroupWidth * 0.6) / groupCount;
    const gap = barGroupWidth * 0.4;

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      const val = Math.round(maxVal - (maxVal / 4) * i);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toString(), padding.left - 8, y + 3);
    }

    // Bars
    data.forEach((d, i) => {
      const groupX = padding.left + i * barGroupWidth + gap / 2;
      const vals = [d.value, d.value2, d.value3].filter(v => v !== undefined) as number[];

      vals.forEach((val, j) => {
        const x = groupX + j * barWidth;
        const barH = (val / maxVal) * chartH;
        const y = padding.top + chartH - barH;

        ctx.fillStyle = colors[j % colors.length] + '90';
        ctx.beginPath();
        const radius = 3;
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, padding.top + chartH);
        ctx.lineTo(x, padding.top + chartH);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.fill();
      });

      // X label
      if (i % Math.max(1, Math.floor(data.length / 7)) === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, groupX + (barWidth * groupCount) / 2, h - 8);
      }
    });
  }, [data, height, colors]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px` }} />;
}

// ---- Donut Chart ----
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, size = 180, thickness = 28, centerLabel, centerValue }: DonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = (size - thickness) / 2 - 4;
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let startAngle = -Math.PI / 2;

    ctx.clearRect(0, 0, size, size);

    data.forEach(d => {
      const sliceAngle = (d.value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(center, center, radius, startAngle, startAngle + sliceAngle);
      ctx.strokeStyle = d.color;
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.stroke();
      startAngle += sliceAngle + 0.04;
    });
  }, [data, size, thickness]);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      {centerLabel && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{centerValue}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{centerLabel}</div>
        </div>
      )}
    </div>
  );
}

// ---- Heat Map ----
interface HeatMapProps {
  data: number[][];
  height?: number;
}

export function HeatMap({ data, height = 200 }: HeatMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
    const padding = { top: 5, right: 10, bottom: 20, left: 35 };
    const cellW = (w - padding.left - padding.right) / 24;
    const cellH = (h - padding.top - padding.bottom) / 7;

    ctx.clearRect(0, 0, w, h);

    const max = Math.max(...data.flat());

    data.forEach((row, day) => {
      row.forEach((val, hour) => {
        const intensity = val / max;
        const x = padding.left + hour * cellW;
        const y = padding.top + day * cellH;

        ctx.fillStyle = `rgba(124, 58, 237, ${intensity * 0.8 + 0.05})`;
        ctx.beginPath();
        const r = 2;
        ctx.roundRect(x + 1, y + 1, cellW - 2, cellH - 2, r);
        ctx.fill();
      });

      // Day labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(days[day], padding.left - 6, padding.top + day * cellH + cellH / 2 + 3);
    });

    // Hour labels
    for (let h2 = 0; h2 < 24; h2 += 3) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${h2}:00`, padding.left + h2 * cellW + cellW / 2, h - 4);
    }
  }, [data, height]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px` }} />;
}

// ---- Gauge / Health Score ----
interface GaugeProps {
  value: number;
  max?: number;
  size?: number;
  label: string;
}

export function Gauge({ value, max = 100, size = 140, label }: GaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = size / 2 - 16;
    const startAngle = 0.75 * Math.PI;
    const endAngle = 2.25 * Math.PI;
    const progress = value / max;

    ctx.clearRect(0, 0, size, size);

    // Background arc
    ctx.beginPath();
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Progress arc
    const progressAngle = startAngle + (endAngle - startAngle) * progress;
    const gradient = ctx.createLinearGradient(0, 0, size, 0);
    gradient.addColorStop(0, '#7c3aed');
    gradient.addColorStop(1, progress > 0.7 ? '#10b981' : progress > 0.4 ? '#f59e0b' : '#ef4444');

    ctx.beginPath();
    ctx.arc(center, center, radius, startAngle, progressAngle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();
  }, [value, max, size]);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -40%)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
      </div>
    </div>
  );
}
