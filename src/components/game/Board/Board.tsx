"use client";

import { useMemo } from "react";
import { useGameStore } from "@/store/gameStore";
import { Pawn } from "../Pawn/Pawn";
import styles from "./Board.module.css";

// 4-player board configuration
const BOARD_CONFIG = {
  CELLS_PER_SIDE: 17,
  TOTAL_CELLS: 68,
  LLEGADA_CELLS: 8,
  SEGUROS: [0, 7, 17, 24, 34, 41, 51, 58],
  SALIDAS: [0, 17, 34, 51],
};

// Player colors - Parques colombiano style
const PLAYER_COLORS = {
  0: { 
    main: "#D32F2F", 
    light: "#FF6659", 
    dark: "#9A0007", 
    name: "red",
    label: "JAGUAR"
  },
  1: { 
    main: "#1976D2", 
    light: "#63A4FF", 
    dark: "#004BA0", 
    name: "blue",
    label: "DELFÍN"
  },
  2: { 
    main: "#388E3C", 
    light: "#6ABF69", 
    dark: "#00600F", 
    name: "green",
    label: "RANA"
  },
  3: { 
    main: "#FBC02D", 
    light: "#FFF263", 
    dark: "#C49000", 
    name: "yellow",
    label: "LORO"
  },
} as const;

// Board dimensions
const BOARD_SIZE = 680;
const CELL_SIZE = 28;
const CORNER_SIZE = 140;
const PATH_WIDTH = 84; // 3 cells wide

interface CellPosition {
  x: number;
  y: number;
  rotation: number;
}

// Generate cell positions for the cross-shaped path
function generateCellPositions(): CellPosition[] {
  const positions: CellPosition[] = [];
  const center = BOARD_SIZE / 2;
  const pathOffset = PATH_WIDTH / 2;
  
  // Path goes: Right side (bottom to top) → Top (right to left) → Left side (top to bottom) → Bottom (left to right)
  
  // RIGHT ARM: cells 0-16 (bottom to top on right side)
  for (let i = 0; i <= 16; i++) {
    positions.push({
      x: BOARD_SIZE - CORNER_SIZE - CELL_SIZE / 2,
      y: center + pathOffset - CELL_SIZE / 2 - i * CELL_SIZE + 8 * CELL_SIZE,
      rotation: 0,
    });
  }
  
  // TOP ARM: cells 17-33 (right to left on top)
  for (let i = 0; i <= 16; i++) {
    positions.push({
      x: center + pathOffset - CELL_SIZE / 2 - i * CELL_SIZE + 8 * CELL_SIZE,
      y: CORNER_SIZE + CELL_SIZE / 2,
      rotation: 90,
    });
  }
  
  // LEFT ARM: cells 34-50 (top to bottom on left side)
  for (let i = 0; i <= 16; i++) {
    positions.push({
      x: CORNER_SIZE + CELL_SIZE / 2,
      y: center - pathOffset + CELL_SIZE / 2 + i * CELL_SIZE - 8 * CELL_SIZE,
      rotation: 180,
    });
  }
  
  // BOTTOM ARM: cells 51-67 (left to right on bottom)
  for (let i = 0; i <= 16; i++) {
    positions.push({
      x: center - pathOffset + CELL_SIZE / 2 + i * CELL_SIZE - 8 * CELL_SIZE,
      y: BOARD_SIZE - CORNER_SIZE - CELL_SIZE / 2,
      rotation: 270,
    });
  }

  return positions;
}

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

interface BoardCellProps {
  index: number;
  position: CellPosition;
  isSeguro: boolean;
  isSalida: boolean;
  playerSalida?: number;
  pawnsOnCell: Array<{
    playerId: string;
    pawnId: number;
    color: string;
    isSelected: boolean;
    isMovable: boolean;
  }>;
  isHighlighted: boolean;
  onCellClick: (index: number) => void;
  onPawnClick: (playerId: string, pawnId: number) => void;
}

function BoardCell({
  index,
  position,
  isSeguro,
  isSalida,
  playerSalida,
  pawnsOnCell,
  isHighlighted,
  onCellClick,
  onPawnClick,
}: BoardCellProps) {
  const playerColor =
    playerSalida !== undefined
      ? PLAYER_COLORS[playerSalida as keyof typeof PLAYER_COLORS]
      : null;

  const getCellFill = () => {
    if (isHighlighted) return "#4ADE80";
    if (playerColor) return playerColor.light;
    if (isSeguro) return "#8B5A2B";
    return "#DEB887";
  };

  const getCellStroke = () => {
    if (isHighlighted) return "#22C55E";
    if (playerColor) return playerColor.dark;
    if (isSeguro) return "#654321";
    return "#8B4513";
  };

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      onClick={() => onCellClick(index)}
      className={styles.cellGroup}
    >
      {/* Pixel art style cell - square with pixelated border */}
      <rect
        x={-CELL_SIZE / 2}
        y={-CELL_SIZE / 2}
        width={CELL_SIZE}
        height={CELL_SIZE}
        fill={getCellFill()}
        stroke={getCellStroke()}
        strokeWidth={isHighlighted ? 3 : 2}
        className={`${styles.cell} ${isHighlighted ? styles.cellHighlighted : ""}`}
      />

      {/* Seguro star - pixel art style */}
      {isSeguro && !isSalida && (
        <text 
          x={0} 
          y={5} 
          textAnchor="middle" 
          fontSize={14} 
          fill="#FFD700"
          className={styles.cellIcon}
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          ★
        </text>
      )}

      {/* Salida marker */}
      {isSalida && (
        <text
          x={0}
          y={6}
          textAnchor="middle"
          fontSize={10}
          fill={playerColor?.dark || "#654321"}
          fontWeight="bold"
          className={styles.cellIcon}
        >
          S
        </text>
      )}

      {/* Pawns on this cell */}
      {pawnsOnCell.map((pawn, i) => (
        <g
          key={`${pawn.playerId}-${pawn.pawnId}`}
          transform={`translate(${(i % 2) * 14 - 7}, ${Math.floor(i / 2) * 14 - 7})`}
          onClick={(e) => {
            e.stopPropagation();
            onPawnClick(pawn.playerId, pawn.pawnId);
          }}
        >
          <Pawn
            color={pawn.color}
            size={22}
            isSelected={pawn.isSelected}
            isMovable={pawn.isMovable}
          />
        </g>
      ))}
    </g>
  );
}

interface CornerZoneProps {
  playerIndex: number;
  pawns: PawnData[];
  playerId: string;
  isMyZone: boolean;
  selectedPawnId: number | null;
  onPawnClick: (pawnId: number) => void;
  canExit?: boolean;
}

function CornerZone({
  playerIndex,
  pawns,
  isMyZone,
  selectedPawnId,
  onPawnClick,
  canExit,
}: CornerZoneProps) {
  const color = PLAYER_COLORS[playerIndex as keyof typeof PLAYER_COLORS];
  
  // Corner positions (clockwise from bottom-right: red, blue, green, yellow)
  const cornerPositions = [
    { x: BOARD_SIZE - CORNER_SIZE / 2, y: BOARD_SIZE - CORNER_SIZE / 2 }, // Red - bottom right
    { x: BOARD_SIZE - CORNER_SIZE / 2, y: CORNER_SIZE / 2 }, // Blue - top right
    { x: CORNER_SIZE / 2, y: CORNER_SIZE / 2 }, // Green - top left
    { x: CORNER_SIZE / 2, y: BOARD_SIZE - CORNER_SIZE / 2 }, // Yellow - bottom left
  ];
  
  const pos = cornerPositions[playerIndex];
  const pawnsInPrison = pawns.filter((p) => p.inPrison);
  
  // Pawn positions within the corner (2x2 grid)
  const pawnSlots = [
    { x: -30, y: -30 },
    { x: 30, y: -30 },
    { x: -30, y: 30 },
    { x: 30, y: 30 },
  ];

  return (
    <g transform={`translate(${pos.x}, ${pos.y})`}>
      {/* Corner background - pixel art style */}
      <rect
        x={-CORNER_SIZE / 2 + 10}
        y={-CORNER_SIZE / 2 + 10}
        width={CORNER_SIZE - 20}
        height={CORNER_SIZE - 20}
        rx={0}
        fill={color.main}
        stroke={color.dark}
        strokeWidth={4}
        className={`${styles.cornerZone} ${canExit ? styles.cornerCanExit : ""}`}
      />
      
      {/* Inner decorative border */}
      <rect
        x={-CORNER_SIZE / 2 + 18}
        y={-CORNER_SIZE / 2 + 18}
        width={CORNER_SIZE - 36}
        height={CORNER_SIZE - 36}
        fill="none"
        stroke={color.light}
        strokeWidth={2}
      />

      {/* Corner label */}
      <text
        x={0}
        y={-CORNER_SIZE / 2 + 36}
        textAnchor="middle"
        fontSize={8}
        fill={color.dark}
        fontWeight="bold"
        className={styles.cornerLabel}
      >
        {canExit ? "¡SALIR!" : color.label}
      </text>

      {/* Pawn slots - show empty circles for available spots */}
      {pawnSlots.map((slot, i) => {
        const pawnHere = pawnsInPrison[i];
        return (
          <g key={i} transform={`translate(${slot.x}, ${slot.y})`}>
            {/* Slot background */}
            <circle
              cx={0}
              cy={0}
              r={24}
              fill={color.dark}
              stroke={color.light}
              strokeWidth={2}
              opacity={0.6}
            />
            
            {pawnHere && (
              <g
                onClick={() => isMyZone && onPawnClick(pawnHere.id)}
                className={isMyZone ? styles.prisonPawn : undefined}
              >
                <Pawn
                  color={color.name}
                  size={36}
                  isSelected={selectedPawnId === pawnHere.id}
                  isMovable={isMyZone || canExit}
                />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

interface LlegadaPathProps {
  playerIndex: number;
  pawns: PawnData[];
  selectedPawnId: number | null;
  isMyLlegada: boolean;
  onPawnClick: (pawnId: number) => void;
}

function LlegadaPath({
  playerIndex,
  pawns,
  selectedPawnId,
  isMyLlegada,
  onPawnClick,
}: LlegadaPathProps) {
  const color = PLAYER_COLORS[playerIndex as keyof typeof PLAYER_COLORS];
  const center = BOARD_SIZE / 2;

  // Direction vectors for each player's llegada path
  const directions = [
    { dx: -1, dy: 0 },  // Red: from right to center
    { dx: 0, dy: 1 },   // Blue: from top to center
    { dx: 1, dy: 0 },   // Green: from left to center
    { dx: 0, dy: -1 },  // Yellow: from bottom to center
  ];

  const dir = directions[playerIndex];
  const startOffset = 160;
  const cellSpacing = 22;
  const pawnsInLlegada = pawns.filter((p) => p.inLlegada);

  return (
    <g>
      {Array.from({ length: BOARD_CONFIG.LLEGADA_CELLS }).map((_, i) => {
        const x = center + dir.dx * (startOffset - i * cellSpacing);
        const y = center + dir.dy * (startOffset - i * cellSpacing);
        const isLast = i === BOARD_CONFIG.LLEGADA_CELLS - 1;
        const pawnHere = pawnsInLlegada.find((p) => p.llegadaPosition === i);

        return (
          <g key={i} transform={`translate(${x}, ${y})`}>
            {/* Llegada cell - pixel art style */}
            <rect
              x={-10}
              y={-10}
              width={20}
              height={20}
              fill={isLast ? color.main : color.light}
              stroke={color.dark}
              strokeWidth={isLast ? 3 : 2}
              className={`${styles.llegadaCell} ${isLast ? styles.llegadaCellFinal : ""}`}
            />
            
            {isLast && (
              <text 
                x={0} 
                y={4} 
                textAnchor="middle" 
                fontSize={10} 
                fill="#FFD700"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                ★
              </text>
            )}
            
            {pawnHere && (
              <g
                onClick={() => isMyLlegada && onPawnClick(pawnHere.id)}
                className={isMyLlegada ? styles.llegadaPawn : undefined}
              >
                <Pawn
                  color={color.name}
                  size={16}
                  isSelected={selectedPawnId === pawnHere.id}
                  isMovable={isMyLlegada}
                />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

// Center "Cielo" component
function CieloCenter() {
  const center = BOARD_SIZE / 2;
  
  return (
    <g transform={`translate(${center}, ${center})`}>
      {/* Outer decorative ring */}
      <circle
        cx={0}
        cy={0}
        r={50}
        fill="#2C1810"
        stroke="#8B4513"
        strokeWidth={4}
      />
      
      {/* Inner circle */}
      <circle
        cx={0}
        cy={0}
        r={40}
        fill="#1A0F0A"
        stroke="#654321"
        strokeWidth={2}
      />
      
      {/* Star decoration */}
      <text
        x={0}
        y={-10}
        textAnchor="middle"
        fontSize={16}
        fill="#FFD700"
        style={{ fontFamily: "'Press Start 2P', monospace" }}
      >
        ★
      </text>
      
      {/* Label */}
      <text
        x={0}
        y={12}
        textAnchor="middle"
        fontSize={8}
        fill="#DEB887"
        fontWeight="bold"
        style={{ fontFamily: "'Press Start 2P', monospace", letterSpacing: "1px" }}
      >
        CIELO
      </text>
    </g>
  );
}

// Decorative corner images (Colombian themed)
function CornerDecoration({ playerIndex }: { playerIndex: number }) {
  const decorations = [
    { emoji: "🐆", name: "Jaguar" },
    { emoji: "🐬", name: "Delfín" },
    { emoji: "🐸", name: "Rana" },
    { emoji: "🦜", name: "Loro" },
  ];
  
  const color = PLAYER_COLORS[playerIndex as keyof typeof PLAYER_COLORS];
  const decoration = decorations[playerIndex];
  
  const positions = [
    { x: BOARD_SIZE - 40, y: BOARD_SIZE - 40 },
    { x: BOARD_SIZE - 40, y: 40 },
    { x: 40, y: 40 },
    { x: 40, y: BOARD_SIZE - 40 },
  ];
  
  const pos = positions[playerIndex];
  
  return (
    <g transform={`translate(${pos.x}, ${pos.y})`}>
      <text
        x={0}
        y={5}
        textAnchor="middle"
        fontSize={20}
        fill={color.main}
      >
        {decoration.emoji}
      </text>
    </g>
  );
}

export function Board({
  selectedPawnId,
  onPawnSelect,
  highlightedCells,
  onCellClick,
}: BoardProps) {
  const gameState = useGameStore((state) => state.gameState);
  const players = useGameStore((state) => state.players);
  const myPlayer = useGameStore((state) => state.player);

  const cellPositions = useMemo(() => generateCellPositions(), []);

  const gameData = gameState?.gameData as
    | {
        pawns?: Record<string, PawnData[]>;
        parquesPhase?: string;
      }
    | undefined;

  const isMyTurn = gameState?.currentPlayerId === myPlayer?.id;
  const parquesPhase = gameData?.parquesPhase || "waiting_roll";
  const canSelectPawn = isMyTurn && parquesPhase === "waiting_move";
  const canExitPrison = isMyTurn && parquesPhase === "waiting_exit";

  const pawnsOnCells = useMemo(() => {
    const cells: Record<
      number,
      Array<{
        playerId: string;
        pawnId: number;
        color: string;
        isSelected: boolean;
        isMovable: boolean;
      }>
    > = {};

    if (!gameData?.pawns) return cells;

    Object.entries(gameData.pawns).forEach(([playerId, pawns]) => {
      const playerIndex = players.findIndex((p) => p.id === playerId);
      const color =
        PLAYER_COLORS[playerIndex as keyof typeof PLAYER_COLORS]?.name ||
        "blue";
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
      <svg
        viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
        className={styles.svg}
      >
        {/* Definitions for filters and patterns */}
        <defs>
          {/* Pixel art shadow filter */}
          <filter id="pixelShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feOffset result="offOut" in="SourceAlpha" dx="2" dy="2" />
            <feFlood floodColor="#000000" floodOpacity="0.4" result="colorOut"/>
            <feComposite in="colorOut" in2="offOut" operator="in" result="compOut"/>
            <feMerge>
              <feMergeNode in="compOut"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Wood texture pattern */}
          <pattern id="woodPattern" patternUnits="userSpaceOnUse" width="20" height="20">
            <rect width="20" height="20" fill="#8B4513"/>
            <line x1="0" y1="5" x2="20" y2="5" stroke="#654321" strokeWidth="1" opacity="0.3"/>
            <line x1="0" y1="15" x2="20" y2="15" stroke="#654321" strokeWidth="1" opacity="0.3"/>
          </pattern>
        </defs>

        {/* Board background - wood frame */}
        <rect
          x={0}
          y={0}
          width={BOARD_SIZE}
          height={BOARD_SIZE}
          rx={8}
          fill="#5D3A1A"
          stroke="#3D2512"
          strokeWidth={8}
        />
        
        {/* Inner wood frame */}
        <rect
          x={12}
          y={12}
          width={BOARD_SIZE - 24}
          height={BOARD_SIZE - 24}
          rx={4}
          fill="#8B5A2B"
          stroke="#654321"
          strokeWidth={4}
        />

        {/* Cross-shaped playing area background */}
        {/* Horizontal bar */}
        <rect
          x={CORNER_SIZE}
          y={BOARD_SIZE / 2 - PATH_WIDTH / 2}
          width={BOARD_SIZE - 2 * CORNER_SIZE}
          height={PATH_WIDTH}
          fill="#DEB887"
          stroke="#8B4513"
          strokeWidth={2}
        />
        
        {/* Vertical bar */}
        <rect
          x={BOARD_SIZE / 2 - PATH_WIDTH / 2}
          y={CORNER_SIZE}
          width={PATH_WIDTH}
          height={BOARD_SIZE - 2 * CORNER_SIZE}
          fill="#DEB887"
          stroke="#8B4513"
          strokeWidth={2}
        />

        {/* Center area (Cielo) */}
        <CieloCenter />

        {/* Corner zones (prisons/starting areas) */}
        {players.slice(0, 4).map((player, index) => {
          const pawns = gameData?.pawns?.[player.id] || [];
          const isMyZone = player.id === myPlayer?.id;
          return (
            <CornerZone
              key={player.id}
              playerIndex={index}
              pawns={pawns as PawnData[]}
              playerId={player.id}
              isMyZone={isMyZone && (canSelectPawn || canExitPrison)}
              selectedPawnId={isMyZone ? selectedPawnId : null}
              onPawnClick={(pawnId) => handlePawnClick(player.id, pawnId)}
              canExit={isMyZone && canExitPrison}
            />
          );
        })}

        {/* Llegada paths (arrival paths to center) */}
        {players.slice(0, 4).map((player, index) => {
          const pawns = gameData?.pawns?.[player.id] || [];
          return (
            <LlegadaPath
              key={player.id}
              playerIndex={index}
              pawns={pawns as PawnData[]}
              selectedPawnId={player.id === myPlayer?.id ? selectedPawnId : null}
              isMyLlegada={player.id === myPlayer?.id && canSelectPawn}
              onPawnClick={(pawnId) => handlePawnClick(player.id, pawnId)}
            />
          );
        })}

        {/* Path cells */}
        {cellPositions.map((pos, index) => {
          const isSeguro = BOARD_CONFIG.SEGUROS.includes(index);
          const salidaIndex = BOARD_CONFIG.SALIDAS.indexOf(index);
          const isSalida = salidaIndex !== -1;
          const isHighlighted = highlightedCells.includes(index);

          return (
            <BoardCell
              key={index}
              index={index}
              position={pos}
              isSeguro={isSeguro}
              isSalida={isSalida}
              playerSalida={isSalida ? salidaIndex : undefined}
              pawnsOnCell={pawnsOnCells[index] || []}
              isHighlighted={isHighlighted}
              onCellClick={onCellClick}
              onPawnClick={handlePawnClick}
            />
          );
        })}

        {/* Corner decorations */}
        {[0, 1, 2, 3].map((index) => (
          <CornerDecoration key={index} playerIndex={index} />
        ))}

        {/* Legend - pixel art style */}
        <g transform={`translate(${BOARD_SIZE / 2}, ${BOARD_SIZE - 24})`}>
          <text
            x={0}
            y={0}
            textAnchor="middle"
            fontSize={8}
            fill="#DEB887"
            className={styles.legend}
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            ★ SEGURO • S SALIDA
          </text>
        </g>
      </svg>
    </div>
  );
}
