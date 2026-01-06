"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface AsciiGridProps {
  className?: string;
  isDragActive?: boolean;
}

export function AsciiGrid({ className = "", isDragActive = false }: AsciiGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [time, setTime] = useState(0);
  const animationRef = useRef<number>(0);

  // Fun character sets for the border
  const chars = ["·", "•", "◦", "○", "◎", "●", "◉", "✦", "✧", "★", "☆", "✶", "✴", "✹"];
  const sparkleChars = ["✨", "⚡", "💫", "✦", "★"];

  // Grid settings
  const cellSize = 20;

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

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setTime(t => t + 1);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  if (dimensions.width === 0) {
    return <div ref={containerRef} className={`absolute inset-0 ${className}`} />;
  }

  const cols = Math.floor(dimensions.width / cellSize);
  const rows = Math.floor(dimensions.height / cellSize);

  // Calculate total border cells
  const topCells = cols;
  const rightCells = rows - 2;
  const bottomCells = cols;
  const leftCells = rows - 2;
  const totalCells = topCells + rightCells + bottomCells + leftCells;

  // Generate border positions
  const borderCells: { x: number; y: number; index: number }[] = [];

  // Top edge (left to right)
  for (let i = 0; i < cols; i++) {
    borderCells.push({ x: i * cellSize + cellSize / 2, y: cellSize / 2, index: i });
  }

  // Right edge (top to bottom, skip corners)
  for (let i = 1; i < rows - 1; i++) {
    borderCells.push({
      x: dimensions.width - cellSize / 2,
      y: i * cellSize + cellSize / 2,
      index: cols + i - 1
    });
  }

  // Bottom edge (right to left)
  for (let i = cols - 1; i >= 0; i--) {
    borderCells.push({
      x: i * cellSize + cellSize / 2,
      y: dimensions.height - cellSize / 2,
      index: cols + (rows - 2) + (cols - 1 - i)
    });
  }

  // Left edge (bottom to top, skip corners)
  for (let i = rows - 2; i > 0; i--) {
    borderCells.push({
      x: cellSize / 2,
      y: i * cellSize + cellSize / 2,
      index: cols + (rows - 2) + cols + (rows - 2 - i)
    });
  }

  // Animation speed
  const speed = isDragActive ? 0.15 : 0.05;
  const waveOffset = time * speed;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {borderCells.map((cell, i) => {
          // Create a wave effect
          const normalizedIndex = i / totalCells;
          const wave = Math.sin((normalizedIndex * Math.PI * 8) + waveOffset);
          const wave2 = Math.sin((normalizedIndex * Math.PI * 4) + waveOffset * 1.5);

          // Character selection based on wave
          const charIndex = Math.floor(((wave + 1) / 2) * (chars.length - 1));
          let char = chars[charIndex];

          // Occasionally show sparkle characters
          const sparkleChance = isDragActive ? 0.08 : 0.02;
          const isSparkle = Math.sin((normalizedIndex * Math.PI * 16) + waveOffset * 2) > (1 - sparkleChance * 2);
          if (isSparkle) {
            char = sparkleChars[Math.floor(((wave2 + 1) / 2) * (sparkleChars.length - 1))];
          }

          // Color based on wave position
          const hue = isDragActive ? 270 : 250; // Purple
          const saturation = isDragActive ? 80 : 30;
          const lightness = 50 + wave * 20;
          const alpha = isDragActive
            ? 0.6 + wave * 0.4
            : 0.2 + wave * 0.3;

          // Scale based on wave
          const scale = 0.8 + ((wave + 1) / 2) * 0.6;

          return (
            <text
              key={i}
              x={cell.x}
              y={cell.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={`hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`}
              fontSize={14 * scale}
              fontFamily="'SF Mono', 'Fira Code', monospace"
              filter={isSparkle && isDragActive ? "url(#glow)" : undefined}
              style={{
                transition: 'fill 0.3s ease',
              }}
            >
              {char}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
