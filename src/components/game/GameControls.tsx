"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useGameStore } from "@/store/gameStore";
import { useGameActions } from "@/hooks/useSocket";
import { DicePair } from "./Dice";
import { cn } from "@/lib/utils";

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
}

interface GameControlsProps {
  selectedPawnId: number | null;
  onPawnSelect: (pawnId: number | null) => void;
  onHighlightCells: (cells: number[]) => void;
}

export function GameControls({ selectedPawnId, onPawnSelect, onHighlightCells }: GameControlsProps) {
  const t = useTranslations("game");
  const { sendAction } = useGameActions();
  
  const gameState = useGameStore((state) => state.gameState);
  const player = useGameStore((state) => state.player);
  const players = useGameStore((state) => state.players);
  
  const [isRolling, setIsRolling] = useState(false);
  
  const isMyTurn = gameState?.currentPlayerId === player?.id;
  const currentPlayer = players.find(p => p.id === gameState?.currentPlayerId);
  
  // Données du jeu depuis le serveur
  const gameData = gameState?.gameData as {
    dice?: { values: [number, number]; hasRolled: boolean };
    consecutiveDoubles?: number;
    parquesPhase?: string;
    validMoves?: ValidMove[];
    mustEat?: boolean;
    pawns?: Record<string, PawnData[]>;
  } | undefined;

  const diceValues: [number, number] = gameData?.dice?.values || [1, 1];
  const hasRolled = gameData?.dice?.hasRolled || false;
  const parquesPhase = gameData?.parquesPhase || "waiting_roll";
  const consecutiveDoubles = gameData?.consecutiveDoubles || 0;
  const validMoves = gameData?.validMoves || [];
  
  const canPass = parquesPhase === "waiting_move" && !gameData?.mustEat;
  const canRoll = parquesPhase === "waiting_roll";
  const canExitPrison = parquesPhase === "waiting_exit";
  const canMove = parquesPhase === "waiting_move";
  
  const sum = diceValues[0] + diceValues[1];
  const isDouble = diceValues[0] === diceValues[1];

  // Mes pions
  const myPawns = player?.id ? (gameData?.pawns?.[player.id] || []) : [];
  const allInPrison = myPawns.every(p => p.inPrison);
  const pawnsOnBoard = myPawns.filter(p => !p.inPrison && !p.inCielo);

  // Calculer les mouvements possibles pour le pion sélectionné
  const movesForSelectedPawn = useMemo(() => {
    if (!selectedPawnId || !canMove) return [];
    return validMoves.filter(m => m.pawnId === selectedPawnId);
  }, [selectedPawnId, validMoves, canMove]);

  // Grouper les mouvements par valeur de dé
  const moveOptions = useMemo(() => {
    if (!selectedPawnId || movesForSelectedPawn.length === 0) return [];
    
    const [dice1, dice2] = diceValues;
    const options: Array<{ label: string; value: number; targetPosition: number; diceUsed: string }> = [];
    
    // Trouver le pion sélectionné
    const pawn = myPawns.find(p => p.id === selectedPawnId);
    if (!pawn) return [];
    
    // Calculer la position de départ
    const startPos = pawn.inLlegada ? 100 + pawn.llegadaPosition : pawn.position;
    
    // Dédupliquer les mouvements par targetPosition
    const uniquePositions = new Set<number>();
    
    for (const move of movesForSelectedPawn) {
      if (uniquePositions.has(move.targetPosition)) continue;
      uniquePositions.add(move.targetPosition);
      
      // Calculer combien de pas ce mouvement représente
      let steps: number;
      if (pawn.inLlegada) {
        steps = move.targetPosition - startPos;
      } else if (move.targetPosition >= 100) {
        // Vers llegada - c'est plus complexe, on montre juste la position
        steps = move.targetPosition - 100;
      } else {
        steps = (move.targetPosition - pawn.position + 68) % 68;
      }
      
      // Identifier quel dé correspond
      let diceLabel: string;
      if (steps === dice1 && steps === dice2) {
        diceLabel = `🎲 ${dice1} (doble)`;
      } else if (steps === dice1) {
        diceLabel = `🎲 Dado 1: ${dice1}`;
      } else if (steps === dice2) {
        diceLabel = `🎲 Dado 2: ${dice2}`;
      } else if (steps === dice1 + dice2) {
        diceLabel = `🎲 Suma: ${dice1} + ${dice2} = ${sum}`;
      } else {
        diceLabel = `🎲 ${steps} pasos`;
      }
      
      // Formater la position cible
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
        value: steps,
        targetPosition: move.targetPosition,
        diceUsed: posLabel
      });
    }
    
    // Trier: doubles/somme en premier, puis par nombre de pas
    options.sort((a, b) => b.value - a.value);
    
    return options;
  }, [selectedPawnId, movesForSelectedPawn, diceValues, sum, myPawns]);

  // Mettre à jour les cellules surlignées quand un pion est sélectionné
  useMemo(() => {
    if (selectedPawnId && canMove) {
      const cells = movesForSelectedPawn
        .filter(m => m.targetPosition < 100) // Seulement les positions sur le plateau
        .map(m => m.targetPosition);
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

  const handleMove = async (targetPosition: number) => {
    if (!isMyTurn || selectedPawnId === null) return;
    
    try {
      await sendAction("move_pawn", { 
        pawnId: selectedPawnId, 
        targetPosition 
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
    <div className="card space-y-4">
      {/* Indicateur de tour */}
      <div className={cn(
        "p-3 rounded-lg text-center font-semibold",
        isMyTurn 
          ? "bg-green-500/20 border border-green-500/50 text-green-400" 
          : "bg-slate-700/50 text-slate-400"
      )}>
        {isMyTurn ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-pulse">🎲</span>
            {t("yourTurn")}
          </span>
        ) : (
          <span>
            {t("waitingTurn")} {currentPlayer?.name && `(${currentPlayer.name})`}
          </span>
        )}
      </div>

      {/* Dés */}
      <div className="flex flex-col items-center gap-4">
        <DicePair values={diceValues} isRolling={isRolling} size={50} />
        
        {hasRolled && (
          <div className="text-center">
            <p className="text-xl font-bold text-white">
              {diceValues[0]} + {diceValues[1]} = <span className="text-blue-400">{sum}</span>
            </p>
            {isDouble && (
              <p className="text-yellow-400 text-sm mt-1">¡Doble! Tienes otro turno.</p>
            )}
          </div>
        )}
      </div>

      {/* Sélection de pion */}
      {canMove && isMyTurn && (
        <div className="p-3 bg-slate-700/50 rounded-lg">
          <p className="text-sm text-slate-300 mb-2">
            {selectedPawnId !== null 
              ? `Ficha ${selectedPawnId + 1} seleccionada` 
              : "Selecciona una ficha para mover"}
          </p>
          
          {/* Boutons de sélection rapide des pions */}
          <div className="flex gap-2 flex-wrap">
            {pawnsOnBoard.map((pawn) => {
              const hasValidMoves = validMoves.some(m => m.pawnId === pawn.id);
              return (
                <button
                  key={pawn.id}
                  onClick={() => onPawnSelect(selectedPawnId === pawn.id ? null : pawn.id)}
                  disabled={!hasValidMoves}
                  className={cn(
                    "px-3 py-1 rounded text-sm font-medium transition-all",
                    selectedPawnId === pawn.id
                      ? "bg-blue-500 text-white"
                      : hasValidMoves
                        ? "bg-slate-600 text-white hover:bg-slate-500"
                        : "bg-slate-700 text-slate-500 cursor-not-allowed"
                  )}
                >
                  Ficha {pawn.id + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Options de mouvement */}
      {selectedPawnId !== null && moveOptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-400 font-medium">Elige cómo mover:</p>
          <div className="space-y-1">
            {moveOptions.map((option, i) => (
              <button
                key={i}
                onClick={() => handleMove(option.targetPosition)}
                className={cn(
                  "w-full p-3 rounded-lg text-left transition-all",
                  "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400",
                  "text-white font-medium shadow-lg hover:shadow-xl",
                  "flex items-center justify-between gap-2"
                )}
              >
                <span className="flex-1">{option.label}</span>
                <span className="text-sm bg-blue-700/50 px-2 py-1 rounded">
                  {option.diceUsed}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions principales */}
      <div className="space-y-2">
        {canRoll && (
          <button
            onClick={handleRollDice}
            disabled={!isMyTurn || isRolling}
            className="btn btn-primary w-full"
          >
            {isRolling ? "🎲 Lanzando..." : `🎲 ${t("rollDice")}`}
          </button>
        )}
        
        {canExitPrison && (
          <button
            onClick={handleExitPrison}
            disabled={!isMyTurn}
            className="btn btn-primary w-full"
          >
            🚪 Salir de la Cárcel
          </button>
        )}
        
        {canPass && (
          <button
            onClick={handlePass}
            disabled={!isMyTurn}
            className="btn btn-secondary w-full"
          >
            {t("pass")}
          </button>
        )}
      </div>

      {/* Messages d'aide */}
      {isMyTurn && (
        <div className="text-center text-xs text-slate-400">
          {allInPrison && !isDouble && hasRolled && (
            <p className="text-orange-400">
              ⚠️ Necesitas un doble para salir. ¡Lanza de nuevo!
            </p>
          )}
          {allInPrison && isDouble && (
            <p className="text-green-400">
              ✅ ¡Doble! Puedes salir de la cárcel.
            </p>
          )}
          {canMove && !selectedPawnId && pawnsOnBoard.length > 0 && (
            <p className="text-blue-400">
              👆 Haz clic en una ficha o usa los botones para seleccionar.
            </p>
          )}
        </div>
      )}

      {/* Doubles consécutifs */}
      {consecutiveDoubles > 0 && (
        <div className="text-center text-sm">
          <span className="text-yellow-400">
            Dobles consecutivos: {consecutiveDoubles}/3
          </span>
          {consecutiveDoubles === 2 && (
            <p className="text-orange-400 text-xs mt-1">
              ⚠️ ¡Un doble más y tu ficha va al Cielo!
            </p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="pt-4 border-t border-slate-700 text-xs text-slate-500">
        <p>Turno: {gameState?.turnNumber || 0}</p>
        <p>Fase: {parquesPhase}</p>
      </div>
    </div>
  );
}
