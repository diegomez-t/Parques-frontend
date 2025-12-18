"use client";

import styles from "./Pawn.module.css";

interface PawnProps {
  color: string;
  size?: number;
  isSelected?: boolean;
  isMovable?: boolean;
  onClick?: () => void;
}

const COLOR_MAP: Record<
  string,
  { fill: string; stroke: string; highlight: string }
> = {
  red: { fill: "#e53935", stroke: "#ab000d", highlight: "#ff6f60" },
  blue: { fill: "#1e88e5", stroke: "#005cb2", highlight: "#6ab7ff" },
  green: { fill: "#43a047", stroke: "#00701a", highlight: "#76d275" },
  yellow: { fill: "#fdd835", stroke: "#c6a700", highlight: "#ffff6b" },
  purple: { fill: "#8e24aa", stroke: "#5c007a", highlight: "#c158dc" },
  orange: { fill: "#fb8c00", stroke: "#c25e00", highlight: "#ffbd45" },
};

export function Pawn({
  color,
  size = 20,
  isSelected = false,
  isMovable = false,
  onClick,
}: PawnProps) {
  const colors = COLOR_MAP[color] || COLOR_MAP.blue;
  const halfSize = size / 2;

  const classNames = [
    styles.pawn,
    isMovable && styles.pawnMovable,
    isSelected && styles.pawnSelected,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <g onClick={onClick} className={classNames}>
      {/* Shadow */}
      <ellipse
        cx={0}
        cy={halfSize * 0.3}
        rx={halfSize * 0.7}
        ry={halfSize * 0.2}
        fill="rgba(0,0,0,0.3)"
      />

      {/* Pawn body (bowling pin shape) */}
      <ellipse
        cx={0}
        cy={0}
        rx={halfSize * 0.8}
        ry={halfSize * 0.5}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={size * 0.05}
      />

      {/* Pawn head */}
      <circle
        cx={0}
        cy={-halfSize * 0.4}
        r={halfSize * 0.4}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={size * 0.05}
      />

      {/* Highlight */}
      <ellipse
        cx={-halfSize * 0.15}
        cy={-halfSize * 0.5}
        rx={halfSize * 0.1}
        ry={halfSize * 0.15}
        fill={colors.highlight}
        opacity={0.6}
      />

      {/* Selection indicator */}
      {isSelected && (
        <circle
          cx={0}
          cy={0}
          r={halfSize * 1.2}
          fill="none"
          stroke="#fff"
          strokeWidth={2}
          strokeDasharray="4 2"
          className={styles.selectionRing}
        />
      )}

      {/* Movable indicator */}
      {isMovable && !isSelected && (
        <circle
          cx={0}
          cy={0}
          r={halfSize * 1.1}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1}
          strokeDasharray="2 2"
          className={styles.movableRing}
        />
      )}
    </g>
  );
}
