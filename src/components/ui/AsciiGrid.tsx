'use client';

import { useEffect, useRef } from 'react';

interface AsciiGridProps {
  className?: string;
  isDragActive?: boolean;
  variant?: 'default' | 'processing';
}

const CHARS = ['·', '∙', '•', '+', '×', '⊕', '○', '◇', '◈', '◉', '◎', '●', '▪', '■'];

// Helper to get RGB values from computed color
function getRgbFromComputedColor(color: string): { r: number; g: number; b: number } {
  // Create a temporary element to compute the color
  const temp = document.createElement('div');
  temp.style.color = color;
  document.body.appendChild(temp);
  const computed = getComputedStyle(temp).color;
  document.body.removeChild(temp);

  // Parse rgb(r, g, b) or rgba(r, g, b, a)
  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
  }
  // Fallback to a warm orange
  return { r: 200, g: 120, b: 60 };
}

export function AsciiGrid({ className = '', isDragActive = false, variant = 'default' }: AsciiGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const primaryColorRef = useRef<{ r: number; g: number; b: number } | null>(null);

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

    // Get primary color from CSS variable
    const updatePrimaryColor = () => {
      const cssColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      if (cssColor) {
        primaryColorRef.current = getRgbFromComputedColor(cssColor);
      }
    };
    updatePrimaryColor();

    // Listen for theme changes
    const observer = new MutationObserver(updatePrimaryColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });

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

          let charIndex = 0;
          let opacity = 0;
          let drawX = x + cellSize / 2;
          let drawY = y + cellSize / 2;
          let r: number, g: number, b: number;

          if (variant === 'processing') {
            // Processing: diffusion-style animation - full coverage with organic noise patches
            const time = timeRef.current;

            // Multiple overlapping noise fields at different scales create organic patches
            const noiseScale1 = 0.08; // Large patches
            const noiseScale2 = 0.15; // Medium patches
            const noiseScale3 = 0.25; // Small detail

            // Animated noise using sine combinations (pseudo-perlin)
            const noise1 = Math.sin(col * noiseScale1 + time * 0.7) * Math.cos(row * noiseScale1 + time * 0.5);
            const noise2 = Math.sin(col * noiseScale2 - time * 1.1 + 50) * Math.cos(row * noiseScale2 + time * 0.8);
            const noise3 = Math.sin(col * noiseScale3 + time * 1.5) * Math.cos(row * noiseScale3 - time * 1.2);

            // Combine noise layers with different weights
            const combinedNoise = (noise1 * 0.5 + noise2 * 0.35 + noise3 * 0.15);
            const normalizedNoise = (combinedNoise + 1) / 2; // 0 to 1

            // Time-based jitter for character flickering
            const flickerRate = 8;
            const flickerSeed = seed + Math.floor(time * flickerRate) * 0.1;
            const flickerRand = seededRandom(flickerSeed);

            // Areas of high noise = more active/visible, low noise = settling/dim
            const activity = normalizedNoise * 0.7 + flickerRand * 0.3;

            // Character selection - more complex chars in active areas
            charIndex = Math.floor(activity * (CHARS.length - 1));
            charIndex = Math.max(0, Math.min(CHARS.length - 1, charIndex));

            // Opacity varies across the surface - creates "patches" of visibility
            const baseOpacity = 0.25;
            const activityBoost = activity * 0.55;
            opacity = baseOpacity + activityBoost;

            // Position jitter in active areas
            if (activity > 0.4) {
              const jitterAmount = (activity - 0.4) * 6;
              drawX += (flickerRand - 0.5) * jitterAmount;
              drawY += (seededRandom(flickerSeed + 0.5) - 0.5) * jitterAmount;
            }

            // Brighter warm tan/cream color
            const brightness = 220 + activity * 35;
            r = brightness;
            g = brightness - 10;
            b = brightness - 30;
          } else {
            // Default: cursor-based animation
            const dx = mouseRef.current.x - x;
            const dy = mouseRef.current.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 200;

            if (distance < maxDistance) {
              const proximity = 1 - distance / maxDistance;
              const jitter = Math.sin(timeRef.current * 3 + rand1 * 10) * 0.3;
              charIndex = Math.floor((proximity + jitter * proximity) * (CHARS.length - 1));
              charIndex = Math.max(0, Math.min(CHARS.length - 1, charIndex));
            }

            const phaseOffset = rand2 * Math.PI * 2;
            const speedVariation = 0.8 + rand3 * 0.4;
            const wave = Math.sin(timeRef.current * speedVariation + col * 0.3 + row * 0.2 + phaseOffset) * 0.5 + 0.5;
            const baseOpacity = 0.04 + wave * 0.05;
            const flicker = 1 + Math.sin(timeRef.current * 5 + rand1 * 100) * 0.1;

            opacity = baseOpacity * flicker;
            if (distance < maxDistance) {
              const proximity = 1 - distance / maxDistance;
              const randomBoost = 0.15 + rand2 * 0.1;
              opacity = baseOpacity + proximity * randomBoost;
            }

            if (distance < maxDistance) {
              const proximity = 1 - distance / maxDistance;
              const wobbleAmount = proximity * 3;
              drawX += Math.sin(timeRef.current * 4 + rand1 * 10) * wobbleAmount;
              drawY += Math.cos(timeRef.current * 4 + rand2 * 10) * wobbleAmount;
            }

            const primary = primaryColorRef.current || { r: 200, g: 120, b: 60 };
            r = primary.r;
            g = primary.g;
            b = primary.b;
          }

          const intensity = isDragActive ? 1.2 : 1;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity * intensity})`;
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
      observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDragActive, variant]);

  return (
    <div ref={containerRef} className={`absolute inset-0 ${variant === 'processing' ? '' : 'hidden md:block'} ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
