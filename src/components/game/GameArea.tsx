"use client";

import { useState, useCallback } from "react";
import { Board } from "./Board";
import { GameControls } from "./GameControls";
import { PlayerList } from "../PlayerList";
import { Chat } from "../Chat";

export function GameArea() {
  const [selectedPawnId, setSelectedPawnId] = useState<number | null>(null);
  const [highlightedCells, setHighlightedCells] = useState<number[]>([]);

  const handlePawnSelect = useCallback((pawnId: number | null) => {
    setSelectedPawnId(pawnId);
  }, []);

  const handleHighlightCells = useCallback((cells: number[]) => {
    setHighlightedCells(cells);
  }, []);

  const handleCellClick = useCallback((cellIndex: number) => {
    console.log("Cell clicked:", cellIndex);
    // Le mouvement est géré via les boutons dans GameControls
  }, []);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
      {/* Board */}
      <div className="xl:col-span-3">
        <Board 
          selectedPawnId={selectedPawnId}
          onPawnSelect={handlePawnSelect}
          highlightedCells={highlightedCells}
          onCellClick={handleCellClick}
        />
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <GameControls 
          selectedPawnId={selectedPawnId}
          onPawnSelect={handlePawnSelect}
          onHighlightCells={handleHighlightCells}
        />
        <PlayerList />
        <Chat />
      </div>
    </div>
  );
}

