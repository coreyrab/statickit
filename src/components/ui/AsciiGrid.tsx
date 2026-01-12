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

    // Smaller cells for processing variant (tighter pixel grid)
    const cellSize = variant === 'processing' ? 12 : 16;
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
            // Processing: Claude-style thinking animation - pixels that toggle on/off rapidly
            const time = timeRef.current;

            // Frame-based randomization (toggles every ~140ms)
            const frameRate = 7;
            const frame = Math.floor(time * frameRate);
            const frameSeed = seed * 0.001 + frame * 0.1;
            const frameRand = seededRandom(frameSeed);

            // Checkerboard base pattern with random variations
            const isCheckerboard = (row + col) % 2 === 0;
            const randomToggle = frameRand > 0.5;

            // Combine checkerboard with random toggle for that "thinking" look
            const isVisible = isCheckerboard ? randomToggle : !randomToggle;

            // Additional randomness layer for more organic feel
            const extraRand = seededRandom(frameSeed + 0.3);
            const showPixel = isVisible || extraRand > 0.7;

            if (!showPixel) {
              continue;
            }

            // Opacity varies per pixel for depth
            const opacityRand = seededRandom(frameSeed + 0.5);
            const blockOpacity = 0.15 + opacityRand * 0.35;

            // Warm neutral colors - slight variation per pixel
            const colorRand = seededRandom(seed * 0.01);
            const brightness = 140 + colorRand * 80;
            r = Math.min(255, brightness + 20);
            g = Math.min(255, brightness);
            b = Math.min(255, brightness - 30);

            // Draw filled rectangle with small gap
            const blockPadding = 2;
            const blockSize = cellSize - blockPadding * 2;

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${blockOpacity})`;
            ctx.fillRect(
              x + blockPadding,
              y + blockPadding,
              blockSize,
              blockSize
            );

            // Skip the character drawing for processing variant
            continue;
          } else {
            // Default: cursor-based pixel animation - only visible near cursor
            const dx = mouseRef.current.x - x;
            const dy = mouseRef.current.y - y;
            const baseDistance = Math.sqrt(dx * dx + dy * dy);

            // Add organic noise to break up the circular shape
            const noiseScale = 60 + rand1 * 80;
            const distance = baseDistance + (rand2 - 0.5) * noiseScale;
            const maxDistance = 220;

            // Only show pixels near the cursor
            if (distance >= maxDistance) {
              continue;
            }

            const time = timeRef.current;

            // Frame-based randomization
            const frameRate = 5;
            const frame = Math.floor(time * frameRate);
            const frameSeed = seed * 0.001 + frame * 0.1;
            const frameRand = seededRandom(frameSeed);

            // Checkerboard base pattern with random variations
            const isCheckerboard = (row + col) % 2 === 0;
            const randomToggle = frameRand > 0.5;
            const isVisible = isCheckerboard ? randomToggle : !randomToggle;

            // Additional randomness - sparser pixels
            const extraRand = seededRandom(frameSeed + 0.3);
            const showPixel = isVisible || extraRand > 0.85;

            if (!showPixel) {
              continue;
            }

            // Opacity based on cursor proximity - very subtle effect
            const proximity = 1 - distance / maxDistance;
            const blockOpacity = 0.015 + proximity * 0.04;

            // Use primary color
            const primary = primaryColorRef.current || { r: 200, g: 120, b: 60 };
            r = primary.r;
            g = primary.g;
            b = primary.b;

            // Draw filled rectangle with small gap
            const blockPadding = 2;
            const blockSize = cellSize - blockPadding * 2;

            const intensity = isDragActive ? 1.5 : 1;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${blockOpacity * intensity})`;
            ctx.fillRect(
              x + blockPadding,
              y + blockPadding,
              blockSize,
              blockSize
            );

            continue;
          }
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
