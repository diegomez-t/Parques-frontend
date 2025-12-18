"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useGameStore } from "@/store/gameStore";
import { useGameActions } from "@/hooks/useSocket";
import { DicePair } from "../Dice/Dice";
import styles from "./GameControls.module.css";

interface PawnData {
  id: number;
  position: number;
  inPrison: boolean;
  inLlegada: boolean;
  llegadaPosition: number;
  inCielo: boolean;
}

interface ValidMove {
  pawnId: number;
  targetPosition: number;
  diceUsed: "dice1" | "dice2" | "sum";
  steps: number;
}

interface GameControlsProps {
  selectedPawnId: number | null;
  onPawnSelect: (pawnId: number | null) => void;
  onHighlightCells: (cells: number[]) => void;
}

export function GameControls({
  selectedPawnId,
  onPawnSelect,
  onHighlightCells,
}: GameControlsProps) {
  const t = useTranslations("game");
  const { sendAction } = useGameActions();

  const gameState = useGameStore((state) => state.gameState);
  const player = useGameStore((state) => state.player);
  const players = useGameStore((state) => state.players);

  const [isRolling, setIsRolling] = useState(false);

  const isMyTurn = gameState?.currentPlayerId === player?.id;
  const currentPlayer = players.find(
    (p) => p.id === gameState?.currentPlayerId
  );

  // Game data from server
  const gameData = gameState?.gameData as
    | {
        dice?: {
          values: [number, number];
          hasRolled: boolean;
          usedDice: number[];
        };
        remainingDice?: number[];
        consecutiveDoubles?: number;
        parquesPhase?: string;
        validMoves?: ValidMove[];
        mustEat?: boolean;
        pawns?: Record<string, PawnData[]>;
      }
    | undefined;

  const diceValues: [number, number] = gameData?.dice?.values || [1, 1];
  const hasRolled = gameData?.dice?.hasRolled || false;
  const usedDice = gameData?.dice?.usedDice || [];
  const remainingDice = gameData?.remainingDice || [];
  const parquesPhase = gameData?.parquesPhase || "waiting_roll";
  const consecutiveDoubles = gameData?.consecutiveDoubles || 0;
  const validMoves = gameData?.validMoves || [];

  const canPass = parquesPhase === "waiting_move" && !gameData?.mustEat;
  const canRoll = parquesPhase === "waiting_roll";
  const canExitPrison = parquesPhase === "waiting_exit";
  const canMove = parquesPhase === "waiting_move";

  const sum = diceValues[0] + diceValues[1];
  const isDouble = diceValues[0] === diceValues[1];

  // My pawns
  const myPawns = player?.id ? gameData?.pawns?.[player.id] || [] : [];
  const allInPrison = myPawns.every((p) => p.inPrison);
  const pawnsOnBoard = myPawns.filter((p) => !p.inPrison && !p.inCielo);

  // Calculate possible moves for selected pawn
  const movesForSelectedPawn = useMemo(() => {
    if (selectedPawnId === null || !canMove) return [];
    return validMoves.filter((m) => m.pawnId === selectedPawnId);
  }, [selectedPawnId, validMoves, canMove]);

  // Group moves by option
  const moveOptions = useMemo(() => {
    if (selectedPawnId === null || movesForSelectedPawn.length === 0) return [];

    const options: Array<{
      label: string;
      steps: number;
      targetPosition: number;
      diceUsed: string;
      posLabel: string;
    }> = [];

    for (const move of movesForSelectedPawn) {
      // Create dice label
      let diceLabel: string;
      if (move.diceUsed === "sum") {
        diceLabel = `🎲 Suma: ${diceValues[0]} + ${diceValues[1]} = ${sum}`;
      } else if (move.diceUsed === "dice1") {
        diceLabel = `🎲 Dado 1: ${diceValues[0]}`;
      } else {
        diceLabel = `🎲 Dado 2: ${diceValues[1]}`;
      }

      // Format target position
      let posLabel: string;
      if (move.targetPosition >= 100) {
        if (move.targetPosition >= 107) {
          posLabel = "→ ¡CIELO!";
        } else {
          posLabel = `→ Llegada ${move.targetPosition - 100 + 1}`;
        }
      } else {
        posLabel = `→ casilla ${move.targetPosition}`;
      }

      options.push({
        label: diceLabel,
        steps: move.steps,
        targetPosition: move.targetPosition,
        diceUsed: move.diceUsed,
        posLabel,
      });
    }

    // Sort: sum first, then by steps descending
    options.sort((a, b) => {
      if (a.diceUsed === "sum" && b.diceUsed !== "sum") return -1;
      if (a.diceUsed !== "sum" && b.diceUsed === "sum") return 1;
      return b.steps - a.steps;
    });

    return options;
  }, [selectedPawnId, movesForSelectedPawn, diceValues, sum]);

  // Update highlighted cells when pawn is selected
  useEffect(() => {
    if (selectedPawnId !== null && canMove) {
      const cells = movesForSelectedPawn
        .filter((m) => m.targetPosition < 100)
        .map((m) => m.targetPosition);
      onHighlightCells(cells);
    } else {
      onHighlightCells([]);
    }
  }, [selectedPawnId, movesForSelectedPawn, canMove, onHighlightCells]);

  const handleRollDice = async () => {
    if (!isMyTurn || isRolling) return;

    setIsRolling(true);
    onPawnSelect(null);

    try {
      await sendAction("roll_dice", {});
    } catch (error) {
      console.error("Erreur lancer de dés:", error);
    } finally {
      setTimeout(() => setIsRolling(false), 800);
    }
  };

  const handleExitPrison = async () => {
    if (!isMyTurn) return;

    try {
      await sendAction("exit_prison", {});
    } catch (error) {
      console.error("Erreur sortie de prison:", error);
    }
  };

  const handleMove = async (targetPosition: number, diceUsed: string) => {
    if (!isMyTurn || selectedPawnId === null) return;

    try {
      await sendAction("move_pawn", {
        pawnId: selectedPawnId,
        targetPosition,
        diceUsed,
      });
      onPawnSelect(null);
    } catch (error) {
      console.error("Erreur déplacement:", error);
    }
  };

  const handlePass = async () => {
    if (!isMyTurn || !canPass) return;

    try {
      await sendAction("pass", {});
      onPawnSelect(null);
    } catch (error) {
      console.error("Erreur passer:", error);
    }
  };

  return (
    <div className={styles.container}>
      {/* Turn indicator */}
      <div
        className={
          isMyTurn ? styles.turnIndicatorMyTurn : styles.turnIndicatorWaiting
        }
      >
        {isMyTurn ? (
          <span className={styles.turnContent}>
            <span className={styles.turnIcon}>🎲</span>
            {t("yourTurn")}
          </span>
        ) : (
          <span>
            {t("waitingTurn")}{" "}
            {currentPlayer?.name && `(${currentPlayer.name})`}
          </span>
        )}
      </div>

      {/* Dice */}
      <div className={styles.diceSection}>
        <div className={styles.diceWrapper}>
          <DicePair values={diceValues} isRolling={isRolling} size={50} />

          {/* Used dice indicators */}
          {hasRolled && usedDice.length > 0 && !isDouble && (
            <div className={styles.diceUsedIndicators}>
              {usedDice.includes(0) && (
                <span className={styles.diceUsedBadge}>✓</span>
              )}
              {usedDice.includes(1) && (
                <span className={styles.diceUsedBadgeSecond}>✓</span>
              )}
            </div>
          )}
        </div>

        {hasRolled && (
          <div className={styles.diceResult}>
            <p className={styles.diceSum}>
              {diceValues[0]} + {diceValues[1]} ={" "}
              <span className={styles.diceSumValue}>{sum}</span>
            </p>
            {isDouble && (
              <p className={styles.diceDoubleMessage}>
                ¡Doble! Tienes otro turno.
              </p>
            )}

            {/* Remaining dice indicator */}
            {usedDice.length > 0 && usedDice.length < 2 && !isDouble && (
              <div className={styles.remainingDiceBox}>
                <p className={styles.remainingDiceText}>
                  🎲 Dado restante:{" "}
                  <span className={styles.remainingDiceValue}>
                    {remainingDice.join(", ")}
                  </span>
                </p>
                <p className={styles.remainingDiceHint}>
                  Selecciona otra ficha para usar este dado
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pawn selection */}
      {canMove && isMyTurn && (
        <div className={styles.pawnSelection}>
          <p className={styles.pawnSelectionLabel}>
            {selectedPawnId !== null
              ? `Ficha ${selectedPawnId + 1} seleccionada`
              : "Selecciona una ficha para mover"}
          </p>

          {/* Quick pawn selection buttons */}
          <div className={styles.pawnButtons}>
            {pawnsOnBoard.map((pawn) => {
              const hasValidMoves = validMoves.some((m) => m.pawnId === pawn.id);
              const isSelected = selectedPawnId === pawn.id;

              let buttonClass = styles.pawnButtonDefault;
              if (isSelected) {
                buttonClass = styles.pawnButtonSelected;
              } else if (!hasValidMoves) {
                buttonClass = styles.pawnButtonDisabled;
              }

              return (
                <button
                  key={pawn.id}
                  onClick={() =>
                    onPawnSelect(isSelected ? null : pawn.id)
                  }
                  disabled={!hasValidMoves}
                  className={buttonClass}
                >
                  Ficha {pawn.id + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Move options */}
      {selectedPawnId !== null && moveOptions.length > 0 && (
        <div className={styles.moveOptions}>
          <p className={styles.moveOptionsLabel}>Elige cómo mover:</p>
          <div className={styles.moveOptionsList}>
            {moveOptions.map((option, i) => (
              <button
                key={i}
                onClick={() => handleMove(option.targetPosition, option.diceUsed)}
                className={
                  option.diceUsed === "sum"
                    ? styles.moveOptionSum
                    : styles.moveOptionDice
                }
              >
                <span className={styles.moveOptionLabel}>{option.label}</span>
                <span className={styles.moveOptionPosition}>
                  {option.posLabel}
                </span>
              </button>
            ))}
          </div>

          {moveOptions.length > 1 && (
            <p className={styles.moveOptionsHint}>
              💡 Si no usas la suma, podrás mover otra ficha con el dado
              restante
            </p>
          )}
        </div>
      )}

      {/* Main actions */}
      <div className={styles.actions}>
        {canRoll && (
          <button
            onClick={handleRollDice}
            disabled={!isMyTurn || isRolling}
            className={styles.btnPrimary}
          >
            {isRolling ? "🎲 Lanzando..." : `🎲 ${t("rollDice")}`}
          </button>
        )}

        {canExitPrison && (
          <button
            onClick={handleExitPrison}
            disabled={!isMyTurn}
            className={styles.btnPrimary}
          >
            🚪 Salir de la Cárcel
          </button>
        )}

        {canPass && (
          <button
            onClick={handlePass}
            disabled={!isMyTurn}
            className={styles.btnSecondary}
          >
            {usedDice.length > 0 ? `${t("pass")} (terminar turno)` : t("pass")}
          </button>
        )}
      </div>

      {/* Help messages */}
      {isMyTurn && (
        <div className={styles.helpMessages}>
          {allInPrison && !isDouble && hasRolled && (
            <p className={styles.helpWarning}>
              ⚠️ Necesitas un doble para salir. ¡Lanza de nuevo!
            </p>
          )}
          {allInPrison && isDouble && (
            <p className={styles.helpSuccess}>
              ✅ ¡Doble! Puedes salir de la cárcel.
            </p>
          )}
          {canMove && selectedPawnId === null && pawnsOnBoard.length > 0 && (
            <p className={styles.helpInfo}>
              👆 Haz clic en una ficha o usa los botones para seleccionar.
            </p>
          )}
        </div>
      )}

      {/* Consecutive doubles */}
      {consecutiveDoubles > 0 && (
        <div className={styles.doublesCounter}>
          <span className={styles.doublesText}>
            Dobles consecutivos: {consecutiveDoubles}/3
          </span>
          {consecutiveDoubles === 2 && (
            <p className={styles.doublesWarning}>
              ⚠️ ¡Un doble más y tu ficha va al Cielo!
            </p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className={styles.stats}>
        <p className={styles.statLine}>Turno: {gameState?.turnNumber || 0}</p>
        <p className={styles.statLine}>Fase: {parquesPhase}</p>
        {usedDice.length > 0 && (
          <p className={styles.statLine}>
            Dados usados: {usedDice.map((d) => d + 1).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
