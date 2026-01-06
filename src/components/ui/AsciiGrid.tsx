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

    const animate = () => {
      const rect = container.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const cols = Math.ceil(rect.width / cellSize) + 1;
      const rows = Math.ceil(rect.height / cellSize) + 1;

      timeRef.current += 0.02;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * cellSize;
          const y = row * cellSize;

          const dx = mouseRef.current.x - x;
          const dy = mouseRef.current.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 200;

          // Character morphing based on proximity
          let charIndex = 0;
          if (distance < maxDistance) {
            const proximity = 1 - distance / maxDistance;
            charIndex = Math.floor(proximity * (CHARS.length - 1));
          }

          // Wave animation
          const wave = Math.sin(timeRef.current + col * 0.3 + row * 0.2) * 0.5 + 0.5;
          const baseOpacity = 0.15 + wave * 0.1;

          // Boost opacity near cursor
          let opacity = baseOpacity;
          if (distance < maxDistance) {
            const proximity = 1 - distance / maxDistance;
            opacity = baseOpacity + proximity * 0.4;
          }

          // Amber color: rgb(251, 191, 36) - brighter when dragging
          const intensity = isDragActive ? 1.2 : 1;
          ctx.fillStyle = `rgba(251, 191, 36, ${opacity * intensity})`;
          ctx.font = `${fontSize}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(CHARS[charIndex], x + cellSize / 2, y + cellSize / 2);
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
