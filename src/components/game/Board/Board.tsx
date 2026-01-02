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

const GRID_SIZE = 17; // 17x17 grid
const CELL = 40; // Cell size
const SIZE = GRID_SIZE * CELL; // 680px total

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

// Grid helper: 17x17 grid, each cell is CELL pixels
// Corners occupy grid cells 0-6 (7 cells) and 10-16 (7 cells)
// Arms occupy grid cells 7-9 (center 3 cells)
// The path runs along the EDGES of the arms (columns 7 and 9, rows 7 and 9)
function G(col: number, row: number) {
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
}

// Generate exactly 68 cells forming a continuous path around the cross
// Grille 17x17 - 4 coins partagés: 8-9, 25-26, 42-43, 59-60
// Ces paires partagent visuellement le même coin de la croix
//
// SEGUROS: [5, 12, 17, 22, 29, 34, 39, 46, 51, 56, 63, 68]
// SALIDAS: 5 (Yellow), 22 (Blue), 39 (Red), 56 (Green)
function getPathCells(): Array<{ x: number; y: number; salida?: number; cellNumber: number }> {
  const cells: Array<{ x: number; y: number; salida?: number; cellNumber: number }> = [];
  
  // Pour les coins partagés, on place les 2 cases côte à côte dans le même espace
  const addSharedCorner = (col: number, row: number, first: boolean, direction: 'horizontal' | 'vertical', salida?: number) => {
    const offset = CELL / 4;
    let x = col * CELL + CELL / 2;
    let y = row * CELL + CELL / 2;
    if (direction === 'horizontal') {
      x += first ? -offset : offset;
    } else {
      y += first ? -offset : offset;
    }
    cells.push({ x, y, cellNumber: cells.length + 1, salida });
  };
  
  const add = (col: number, row: number, salida?: number) => {
    cells.push({ ...G(col, row), cellNumber: cells.length + 1, salida });
  };

  // ===== 1-7: Du BAS vers le HAUT (col 9, bras BAS côté droit) =====
  add(9, 16);     // 1
  add(9, 15);     // 2
  add(9, 14);     // 3
  add(9, 13);     // 4
  add(9, 12, 3);  // 5 ★ SALIDA Yellow
  add(9, 11);     // 6
  add(9, 10);     // 7

  // ===== 8-9: COIN partagé (jonction BAS → DROIT) =====
  addSharedCorner(10, 9, true, 'horizontal');   // 8
  addSharedCorner(10, 9, false, 'horizontal');  // 9

  // ===== 10-16: Vers la DROITE (row 9, bras DROIT côté bas) =====
  add(11, 9);     // 10
  add(12, 9);     // 11
  add(13, 9);     // 12 ★ SEGURO
  add(14, 9);     // 13
  add(15, 9);     // 14
  add(16, 9);     // 15
  add(16, 8);     // 16

  // ===== 17: Coin DROIT =====
  add(16, 7);     // 17 ★ SEGURO

  // ===== 18-24: Vers la GAUCHE (row 7, bras DROIT côté haut) =====
  add(15, 7);     // 18
  add(14, 7);     // 19
  add(13, 7);     // 20
  add(12, 7);     // 21
  add(11, 7, 1);  // 22 ★ SALIDA Blue
  add(10, 7);     // 23
  add(9, 6);      // 24

  // ===== 25-26: COIN partagé (jonction DROIT → HAUT) =====
  addSharedCorner(9, 5, true, 'vertical');   // 25
  addSharedCorner(9, 5, false, 'vertical');  // 26

  // ===== 27-33: Vers le HAUT (col 9 → coin → col 7, bras HAUT) =====
  add(9, 4);      // 27
  add(9, 3);      // 28
  add(9, 2);      // 29 ★ SEGURO
  add(9, 1);      // 30
  add(9, 0);      // 31
  add(8, 0);      // 32
  add(7, 0);      // 33

  // ===== 34: Coin HAUT =====
  add(7, 1);      // 34 ★ SEGURO

  // ===== 35-41: Vers le BAS (col 7 → row 7, bras HAUT côté gauche) =====
  add(7, 2);      // 35
  add(7, 3);      // 36
  add(7, 4);      // 37
  add(7, 5);      // 38
  add(7, 6, 0);   // 39 ★ SALIDA Red
  add(6, 7);      // 40
  add(5, 7);      // 41

  // ===== 42-43: COIN partagé (jonction HAUT → GAUCHE) =====
  addSharedCorner(4, 7, true, 'horizontal');   // 42
  addSharedCorner(4, 7, false, 'horizontal');  // 43

  // ===== 44-50: Vers la GAUCHE (row 7 → col 0 → row 9, bras GAUCHE) =====
  add(3, 7);      // 44
  add(2, 7);      // 45
  add(1, 7);      // 46 ★ SEGURO
  add(0, 7);      // 47
  add(0, 8);      // 48
  add(0, 9);      // 49
  add(1, 9);      // 50

  // ===== 51: Coin GAUCHE =====
  add(2, 9);      // 51 ★ SEGURO

  // ===== 52-58: Vers la DROITE (row 9 → col 7, bras GAUCHE côté bas) =====
  add(3, 9);      // 52
  add(4, 9);      // 53
  add(5, 9);      // 54
  add(6, 9, 2);   // 55
  add(7, 10);     // 56 ★ SALIDA Green
  add(7, 11);     // 57
  add(7, 12);     // 58

  // ===== 59-60: COIN partagé (jonction GAUCHE → BAS) =====
  addSharedCorner(7, 13, true, 'vertical');   // 59
  addSharedCorner(7, 13, false, 'vertical');  // 60

  // ===== 61-67: Vers le BAS (col 7 → row 16, bras BAS côté gauche) =====
  add(7, 14);     // 61
  add(7, 15);     // 62
  add(7, 16);     // 63 ★ SEGURO
  add(6, 16);     // 64
  add(5, 16);     // 65
  add(4, 16);     // 66
  add(3, 16);     // 67

  // ===== 68: Case finale =====
  add(8, 8);      // 68 ★ SEGURO - CENTRE

  return cells;
}

function BoardBackground() {
  const cornerSize = 7 * CELL; // 7 cells for 17x17 grid
  const armWidth = 3 * CELL;   // 3 cells wide (cols 7-9 or rows 7-9)

  return (
    <g>
      {/* Frame */}
      <rect x={0} y={0} width={SIZE} height={SIZE} fill="#5D3A1A" stroke="#3D2512" strokeWidth={6} />
      <rect x={8} y={8} width={SIZE - 16} height={SIZE - 16} fill="#8B5A2B" stroke="#654321" strokeWidth={3} />

      {/* Cross background */}
      <rect x={cornerSize} y={0} width={armWidth} height={SIZE} fill="#DEB887" stroke="#8B4513" strokeWidth={1} />
      <rect x={0} y={cornerSize} width={SIZE} height={armWidth} fill="#DEB887" stroke="#8B4513" strokeWidth={1} />

      {/* Corners - 4 colored zones */}
      <rect x={10} y={10} width={cornerSize - 10} height={cornerSize - 10} fill={PLAYER_COLORS[2].main} stroke={PLAYER_COLORS[2].dark} strokeWidth={2} />
      <rect x={SIZE - cornerSize} y={10} width={cornerSize - 10} height={cornerSize - 10} fill={PLAYER_COLORS[0].main} stroke={PLAYER_COLORS[0].dark} strokeWidth={2} />
      <rect x={10} y={SIZE - cornerSize} width={cornerSize - 10} height={cornerSize - 10} fill={PLAYER_COLORS[3].main} stroke={PLAYER_COLORS[3].dark} strokeWidth={2} />
      <rect x={SIZE - cornerSize} y={SIZE - cornerSize} width={cornerSize - 10} height={cornerSize - 10} fill={PLAYER_COLORS[1].main} stroke={PLAYER_COLORS[1].dark} strokeWidth={2} />

      {/* Llegada paths (center strip of each arm - col 8 or row 8) */}
      <rect x={8 * CELL} y={cornerSize} width={CELL} height={cornerSize - CELL} fill={PLAYER_COLORS[2].light} stroke={PLAYER_COLORS[2].dark} strokeWidth={1} />
      <rect x={cornerSize + CELL} y={8 * CELL} width={cornerSize - CELL} height={CELL} fill={PLAYER_COLORS[0].light} stroke={PLAYER_COLORS[0].dark} strokeWidth={1} />
      <rect x={8 * CELL} y={cornerSize + armWidth} width={CELL} height={cornerSize - CELL} fill={PLAYER_COLORS[1].light} stroke={PLAYER_COLORS[1].dark} strokeWidth={1} />
      <rect x={cornerSize} y={8 * CELL} width={cornerSize - CELL} height={CELL} fill={PLAYER_COLORS[3].light} stroke={PLAYER_COLORS[3].dark} strokeWidth={1} />

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
        const cellNumber = pos.cellNumber;
        const isHighlighted = highlightedCells.includes(index);
        const isSeguro = BOARD_CONFIG.SEGUROS.includes(cellNumber);
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

        // Determine if we should show the number (hide when pawn is present)
        const showNumber = pawns.length === 0;

        return (
          <g key={index} transform={`translate(${pos.x}, ${pos.y})`} onClick={() => onCellClick(index)} className={styles.cellGroup}>
            <rect x={-CELL / 2 + 1} y={-CELL / 2 + 1} width={CELL - 2} height={CELL - 2} fill={fill} stroke={stroke} strokeWidth={isHighlighted ? 2 : 1} />
            
            {/* Cell number */}
            {showNumber && (
              <text 
                x={0} 
                y={4} 
                textAnchor="middle" 
                fontSize={isSeguro ? 9 : 10} 
                fill={isSeguro ? "#FFD700" : "#5D3A1A"}
                fontWeight="bold"
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                {cellNumber}
              </text>
            )}
            
            {/* Seguro star indicator (small, in corner) */}
            {isSeguro && !isSalida && showNumber && (
              <text x={CELL/2 - 8} y={-CELL/2 + 10} textAnchor="middle" fontSize={8} fill="#FFD700">★</text>
            )}
            
            {/* Salida circle indicator */}
            {isSalida && pos.salida !== undefined && (
              <circle 
                cx={0} 
                cy={0} 
                r={CELL / 2 - 4} 
                fill="none" 
                stroke={PLAYER_COLORS[pos.salida as keyof typeof PLAYER_COLORS].dark} 
                strokeWidth={2}
                opacity={0.6}
              />
            )}
            
            {/* Pawns */}
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
  const cornerSize = 7 * CELL; // 7 cells for 17x17 grid
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
  const cornerSize = 7 * CELL; // 7 cells for 17x17 grid
  // Llegada paths start at col/row 8 (center of the arm)
  const configs = [
    { playerIndex: 0, startX: SIZE - cornerSize - CELL / 2, startY: 8 * CELL + CELL / 2, dx: -1, dy: 0 },
    { playerIndex: 1, startX: 8 * CELL + CELL / 2, startY: SIZE - cornerSize - CELL / 2, dx: 0, dy: -1 },
    { playerIndex: 2, startX: 8 * CELL + CELL / 2, startY: cornerSize + CELL / 2, dx: 0, dy: 1 },
    { playerIndex: 3, startX: cornerSize + CELL / 2, startY: 8 * CELL + CELL / 2, dx: 1, dy: 0 },
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
