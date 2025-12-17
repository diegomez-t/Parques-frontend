"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DiceProps {
  value?: number;
  isRolling?: boolean;
  size?: number;
  onRollComplete?: (value: number) => void;
}

// Positions des points pour chaque face du dé
const DOT_POSITIONS: Record<number, Array<{ x: number; y: number }>> = {
  1: [{ x: 50, y: 50 }],
  2: [
    { x: 25, y: 25 },
    { x: 75, y: 75 },
  ],
  3: [
    { x: 25, y: 25 },
    { x: 50, y: 50 },
    { x: 75, y: 75 },
  ],
  4: [
    { x: 25, y: 25 },
    { x: 75, y: 25 },
    { x: 25, y: 75 },
    { x: 75, y: 75 },
  ],
  5: [
    { x: 25, y: 25 },
    { x: 75, y: 25 },
    { x: 50, y: 50 },
    { x: 25, y: 75 },
    { x: 75, y: 75 },
  ],
  6: [
    { x: 25, y: 25 },
    { x: 75, y: 25 },
    { x: 25, y: 50 },
    { x: 75, y: 50 },
    { x: 25, y: 75 },
    { x: 75, y: 75 },
  ],
};

export function Dice({ value = 1, isRolling = false, size = 60, onRollComplete }: DiceProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [animating, setAnimating] = useState(false);
  
  useEffect(() => {
    if (isRolling) {
      setAnimating(true);
      
      // Animation de roulement
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 80);
      
      // Arrêter après 800ms et montrer la vraie valeur
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setDisplayValue(value);
        setAnimating(false);
        onRollComplete?.(value);
      }, 800);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      setDisplayValue(value);
    }
  }, [isRolling, value, onRollComplete]);

  const dots = DOT_POSITIONS[displayValue] || DOT_POSITIONS[1];
  const dotRadius = size * 0.1;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100"
      className={cn(
        "transition-transform",
        animating && "animate-bounce"
      )}
    >
      {/* Ombre */}
      <rect
        x={8}
        y={8}
        width={84}
        height={84}
        rx={12}
        fill="rgba(0,0,0,0.3)"
      />
      
      {/* Fond du dé */}
      <rect
        x={4}
        y={4}
        width={84}
        height={84}
        rx={12}
        fill="#f5f5f5"
        stroke="#e0e0e0"
        strokeWidth={2}
      />
      
      {/* Dégradé pour effet 3D */}
      <defs>
        <linearGradient id="diceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e8e8e8" />
        </linearGradient>
      </defs>
      <rect
        x={4}
        y={4}
        width={84}
        height={84}
        rx={12}
        fill="url(#diceGradient)"
      />
      
      {/* Points du dé */}
      {dots.map((dot, index) => (
        <circle
          key={index}
          cx={dot.x * 0.84 + 8}
          cy={dot.y * 0.84 + 8}
          r={dotRadius}
          fill="#1a202c"
        />
      ))}
    </svg>
  );
}

interface DicePairProps {
  values?: [number, number];
  isRolling?: boolean;
  size?: number;
  onRollComplete?: (values: [number, number]) => void;
}

export function DicePair({ values = [1, 1], isRolling = false, size = 60, onRollComplete }: DicePairProps) {
  const [completedCount, setCompletedCount] = useState(0);
  
  useEffect(() => {
    if (isRolling) {
      setCompletedCount(0);
    }
  }, [isRolling]);

  const handleDiceComplete = () => {
    setCompletedCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 2) {
        onRollComplete?.(values);
      }
      return newCount;
    });
  };

  const isDouble = values[0] === values[1];

  return (
    <div className="flex items-center gap-3">
      <Dice 
        value={values[0]} 
        isRolling={isRolling} 
        size={size}
        onRollComplete={handleDiceComplete}
      />
      <Dice 
        value={values[1]} 
        isRolling={isRolling} 
        size={size}
        onRollComplete={handleDiceComplete}
      />
      
      {/* Indicateur de double */}
      {isDouble && !isRolling && (
        <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 text-xs font-bold animate-pulse">
          ¡DOBLE!
        </div>
      )}
    </div>
  );
}

