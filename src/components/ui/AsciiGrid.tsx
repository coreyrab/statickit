"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface AsciiGridProps {
  className?: string;
  isDragActive?: boolean;
}

export function AsciiGrid({ className = "", isDragActive = false }: AsciiGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Character sets for different intensities
  const chars = ["·", "•", "+", "×", "○", "◉", "◎", "●"];
  const baseChar = "·";

  // Grid settings
  const cellSize = 24;
  const fontSize = 14;

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000 };
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with device pixel ratio for sharpness
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const cols = Math.ceil(dimensions.width / cellSize);
    const rows = Math.ceil(dimensions.height / cellSize);

    const animate = () => {
      timeRef.current += 0.02;
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Get computed styles for colors
      const computedStyle = getComputedStyle(document.documentElement);
      const baseColor = isDragActive
        ? "rgba(147, 51, 234, 0.3)" // Purple when dragging
        : "rgba(156, 163, 175, 0.15)"; // Muted gray
      const glowColor = isDragActive
        ? "rgba(147, 51, 234, 0.9)" // Bright purple
        : "rgba(147, 51, 234, 0.7)"; // Purple glow

      ctx.font = `${fontSize}px "SF Mono", "Fira Code", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * cellSize + cellSize / 2;
          const y = row * cellSize + cellSize / 2;

          // Calculate distance from mouse
          const dx = mouseRef.current.x - x;
          const dy = mouseRef.current.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 120;

          // Wave animation
          const wave = Math.sin(timeRef.current + col * 0.3 + row * 0.3) * 0.5 + 0.5;

          // Determine character and color based on mouse proximity
          let char = baseChar;
          let alpha = 0.15 + wave * 0.1;

          if (distance < maxDistance) {
            const intensity = 1 - distance / maxDistance;
            const charIndex = Math.min(
              Math.floor(intensity * (chars.length - 1)),
              chars.length - 1
            );
            char = chars[charIndex];
            alpha = 0.3 + intensity * 0.7;

            // Color interpolation
            const r = Math.floor(156 + (147 - 156) * intensity);
            const g = Math.floor(163 + (51 - 163) * intensity);
            const b = Math.floor(175 + (234 - 175) * intensity);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          } else {
            ctx.fillStyle = baseColor;
          }

          // Add subtle random flicker
          if (Math.random() > 0.998) {
            char = chars[Math.floor(Math.random() * 3)];
            alpha = 0.4;
          }

          ctx.globalAlpha = alpha;
          ctx.fillText(char, x, y);
        }
      }

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [dimensions, isDragActive, chars, baseChar]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: dimensions.width, height: dimensions.height }}
      />
    </div>
  );
}
