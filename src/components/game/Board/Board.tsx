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

// Player colors
const PLAYER_COLORS = {
  0: { main: "#e53935", light: "#ff6f60", dark: "#ab000d", name: "red" },
  1: { main: "#1e88e5", light: "#6ab7ff", dark: "#005cb2", name: "blue" },
  2: { main: "#43a047", light: "#76d275", dark: "#00701a", name: "green" },
  3: { main: "#fdd835", light: "#ffff6b", dark: "#c6a700", name: "yellow" },
} as const;

interface CellPosition {
  x: number;
  y: number;
  rotation: number;
}

function generateCellPositions(): CellPosition[] {
  const positions: CellPosition[] = [];
  const size = 600;
  const cellSize = 28;
  const margin = 80;

  for (let i = 0; i <= 16; i++) {
    positions.push({
      x: size - margin,
      y: size / 2 + (8 - i) * cellSize,
      rotation: 0,
    });
  }
  for (let i = 0; i <= 16; i++) {
    positions.push({
      x: size / 2 + (8 - i) * cellSize,
      y: margin,
      rotation: 90,
    });
  }
  for (let i = 0; i <= 16; i++) {
    positions.push({
      x: margin,
      y: size / 2 - (8 - i) * cellSize,
      rotation: 180,
    });
  }
  for (let i = 0; i <= 16; i++) {
    positions.push({
      x: size / 2 - (8 - i) * cellSize,
      y: size - margin,
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

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      onClick={() => onCellClick(index)}
      className={styles.cellGroup}
    >
      <rect
        x={-12}
        y={-12}
        width={24}
        height={24}
        rx={3}
        fill={
          isHighlighted
            ? "#4ade80"
            : playerColor
            ? playerColor.light
            : isSeguro
            ? "#4a5568"
            : "#2d3748"
        }
        stroke={
          isHighlighted
            ? "#22c55e"
            : playerColor
            ? playerColor.main
            : isSeguro
            ? "#68d391"
            : "#4a5568"
        }
        strokeWidth={isHighlighted ? 3 : isSeguro || isSalida ? 2 : 1}
        className={`${styles.cell} ${isHighlighted ? styles.cellHighlighted : ""}`}
      />

      {isSeguro && !isSalida && (
        <text x={0} y={4} textAnchor="middle" fontSize={12} fill="#68d391">
          ★
        </text>
      )}

      {isSalida && (
        <text
          x={0}
          y={5}
          textAnchor="middle"
          fontSize={14}
          fill={playerColor?.dark || "#fff"}
        >
          ⌂
        </text>
      )}

      {pawnsOnCell.map((pawn, i) => (
        <g
          key={`${pawn.playerId}-${pawn.pawnId}`}
          transform={`translate(${(i % 2) * 10 - 5}, ${
            Math.floor(i / 2) * 10 - 5
          })`}
          onClick={(e) => {
            e.stopPropagation();
            onPawnClick(pawn.playerId, pawn.pawnId);
          }}
        >
          <Pawn
            color={pawn.color}
            size={10}
            isSelected={pawn.isSelected}
            isMovable={pawn.isMovable}
          />
        </g>
      ))}
    </g>
  );
}

interface PrisonProps {
  playerIndex: number;
  pawns: PawnData[];
  playerId: string;
  isMyPrison: boolean;
  selectedPawnId: number | null;
  onPawnClick: (pawnId: number) => void;
  canExit?: boolean;
}

function Prison({
  playerIndex,
  pawns,
  isMyPrison,
  selectedPawnId,
  onPawnClick,
  canExit,
}: PrisonProps) {
  const color = PLAYER_COLORS[playerIndex as keyof typeof PLAYER_COLORS];
  const positions = [
    { x: 480, y: 480 },
    { x: 480, y: 120 },
    { x: 120, y: 120 },
    { x: 120, y: 480 },
  ];
  const pos = positions[playerIndex];
  const pawnsInPrison = pawns.filter((p) => p.inPrison);

  return (
    <g transform={`translate(${pos.x}, ${pos.y})`}>
      <rect
        x={-50}
        y={-50}
        width={100}
        height={100}
        rx={12}
        fill={color.dark}
        stroke={canExit ? "#4ade80" : color.main}
        strokeWidth={canExit ? 4 : 3}
        className={`${styles.prisonRect} ${canExit ? styles.prisonCanExit : ""}`}
      />

      <text
        x={0}
        y={-30}
        textAnchor="middle"
        fontSize={10}
        fill={canExit ? "#4ade80" : color.light}
        className={styles.prisonText}
      >
        {canExit ? "¡SALIR!" : "CÁRCEL"}
      </text>

      {pawnsInPrison.map((pawn, i) => (
        <g
          key={pawn.id}
          transform={`translate(${(i % 2) * 30 - 15}, ${
            Math.floor(i / 2) * 30 - 5
          })`}
          onClick={() => isMyPrison && onPawnClick(pawn.id)}
          className={isMyPrison ? styles.prisonPawn : undefined}
        >
          <Pawn
            color={color.name}
            size={20}
            isSelected={selectedPawnId === pawn.id}
            isMovable={isMyPrison || canExit}
          />
        </g>
      ))}
    </g>
  );
}

interface LlegadaProps {
  playerIndex: number;
  pawns: PawnData[];
  selectedPawnId: number | null;
  isMyLlegada: boolean;
  onPawnClick: (pawnId: number) => void;
}

function Llegada({
  playerIndex,
  pawns,
  selectedPawnId,
  isMyLlegada,
  onPawnClick,
}: LlegadaProps) {
  const color = PLAYER_COLORS[playerIndex as keyof typeof PLAYER_COLORS];
  const centerX = 300;
  const centerY = 300;

  const directions = [
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
  ];

  const dir = directions[playerIndex];
  const startOffset = 200;
  const cellSpacing = 24;
  const pawnsInLlegada = pawns.filter((p) => p.inLlegada);

  return (
    <g>
      {Array.from({ length: BOARD_CONFIG.LLEGADA_CELLS }).map((_, i) => {
        const x = centerX + dir.dx * (startOffset - i * cellSpacing);
        const y = centerY + dir.dy * (startOffset - i * cellSpacing);
        const isLast = i === BOARD_CONFIG.LLEGADA_CELLS - 1;
        const pawnHere = pawnsInLlegada.find((p) => p.llegadaPosition === i);

        return (
          <g key={i} transform={`translate(${x}, ${y})`}>
            <rect
              x={-10}
              y={-10}
              width={20}
              height={20}
              rx={isLast ? 10 : 3}
              fill={isLast ? color.main : color.light}
              stroke={color.main}
              strokeWidth={isLast ? 3 : 1}
              opacity={isLast ? 1 : 0.7}
              className={`${styles.llegadaCell} ${
                isLast ? styles.llegadaCellFinal : ""
              }`}
            />
            {isLast && (
              <text x={0} y={4} textAnchor="middle" fontSize={10} fill="#fff">
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
                  size={14}
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
        viewBox="0 0 600 600"
        className={styles.svg}
        style={{
          background: "linear-gradient(135deg, #1a202c 0%, #2d3748 100%)",
        }}
      >
        {/* Board center (Cielo) */}
        <rect
          x={250}
          y={250}
          width={100}
          height={100}
          rx={12}
          fill="#4a5568"
          stroke="#718096"
          strokeWidth={2}
        />
        <text
          x={300}
          y={305}
          textAnchor="middle"
          fontSize={14}
          fill="#a0aec0"
          fontWeight="bold"
        >
          CIELO
        </text>

        {/* Prisons */}
        {players.slice(0, 4).map((player, index) => {
          const pawns = gameData?.pawns?.[player.id] || [];
          const isMyPrison = player.id === myPlayer?.id;
          return (
            <Prison
              key={player.id}
              playerIndex={index}
              pawns={pawns as PawnData[]}
              playerId={player.id}
              isMyPrison={isMyPrison && (canSelectPawn || canExitPrison)}
              selectedPawnId={isMyPrison ? selectedPawnId : null}
              onPawnClick={(pawnId) => handlePawnClick(player.id, pawnId)}
              canExit={isMyPrison && canExitPrison}
            />
          );
        })}

        {/* Llegada paths */}
        {players.slice(0, 4).map((player, index) => {
          const pawns = gameData?.pawns?.[player.id] || [];
          return (
            <Llegada
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

        {/* Legend */}
        <g transform="translate(10, 570)">
          <text fontSize={10} fill="#a0aec0" className={styles.legend}>
            ★ Seguro | ⌂ Salida
          </text>
        </g>
      </svg>
    </div>
  );
}
