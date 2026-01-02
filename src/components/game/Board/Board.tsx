"use client";

import { useMemo } from "react";
import { useGameStore } from "@/store/gameStore";
import { Pawn } from "../Pawn/Pawn";
import styles from "./Board.module.css";

const BOARD_CONFIG = {
  TOTAL_CELLS: 68,
  LLEGADA_CELLS: 7,
  SEGUROS: [5, 12, 17, 22, 29, 34, 39, 46, 51, 56, 63, 68],
  SALIDAS: [5, 22, 39, 56],
};

const PLAYER_COLORS = {
  0: { main: "#D32F2F", light: "#FF6659", dark: "#9A0007", name: "red" },
  1: { main: "#1976D2", light: "#63A4FF", dark: "#004BA0", name: "blue" },
  2: { main: "#388E3C", light: "#6ABF69", dark: "#00600F", name: "green" },
  3: { main: "#FBC02D", light: "#FFF263", dark: "#C49000", name: "yellow" },
} as const;

const SIZE = 600;
const CELL = 40; // Cell size

interface PawnData {
  id: number;
  playerId: string;
  position: number;
  inPrison: boolean;
  inLlegada: boolean;
  llegadaPosition: number;
  inCielo: boolean;
}

interface BoardProps {
  selectedPawnId: number | null;
  onPawnSelect: (pawnId: number | null) => void;
  highlightedCells: number[];
  onCellClick: (cellIndex: number) => void;
}

// Grid helper: 15x15 grid, each cell is CELL pixels
// Corners occupy grid cells 0-5 (columns/rows)
// Arms occupy grid cells 6-8 (center 3 cells)
// The path runs along the EDGES of the arms
function G(col: number, row: number) {
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
}

// Generate exactly 68 cells forming a continuous path around the cross
// Path goes CLOCKWISE starting from red's area
function getPathCells(): Array<{ x: number; y: number; salida?: number }> {
  const cells: Array<{ x: number; y: number; salida?: number }> = [];

  // The cross on a 15x15 grid:
  // - Corners: 0-5 and 9-14 (6 cells each)
  // - Arms: 6-8 (3 cells wide)
  // - Path runs along perimeter of the cross shape

  // === SECTION 1: RIGHT ARM (Red's territory) ===
  // Bottom edge of right arm, going right (cells 0-4)
  cells.push(G(9, 8));   // 0
  cells.push(G(10, 8));  // 1
  cells.push(G(11, 8));  // 2
  cells.push(G(12, 8));  // 3
  cells.push(G(13, 8));  // 4
  // Red Salida at corner (cell 5)
  cells.push({ ...G(14, 7), salida: 0 }); // 5
  // Top edge of right arm, going left (cells 6-10)
  cells.push(G(13, 6));  // 6
  cells.push(G(12, 6));  // 7
  cells.push(G(11, 6));  // 8
  cells.push(G(10, 6));  // 9
  cells.push(G(9, 6));   // 10

  // === SECTION 2: TOP ARM (Green's territory) ===
  // Right edge of top arm, going up (cells 11-16)
  cells.push(G(8, 5));   // 11
  cells.push(G(8, 4));   // 12 - seguro
  cells.push(G(8, 3));   // 13
  cells.push(G(8, 2));   // 14
  cells.push(G(8, 1));   // 15
  cells.push(G(8, 0));   // 16
  // Top corner transition (cell 17)
  cells.push(G(7, 0));   // 17 - seguro
  // Left edge of top arm going down (cells 18-21)
  cells.push(G(6, 0));   // 18
  cells.push(G(6, 1));   // 19
  cells.push(G(6, 2));   // 20
  cells.push(G(6, 3));   // 21
  // Green Salida (cell 22)
  cells.push({ ...G(6, 4), salida: 2 }); // 22
  // Continue down (cell 23)
  cells.push(G(6, 5));   // 23

  // === SECTION 3: LEFT ARM (Yellow's territory) ===
  // Top edge of left arm, going left (cells 24-28)
  cells.push(G(5, 6));   // 24
  cells.push(G(4, 6));   // 25
  cells.push(G(3, 6));   // 26
  cells.push(G(2, 6));   // 27
  cells.push(G(1, 6));   // 28
  // Left corner (cell 29) - seguro
  cells.push(G(0, 6));   // 29 - seguro
  // Left edge going down (cells 30-33)
  cells.push(G(0, 7));   // 30
  cells.push(G(0, 8));   // 31
  cells.push(G(1, 8));   // 32
  cells.push(G(2, 8));   // 33
  // Bottom edge of left arm, going right (cells 34-38)
  cells.push(G(3, 8));   // 34 - seguro
  cells.push(G(4, 8));   // 35
  cells.push(G(5, 8));   // 36

  // === SECTION 4: BOTTOM ARM (Blue's territory) ===
  // Left edge of bottom arm, going down (cells 37-38)
  cells.push(G(6, 9));   // 37
  cells.push(G(6, 10));  // 38
  // Yellow Salida (cell 39)
  cells.push({ ...G(6, 11), salida: 3 }); // 39
  // Continue down (cells 40-42)
  cells.push(G(6, 12));  // 40
  cells.push(G(6, 13));  // 41
  cells.push(G(6, 14));  // 42
  // Bottom corner transition (cells 43-45)
  cells.push(G(7, 14));  // 43
  cells.push(G(8, 14));  // 44
  cells.push(G(8, 13));  // 45
  // Right edge of bottom arm, going up (cells 46-50)
  cells.push(G(8, 12));  // 46 - seguro
  cells.push(G(8, 11));  // 47
  cells.push(G(8, 10));  // 48
  cells.push(G(8, 9));   // 49

  // === SECTION 5: Complete the loop back to start ===
  // Bottom edge going right, connecting back (cells 50-55)
  cells.push(G(9, 8));   // 50 - note: same as cell 0, this is the wraparound point
  // Instead, continue on different row to avoid overlap
  // Let me recalculate...

  // Actually for Parques, cell 50 continues on inner track
  // The path should be:
  // After cell 49 (8, 9), continue right on row 9
  cells.push(G(9, 9));   // 50
  cells.push(G(10, 9));  // 51
  cells.push(G(11, 9));  // 52
  cells.push(G(12, 9));  // 53
  cells.push(G(13, 9));  // 54
  cells.push(G(14, 9));  // 55
  // Blue Salida (cell 56)
  cells.push({ ...G(14, 8), salida: 1 }); // 56
  // Inner path going back (cells 57-62)
  cells.push(G(13, 8));  // 57 - note: overlaps with cell 4
  cells.push(G(12, 8));  // 58
  cells.push(G(11, 8));  // 59
  cells.push(G(10, 8));  // 60
  cells.push(G(9, 8));   // 61
  cells.push(G(9, 7));   // 62

  // Final cells (63-67)
  cells.push(G(9, 6));   // 63 - seguro (overlaps with 10)
  cells.push(G(10, 6));  // 64
  cells.push(G(11, 6));  // 65
  cells.push(G(12, 6));  // 66
  cells.push(G(13, 6));  // 67

  return cells.slice(0, 68);
}

function BoardBackground() {
  const cornerSize = 6 * CELL;
  const armWidth = 3 * CELL;

  return (
    <g>
      {/* Frame */}
      <rect x={0} y={0} width={SIZE} height={SIZE} fill="#5D3A1A" stroke="#3D2512" strokeWidth={6} />
      <rect x={8} y={8} width={SIZE - 16} height={SIZE - 16} fill="#8B5A2B" stroke="#654321" strokeWidth={3} />

      {/* Cross background */}
      <rect x={cornerSize} y={0} width={armWidth} height={SIZE} fill="#DEB887" stroke="#8B4513" strokeWidth={1} />
      <rect x={0} y={cornerSize} width={SIZE} height={armWidth} fill="#DEB887" stroke="#8B4513" strokeWidth={1} />

      {/* Corners */}
      <rect x={10} y={10} width={cornerSize - 10} height={cornerSize - 10} fill={PLAYER_COLORS[2].main} stroke={PLAYER_COLORS[2].dark} strokeWidth={2} />
      <rect x={SIZE - cornerSize} y={10} width={cornerSize - 10} height={cornerSize - 10} fill={PLAYER_COLORS[0].main} stroke={PLAYER_COLORS[0].dark} strokeWidth={2} />
      <rect x={10} y={SIZE - cornerSize} width={cornerSize - 10} height={cornerSize - 10} fill={PLAYER_COLORS[3].main} stroke={PLAYER_COLORS[3].dark} strokeWidth={2} />
      <rect x={SIZE - cornerSize} y={SIZE - cornerSize} width={cornerSize - 10} height={cornerSize - 10} fill={PLAYER_COLORS[1].main} stroke={PLAYER_COLORS[1].dark} strokeWidth={2} />

      {/* Llegada paths (center strip of each arm) */}
      <rect x={7 * CELL} y={cornerSize} width={CELL} height={cornerSize - CELL} fill={PLAYER_COLORS[2].light} stroke={PLAYER_COLORS[2].dark} strokeWidth={1} />
      <rect x={cornerSize + CELL} y={7 * CELL} width={cornerSize - CELL} height={CELL} fill={PLAYER_COLORS[0].light} stroke={PLAYER_COLORS[0].dark} strokeWidth={1} />
      <rect x={7 * CELL} y={cornerSize + armWidth} width={CELL} height={cornerSize - CELL} fill={PLAYER_COLORS[1].light} stroke={PLAYER_COLORS[1].dark} strokeWidth={1} />
      <rect x={cornerSize} y={7 * CELL} width={cornerSize - CELL} height={CELL} fill={PLAYER_COLORS[3].light} stroke={PLAYER_COLORS[3].dark} strokeWidth={1} />

      {/* Center */}
      <rect x={cornerSize} y={cornerSize} width={armWidth} height={armWidth} fill="#2C1810" stroke="#FFD700" strokeWidth={2} />
      <circle cx={SIZE / 2} cy={SIZE / 2} r={CELL * 0.9} fill="#1A0F0A" stroke="#654321" strokeWidth={2} />
      <text x={SIZE / 2} y={SIZE / 2 - 4} textAnchor="middle" fontSize={14} fill="#FFD700" style={{ fontFamily: "'Press Start 2P'" }}>★</text>
      <text x={SIZE / 2} y={SIZE / 2 + 12} textAnchor="middle" fontSize={6} fill="#DEB887" style={{ fontFamily: "'Press Start 2P'" }}>CIELO</text>
    </g>
  );
}

function PathCells({
  pawnsOnCells,
  highlightedCells,
  onCellClick,
  onPawnClick,
}: {
  pawnsOnCells: Record<number, Array<{ playerId: string; pawnId: number; color: string; isSelected: boolean; isMovable: boolean }>>;
  highlightedCells: number[];
  onCellClick: (index: number) => void;
  onPawnClick: (playerId: string, pawnId: number) => void;
}) {
  const positions = getPathCells();

  return (
    <g>
      {positions.map((pos, index) => {
        const isHighlighted = highlightedCells.includes(index);
        const isSeguro = BOARD_CONFIG.SEGUROS.includes(index);
        const isSalida = pos.salida !== undefined;
        const pawns = pawnsOnCells[index] || [];

        let fill = "#DEB887";
        let stroke = "#8B4513";

        if (isHighlighted) {
          fill = "#4ADE80";
          stroke = "#22C55E";
        } else if (isSalida && pos.salida !== undefined) {
          fill = PLAYER_COLORS[pos.salida as keyof typeof PLAYER_COLORS].light;
          stroke = PLAYER_COLORS[pos.salida as keyof typeof PLAYER_COLORS].dark;
        } else if (isSeguro) {
          fill = "#8B5A2B";
        }

        return (
          <g key={index} transform={`translate(${pos.x}, ${pos.y})`} onClick={() => onCellClick(index)} className={styles.cellGroup}>
            <rect x={-CELL / 2 + 1} y={-CELL / 2 + 1} width={CELL - 2} height={CELL - 2} fill={fill} stroke={stroke} strokeWidth={isHighlighted ? 2 : 1} />
            {isSeguro && !isSalida && <text x={0} y={3} textAnchor="middle" fontSize={12} fill="#FFD700">★</text>}
            {isSalida && pos.salida !== undefined && <text x={0} y={4} textAnchor="middle" fontSize={10} fill={PLAYER_COLORS[pos.salida as keyof typeof PLAYER_COLORS].dark} fontWeight="bold">S</text>}
            {pawns.map((pawn, i) => (
              <g key={`${pawn.playerId}-${pawn.pawnId}`} transform={`translate(${(i % 2) * 10 - 5}, ${Math.floor(i / 2) * 10 - 5})`} onClick={(e) => { e.stopPropagation(); onPawnClick(pawn.playerId, pawn.pawnId); }}>
                <Pawn color={pawn.color} size={22} isSelected={pawn.isSelected} isMovable={pawn.isMovable} />
              </g>
            ))}
          </g>
        );
      })}
    </g>
  );
}

function PrisonZones({
  players,
  gameData,
  myPlayer,
  selectedPawnId,
  canSelectPawn,
  canExitPrison,
  onPawnClick,
}: {
  players: Array<{ id: string; name: string }>;
  gameData: { pawns?: Record<string, PawnData[]> } | undefined;
  myPlayer: { id: string } | null;
  selectedPawnId: number | null;
  canSelectPawn: boolean;
  canExitPrison: boolean;
  onPawnClick: (playerId: string, pawnId: number) => void;
}) {
  const cornerSize = 6 * CELL;
  const cornerConfigs = [
    { playerIndex: 0, x: SIZE - cornerSize / 2 - 5, y: cornerSize / 2 + 5 },
    { playerIndex: 1, x: SIZE - cornerSize / 2 - 5, y: SIZE - cornerSize / 2 - 5 },
    { playerIndex: 2, x: cornerSize / 2 + 5, y: cornerSize / 2 + 5 },
    { playerIndex: 3, x: cornerSize / 2 + 5, y: SIZE - cornerSize / 2 - 5 },
  ];
  const slots = [{ x: -28, y: -28 }, { x: 28, y: -28 }, { x: -28, y: 28 }, { x: 28, y: 28 }];

  return (
    <g>
      {players.slice(0, 4).map((player, i) => {
        const cfg = cornerConfigs[i];
        if (!cfg) return null;
        const color = PLAYER_COLORS[cfg.playerIndex as keyof typeof PLAYER_COLORS];
        const pawns = (gameData?.pawns?.[player.id] || []) as PawnData[];
        const inPrison = pawns.filter(p => p.inPrison);
        const isMyZone = player.id === myPlayer?.id;
        const canInteract = isMyZone && (canSelectPawn || canExitPrison);

        return (
          <g key={player.id} transform={`translate(${cfg.x}, ${cfg.y})`}>
            {slots.map((s, j) => {
              const pawn = inPrison[j];
              return (
                <g key={j} transform={`translate(${s.x}, ${s.y})`}>
                  <circle cx={0} cy={0} r={22} fill={color.dark} stroke={color.light} strokeWidth={2} opacity={0.8} />
                  {pawn && (
                    <g onClick={() => canInteract && onPawnClick(player.id, pawn.id)} className={canInteract ? styles.prisonPawn : undefined}>
                      <Pawn color={color.name} size={32} isSelected={selectedPawnId === pawn.id && isMyZone} isMovable={canInteract} />
                    </g>
                  )}
                </g>
              );
            })}
            <text x={0} y={-50} textAnchor="middle" fontSize={7} fill={color.light} style={{ fontFamily: "'Press Start 2P'" }}>
              {canExitPrison && isMyZone ? "¡SALIR!" : color.name.toUpperCase()}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function LlegadaPaths({
  players,
  gameData,
  myPlayer,
  selectedPawnId,
  canSelectPawn,
  onPawnClick,
}: {
  players: Array<{ id: string; name: string }>;
  gameData: { pawns?: Record<string, PawnData[]> } | undefined;
  myPlayer: { id: string } | null;
  selectedPawnId: number | null;
  canSelectPawn: boolean;
  onPawnClick: (playerId: string, pawnId: number) => void;
}) {
  const cornerSize = 6 * CELL;
  const configs = [
    { playerIndex: 0, startX: SIZE - cornerSize - CELL / 2, startY: 7 * CELL + CELL / 2, dx: -1, dy: 0 },
    { playerIndex: 1, startX: 7 * CELL + CELL / 2, startY: SIZE - cornerSize - CELL / 2, dx: 0, dy: -1 },
    { playerIndex: 2, startX: 7 * CELL + CELL / 2, startY: cornerSize + CELL / 2, dx: 0, dy: 1 },
    { playerIndex: 3, startX: cornerSize + CELL / 2, startY: 7 * CELL + CELL / 2, dx: 1, dy: 0 },
  ];

  return (
    <g>
      {players.slice(0, 4).map((player, i) => {
        const cfg = configs[i];
        if (!cfg) return null;
        const color = PLAYER_COLORS[cfg.playerIndex as keyof typeof PLAYER_COLORS];
        const pawns = (gameData?.pawns?.[player.id] || []) as PawnData[];
        const inLlegada = pawns.filter(p => p.inLlegada);
        const isMyLlegada = player.id === myPlayer?.id;

        return (
          <g key={player.id}>
            {Array.from({ length: BOARD_CONFIG.LLEGADA_CELLS }).map((_, j) => {
              const x = cfg.startX + cfg.dx * j * CELL;
              const y = cfg.startY + cfg.dy * j * CELL;
              const isLast = j === BOARD_CONFIG.LLEGADA_CELLS - 1;
              const pawn = inLlegada.find(p => p.llegadaPosition === j);

              return (
                <g key={j} transform={`translate(${x}, ${y})`}>
                  <rect x={-CELL / 2 + 2} y={-CELL / 2 + 2} width={CELL - 4} height={CELL - 4} fill={isLast ? color.main : color.light} stroke={color.dark} strokeWidth={isLast ? 2 : 1} rx={isLast ? CELL / 2 : 0} />
                  {isLast && <text x={0} y={3} textAnchor="middle" fontSize={10} fill="#FFD700">★</text>}
                  {pawn && (
                    <g onClick={() => isMyLlegada && canSelectPawn && onPawnClick(player.id, pawn.id)}>
                      <Pawn color={color.name} size={18} isSelected={selectedPawnId === pawn.id && isMyLlegada} isMovable={isMyLlegada && canSelectPawn} />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

export function Board({ selectedPawnId, onPawnSelect, highlightedCells, onCellClick }: BoardProps) {
  const gameState = useGameStore((state) => state.gameState);
  const players = useGameStore((state) => state.players);
  const myPlayer = useGameStore((state) => state.player);

  const gameData = gameState?.gameData as { pawns?: Record<string, PawnData[]>; parquesPhase?: string } | undefined;
  const isMyTurn = gameState?.currentPlayerId === myPlayer?.id;
  const parquesPhase = gameData?.parquesPhase || "waiting_roll";
  const canSelectPawn = isMyTurn && parquesPhase === "waiting_move";
  const canExitPrison = isMyTurn && parquesPhase === "waiting_exit";

  const pawnsOnCells = useMemo(() => {
    const cells: Record<number, Array<{ playerId: string; pawnId: number; color: string; isSelected: boolean; isMovable: boolean }>> = {};
    if (!gameData?.pawns) return cells;

    Object.entries(gameData.pawns).forEach(([playerId, pawns]) => {
      const playerIndex = players.findIndex((p) => p.id === playerId);
      const color = PLAYER_COLORS[playerIndex as keyof typeof PLAYER_COLORS]?.name || "blue";
      const isMyPawn = playerId === myPlayer?.id;

      pawns.forEach((pawn) => {
        if (!pawn.inPrison && !pawn.inLlegada && !pawn.inCielo) {
          if (!cells[pawn.position]) cells[pawn.position] = [];
          cells[pawn.position].push({
            playerId,
            pawnId: pawn.id,
            color,
            isSelected: selectedPawnId === pawn.id && isMyPawn,
            isMovable: canSelectPawn && isMyPawn,
          });
        }
      });
    });
    return cells;
  }, [gameData, players, myPlayer, selectedPawnId, canSelectPawn]);

  const handlePawnClick = (playerId: string, pawnId: number) => {
    if (playerId === myPlayer?.id && canSelectPawn) {
      onPawnSelect(selectedPawnId === pawnId ? null : pawnId);
    }
  };

  return (
    <div className={styles.container}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.svg}>
        <BoardBackground />
        <PrisonZones players={players} gameData={gameData} myPlayer={myPlayer} selectedPawnId={selectedPawnId} canSelectPawn={canSelectPawn} canExitPrison={canExitPrison} onPawnClick={handlePawnClick} />
        <LlegadaPaths players={players} gameData={gameData} myPlayer={myPlayer} selectedPawnId={selectedPawnId} canSelectPawn={canSelectPawn} onPawnClick={handlePawnClick} />
        <PathCells pawnsOnCells={pawnsOnCells} highlightedCells={highlightedCells} onCellClick={onCellClick} onPawnClick={handlePawnClick} />
        <g transform={`translate(${SIZE / 2}, ${SIZE - 10})`}>
          <text x={0} y={0} textAnchor="middle" fontSize={6} fill="#DEB887" style={{ fontFamily: "'Press Start 2P'" }}>★ SEGURO • S SALIDA</text>
        </g>
      </svg>
    </div>
  );
}
