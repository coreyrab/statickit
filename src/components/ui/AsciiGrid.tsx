'use client';

import { useEffect, useRef } from 'react';

interface AsciiGridProps {
  className?: string;
  isDragActive?: boolean;
}

const CHARS = ['·', '•', '+', '×', '○', '◉', '◎', '●'];

export function AsciiGrid({ className = '', isDragActive = false }: AsciiGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    const cellSize = 32;
    const fontSize = 14;

    // Seeded random function for consistent per-cell randomness
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    const animate = () => {
      const rect = container.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const cols = Math.ceil(rect.width / cellSize) + 1;
      const rows = Math.ceil(rect.height / cellSize) + 1;

      timeRef.current += 0.02;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Per-cell seed for consistent randomness
          const seed = row * 1000 + col;
          const rand1 = seededRandom(seed);
          const rand2 = seededRandom(seed + 0.5);
          const rand3 = seededRandom(seed + 0.7);

          const x = col * cellSize;
          const y = row * cellSize;

          const dx = mouseRef.current.x - x;
          const dy = mouseRef.current.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 200;

          // Character morphing based on proximity with randomness
          let charIndex = 0;
          if (distance < maxDistance) {
            const proximity = 1 - distance / maxDistance;
            // Add random jitter to character selection near cursor
            const jitter = Math.sin(timeRef.current * 3 + rand1 * 10) * 0.3;
            charIndex = Math.floor((proximity + jitter * proximity) * (CHARS.length - 1));
            charIndex = Math.max(0, Math.min(CHARS.length - 1, charIndex));
          }

          // Wave animation with random phase offset per cell
          const phaseOffset = rand2 * Math.PI * 2;
          const speedVariation = 0.8 + rand3 * 0.4;
          const wave = Math.sin(timeRef.current * speedVariation + col * 0.3 + row * 0.2 + phaseOffset) * 0.5 + 0.5;
          const baseOpacity = 0.08 + wave * 0.10;

          // Random flicker effect
          const flicker = 1 + Math.sin(timeRef.current * 5 + rand1 * 100) * 0.1;

          // Boost opacity near cursor with random variation
          let opacity = baseOpacity * flicker;
          if (distance < maxDistance) {
            const proximity = 1 - distance / maxDistance;
            const randomBoost = 0.3 + rand2 * 0.2;
            opacity = baseOpacity + proximity * randomBoost;
          }

          // Slight position wobble near cursor
          let drawX = x + cellSize / 2;
          let drawY = y + cellSize / 2;
          if (distance < maxDistance) {
            const proximity = 1 - distance / maxDistance;
            const wobbleAmount = proximity * 3;
            drawX += Math.sin(timeRef.current * 4 + rand1 * 10) * wobbleAmount;
            drawY += Math.cos(timeRef.current * 4 + rand2 * 10) * wobbleAmount;
          }

          // Amber color: rgb(251, 191, 36) - brighter when dragging
          const intensity = isDragActive ? 1.2 : 1;
          ctx.fillStyle = `rgba(251, 191, 36, ${opacity * intensity})`;
          ctx.font = `${fontSize}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(CHARS[charIndex], drawX, drawY);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDragActive]);

  return (
    <div ref={containerRef} className={`absolute inset-0 hidden md:block ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
