"use client";

import { useState, useMemo, useEffect } from "react";
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
  diceUsed: 'dice1' | 'dice2' | 'sum';
  steps: number;
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
    dice?: { values: [number, number]; hasRolled: boolean; usedDice: number[] };
    remainingDice?: number[];
    consecutiveDoubles?: number;
    parquesPhase?: string;
    validMoves?: ValidMove[];
    mustEat?: boolean;
    pawns?: Record<string, PawnData[]>;
  } | undefined;

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

  // Mes pions
  const myPawns = player?.id ? (gameData?.pawns?.[player.id] || []) : [];
  const allInPrison = myPawns.every(p => p.inPrison);
  const pawnsOnBoard = myPawns.filter(p => !p.inPrison && !p.inCielo);

  // Calculer les mouvements possibles pour le pion sélectionné
  const movesForSelectedPawn = useMemo(() => {
    if (selectedPawnId === null || !canMove) return [];
    return validMoves.filter(m => m.pawnId === selectedPawnId);
  }, [selectedPawnId, validMoves, canMove]);

  // Grouper les mouvements par option
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
      // Créer le label du dé
      let diceLabel: string;
      if (move.diceUsed === 'sum') {
        diceLabel = `🎲 Suma: ${diceValues[0]} + ${diceValues[1]} = ${sum}`;
      } else if (move.diceUsed === 'dice1') {
        diceLabel = `🎲 Dado 1: ${diceValues[0]}`;
      } else {
        diceLabel = `🎲 Dado 2: ${diceValues[1]}`;
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
        steps: move.steps,
        targetPosition: move.targetPosition,
        diceUsed: move.diceUsed,
        posLabel
      });
    }
    
    // Trier: somme en premier, puis par nombre de pas décroissant
    options.sort((a, b) => {
      if (a.diceUsed === 'sum' && b.diceUsed !== 'sum') return -1;
      if (a.diceUsed !== 'sum' && b.diceUsed === 'sum') return 1;
      return b.steps - a.steps;
    });
    
    return options;
  }, [selectedPawnId, movesForSelectedPawn, diceValues, sum]);

  // Mettre à jour les cellules surlignées quand un pion est sélectionné
  useEffect(() => {
    if (selectedPawnId !== null && canMove) {
      const cells = movesForSelectedPawn
        .filter(m => m.targetPosition < 100)
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

  const handleMove = async (targetPosition: number, diceUsed: string) => {
    if (!isMyTurn || selectedPawnId === null) return;
    
    try {
      await sendAction("move_pawn", { 
        pawnId: selectedPawnId, 
        targetPosition,
        diceUsed // Envoyer quel dé est utilisé
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
        <div className="relative">
          <DicePair values={diceValues} isRolling={isRolling} size={50} />
          
          {/* Indicateurs de dés utilisés */}
          {hasRolled && usedDice.length > 0 && !isDouble && (
            <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-8">
              {usedDice.includes(0) && (
                <span className="text-xs bg-green-500 text-white px-1 rounded">✓</span>
              )}
              {usedDice.includes(1) && (
                <span className="text-xs bg-green-500 text-white px-1 rounded ml-8">✓</span>
              )}
            </div>
          )}
        </div>
        
        {hasRolled && (
          <div className="text-center">
            <p className="text-xl font-bold text-white">
              {diceValues[0]} + {diceValues[1]} = <span className="text-blue-400">{sum}</span>
            </p>
            {isDouble && (
              <p className="text-yellow-400 text-sm mt-1">¡Doble! Tienes otro turno.</p>
            )}
            
            {/* Indicateur des dés restants */}
            {usedDice.length > 0 && usedDice.length < 2 && !isDouble && (
              <div className="mt-2 p-2 bg-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  🎲 Dado restante: <span className="font-bold">{remainingDice.join(', ')}</span>
                </p>
                <p className="text-xs text-blue-400 mt-1">
                  Selecciona otra ficha para usar este dado
                </p>
              </div>
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
                      ? "bg-blue-500 text-white ring-2 ring-blue-300"
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
                onClick={() => handleMove(option.targetPosition, option.diceUsed)}
                className={cn(
                  "w-full p-3 rounded-lg text-left transition-all",
                  option.diceUsed === 'sum' 
                    ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400"
                    : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400",
                  "text-white font-medium shadow-lg hover:shadow-xl",
                  "flex items-center justify-between gap-2"
                )}
              >
                <span className="flex-1">{option.label}</span>
                <span className={cn(
                  "text-sm px-2 py-1 rounded",
                  option.diceUsed === 'sum' ? "bg-purple-700/50" : "bg-blue-700/50"
                )}>
                  {option.posLabel}
                </span>
              </button>
            ))}
          </div>
          
          {moveOptions.length > 1 && (
            <p className="text-xs text-slate-500 text-center mt-2">
              💡 Si no usas la suma, podrás mover otra ficha con el dado restante
            </p>
          )}
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
            {usedDice.length > 0 ? `${t("pass")} (terminar turno)` : t("pass")}
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
          {canMove && selectedPawnId === null && pawnsOnBoard.length > 0 && (
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
        {usedDice.length > 0 && <p>Dados usados: {usedDice.map(d => d + 1).join(', ')}</p>}
      </div>
    </div>
  );
}
