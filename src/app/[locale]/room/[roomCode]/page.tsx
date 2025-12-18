"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  useSocket,
  useJoinRoom,
  useLeaveRoom,
  useGameActions,
} from "@/hooks/useSocket";
import { useGameStore } from "@/store/gameStore";
import { PlayerList } from "@/components/PlayerList/PlayerList";
import { Chat } from "@/components/Chat/Chat";
import { GameArea } from "@/components/game/GameArea/GameArea";
import styles from "../room.module.css";

function RoomContent() {
  const t = useTranslations("room");
  const tGame = useTranslations("game");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const roomCodeParam = params.roomCode as string;
  const playerName = searchParams.get("name") || "Jugador";

  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socket = useSocket();
  const joinRoom = useJoinRoom();
  const leaveRoom = useLeaveRoom();
  const { setReady, startGame } = useGameActions();

  const { isConnected, roomCode, players, isHost, gameState } = useGameStore();

  const isGameStarted = gameState?.status === "playing";

  // Join room on mount
  useEffect(() => {
    if (!isConnected || roomCode || isJoining) return;

    const join = async () => {
      setIsJoining(true);
      try {
        await joinRoom(roomCodeParam.toUpperCase(), playerName);
        console.log("Room rejointe:", roomCodeParam);
      } catch (err) {
        console.error("Erreur join:", err);
        const errorMsg = (err as Error).message;
        if (errorMsg.includes("not found")) {
          setError(tErrors("roomNotFound"));
        } else if (errorMsg.includes("full")) {
          setError(tErrors("roomFull"));
        } else if (errorMsg.includes("started")) {
          setError(tErrors("gameStarted"));
        } else {
          setError(errorMsg);
        }
      } finally {
        setIsJoining(false);
      }
    };

    join();
  }, [
    isConnected,
    roomCode,
    roomCodeParam,
    playerName,
    joinRoom,
    isJoining,
    tErrors,
  ]);

  const handleLeave = () => {
    leaveRoom();
    router.push("/");
  };

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
    }
  };

  const canStart =
    players.length >= 2 && players.every((p) => p.isReady || p.isHost);

  // Error state
  if (error) {
    return (
      <main className={styles.mainCentered}>
        <div className={`${styles.cardCenter} ${styles.containerNarrow}`}>
          <h1 className={styles.errorTitle}>❌ Error</h1>
          <p className={styles.errorMessage}>{error}</p>
          <button
            onClick={() => router.push("/")}
            className={styles.btnPrimary}
          >
            {t("backHome")}
          </button>
        </div>
      </main>
    );
  }

  // Loading state
  if (!roomCode) {
    return (
      <main className={styles.mainCentered}>
        <div className={`${styles.cardCenter} ${styles.containerNarrow}`}>
          <div className={styles.loadingWrapper}>
            <div className={styles.loadingIcon}>
              <span>🎲</span>
            </div>
            <h2 className={styles.loadingTitle}>{t("joining")}</h2>
            <p className={styles.loadingText}>{t("pleaseWait")}</p>
          </div>
        </div>
      </main>
    );
  }

  // Game in progress
  if (isGameStarted) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.headerGame}>
            <div className={styles.headerLeft}>
              <h1 className={styles.headerTitle}>🎲 Parqués</h1>
              <span className={styles.roomCodeBadgeSmall}>{roomCode}</span>
            </div>
            <button onClick={handleLeave} className={styles.btnSecondary}>
              {tGame("leave")}
            </button>
          </header>

          <GameArea />
        </div>
      </main>
    );
  }

  // Lobby
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.lobbyTitle}>🎲 {t("lobby")}</h1>
            <div className={styles.roomCodeSection}>
              <span className={styles.roomCodeLabel}>{t("roomCode")}:</span>
              <button
                onClick={handleCopyCode}
                className={styles.roomCodeBadge}
                title={t("copyCode")}
              >
                {roomCode}
              </button>
              <span className={styles.roomCodeHint}>({t("clickToCopy")})</span>
            </div>
          </div>

          <button onClick={handleLeave} className={styles.btnSecondary}>
            ← {tGame("leave")}
          </button>
        </header>

        {/* Content Grid */}
        <div className={styles.contentGrid}>
          {/* Players */}
          <div className={styles.contentMain}>
            <PlayerList />

            {/* Actions */}
            <div className={styles.actionsSection}>
              {isHost ? (
                <button
                  onClick={startGame}
                  disabled={!canStart}
                  className={`${styles.btnPrimary} ${styles.btnLarge} ${styles.btnFlex}`}
                >
                  🚀 {tGame("start")}
                </button>
              ) : (
                <button
                  onClick={() => {
                    const myPlayer = useGameStore.getState().player;
                    if (myPlayer) {
                      setReady(!myPlayer.isReady);
                    }
                  }}
                  className={`${styles.btnPrimary} ${styles.btnLarge} ${styles.btnFlex}`}
                >
                  ✓ {t("toggleReady")}
                </button>
              )}
            </div>

            {/* Warning */}
            {!canStart && (
              <div className={styles.warningBox}>
                <p className={styles.warningText}>⚠️ {t("needMorePlayers")}</p>
              </div>
            )}
          </div>

          {/* Chat */}
          <div>
            <Chat />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function RoomPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.mainCentered}>
          <div className={styles.loadingWrapper}>🎲</div>
        </main>
      }
    >
      <RoomContent />
    </Suspense>
  );
}
