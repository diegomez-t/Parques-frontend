"use client";

import { useState, useEffect } from "react";
import styles from "./Dice.module.css";

interface DiceProps {
  value?: number;
  isRolling?: boolean;
  size?: number;
  onRollComplete?: (value: number) => void;
}

// Dot positions for each dice face - pixel art style
const DOT_POSITIONS: Record<number, Array<{ x: number; y: number }>> = {
  1: [{ x: 50, y: 50 }],
  2: [
    { x: 28, y: 28 },
    { x: 72, y: 72 },
  ],
  3: [
    { x: 28, y: 28 },
    { x: 50, y: 50 },
    { x: 72, y: 72 },
  ],
  4: [
    { x: 28, y: 28 },
    { x: 72, y: 28 },
    { x: 28, y: 72 },
    { x: 72, y: 72 },
  ],
  5: [
    { x: 28, y: 28 },
    { x: 72, y: 28 },
    { x: 50, y: 50 },
    { x: 28, y: 72 },
    { x: 72, y: 72 },
  ],
  6: [
    { x: 28, y: 28 },
    { x: 72, y: 28 },
    { x: 28, y: 50 },
    { x: 72, y: 50 },
    { x: 28, y: 72 },
    { x: 72, y: 72 },
  ],
};

export function Dice({
  value = 1,
  isRolling = false,
  size = 60,
  onRollComplete,
}: DiceProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isRolling) {
      setAnimating(true);

      // Rolling animation - faster for pixel art feel
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 60);

      // Stop after 600ms and show the real value
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setDisplayValue(value);
        setAnimating(false);
        onRollComplete?.(value);
      }, 600);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      setDisplayValue(value);
    }
  }, [isRolling, value, onRollComplete]);

  const dots = DOT_POSITIONS[displayValue] || DOT_POSITIONS[1];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${styles.dice} ${animating ? styles.diceAnimating : ""}`}
      style={{ imageRendering: "pixelated" }}
    >
      {/* Pixel art shadow */}
      <rect
        x={6}
        y={6}
        width={88}
        height={88}
        fill="#1A0F0A"
      />

      {/* Dice main body - pixel art style (no rounded corners) */}
      <rect
        x={0}
        y={0}
        width={88}
        height={88}
        fill="#F5DEB3"
        stroke="#654321"
        strokeWidth={4}
      />
      
      {/* Inner border for depth */}
      <rect
        x={6}
        y={6}
        width={76}
        height={76}
        fill="none"
        stroke="#DEB887"
        strokeWidth={2}
      />

      {/* Highlight edge */}
      <line x1={4} y1={4} x2={84} y2={4} stroke="#FFF8DC" strokeWidth={2} />
      <line x1={4} y1={4} x2={4} y2={84} stroke="#FFF8DC" strokeWidth={2} />

      {/* Dice dots - pixel art squares */}
      {dots.map((dot, index) => (
        <rect
          key={index}
          x={dot.x * 0.88 - 6}
          y={dot.y * 0.88 - 6}
          width={12}
          height={12}
          fill="#2C1810"
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

export function DicePair({
  values = [1, 1],
  isRolling = false,
  size = 60,
  onRollComplete,
}: DicePairProps) {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (isRolling) {
      setCompletedCount(0);
    }
  }, [isRolling]);

  const handleDiceComplete = () => {
    setCompletedCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= 2) {
        onRollComplete?.(values);
      }
      return newCount;
    });
  };

  const isDouble = values[0] === values[1];

  return (
    <div className={styles.dicePair}>
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

      {/* Double indicator - pixel art style */}
      {isDouble && !isRolling && (
        <div className={styles.doubleIndicator}>
          <span className={styles.doubleText}>¡DOBLE!</span>
        </div>
      )}
    </div>
  );
}
