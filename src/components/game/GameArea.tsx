"use client";

import { useState, useCallback } from "react";
import { Board } from "../Board/Board";
import { GameControls } from "../GameControls";
import { PlayerList } from "../../PlayerList";
import { Chat } from "../../Chat";
import styles from "./GameArea.module.css";

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
    // Movement is handled via buttons in GameControls
  }, []);

  return (
    <div className={styles.container}>
      {/* Board */}
      <div className={styles.boardSection}>
        <Board
          selectedPawnId={selectedPawnId}
          onPawnSelect={handlePawnSelect}
          highlightedCells={highlightedCells}
          onCellClick={handleCellClick}
        />
      </div>

      {/* Sidebar */}
      <div className={styles.sidebar}>
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
