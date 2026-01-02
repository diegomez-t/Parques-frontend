import { type ClassValue, clsx } from "clsx";

/**
 * Combine CSS class names conditionally
 * Replacement for tailwind-merge, using only clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Format a player color class name
 */
export function getPlayerColorClass(
  index: number,
  prefix: string = "player"
): string {
  const colors = ["red", "blue", "green", "yellow"];
  return `${prefix}-${colors[index] || "blue"}`;
}
