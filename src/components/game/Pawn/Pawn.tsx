"use client";

import Image from "next/image";
import styles from "./Pawn.module.css";

interface PawnProps {
  color: string;
  size?: number;
  isSelected?: boolean;
  isMovable?: boolean;
  onClick?: () => void;
  direction?: "f" | "b" | "l" | "r"; // front, back, left, right
}

// Map player colors to pawn animals
const PAWN_ANIMALS: Record<string, string> = {
  red: "jaguar",
  blue: "dolphine",
  green: "frog",
  yellow: "perrot",
};

// Prefix for each animal
const ANIMAL_PREFIX: Record<string, string> = {
  jaguar: "j",
  dolphine: "d",
  frog: "f",
  perrot: "p",
};

export function Pawn({
  color,
  size = 32,
  isSelected = false,
  isMovable = false,
  onClick,
  direction = "f",
}: PawnProps) {
  const animal = PAWN_ANIMALS[color] || "jaguar";
  const prefix = ANIMAL_PREFIX[animal];
  const imagePath = `/Pawns/${animal}/${prefix}${direction}.webp`;

  const classNames = [
    styles.pawn,
    isMovable && styles.pawnMovable,
    isSelected && styles.pawnSelected,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <g onClick={onClick} className={classNames}>
      {/* Selection indicator - pixel art style ring */}
      {isSelected && (
        <rect
          x={-size / 2 - 4}
          y={-size / 2 - 4}
          width={size + 8}
          height={size + 8}
          fill="none"
          stroke="#FFD700"
          strokeWidth={3}
          className={styles.selectionRing}
        />
      )}

      {/* Movable indicator */}
      {isMovable && !isSelected && (
        <rect
          x={-size / 2 - 2}
          y={-size / 2 - 2}
          width={size + 4}
          height={size + 4}
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={2}
          strokeDasharray="4 4"
          className={styles.movableRing}
        />
      )}

      {/* Shadow - pixel art style */}
      <ellipse
        cx={0}
        cy={size / 2 - 2}
        rx={size / 3}
        ry={size / 8}
        fill="rgba(0,0,0,0.4)"
        className={styles.shadow}
      />

      {/* Pawn sprite image using foreignObject */}
      <foreignObject
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        className={styles.spriteContainer}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            src={imagePath}
            alt={`${color} pawn`}
            width={size}
            height={size}
            className={styles.sprite}
            style={{
              imageRendering: "pixelated",
              objectFit: "contain",
            }}
            unoptimized
          />
        </div>
      </foreignObject>
    </g>
  );
}

// Alternative component for HTML context (outside SVG)
export function PawnImage({
  color,
  size = 48,
  isSelected = false,
  isMovable = false,
  onClick,
  direction = "f",
}: PawnProps) {
  const animal = PAWN_ANIMALS[color] || "jaguar";
  const prefix = ANIMAL_PREFIX[animal];
  const imagePath = `/Pawns/${animal}/${prefix}${direction}.webp`;

  const classNames = [
    styles.pawnImage,
    isMovable && styles.pawnMovable,
    isSelected && styles.pawnImageSelected,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} onClick={onClick} style={{ width: size, height: size }}>
      <Image
        src={imagePath}
        alt={`${color} pawn`}
        width={size}
        height={size}
        className={styles.sprite}
        style={{
          imageRendering: "pixelated",
          objectFit: "contain",
        }}
        unoptimized
      />
    </div>
  );
}
