"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSocket, useCreateRoom, useLeaveRoom, useGameActions } from "@/hooks/useSocket";
import { useGameStore } from "@/store/gameStore";
import { PlayerList } from "@/components/PlayerList";
import { Chat } from "@/components/Chat";
import { GameArea } from "@/components/game/GameArea";

function CreateRoomContent() {
  const t = useTranslations("room");
  const tGame = useTranslations("game");
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerName = searchParams.get("name") || "Jugador";
  
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const socket = useSocket();
  const createRoom = useCreateRoom();
  const leaveRoom = useLeaveRoom();
  const { setReady, startGame } = useGameActions();
  
  const { isConnected, roomCode, players, isHost, gameState } = useGameStore();
  
  const isGameStarted = gameState?.status === "playing";

  // Créer la room au montage
  useEffect(() => {
    if (!isConnected || roomCode || isCreating) return;

    const create = async () => {
      setIsCreating(true);
      try {
        const code = await createRoom(playerName, {
          maxPlayers: 4,
          isPrivate: false,
        });
        console.log("Room créée:", code);
      } catch (err) {
        console.error("Erreur création:", err);
        setError((err as Error).message);
      } finally {
        setIsCreating(false);
      }
    };

    create();
  }, [isConnected, roomCode, playerName, createRoom, isCreating]);

  // Les événements game:started sont gérés dans useSocket et mettent à jour gameState

  const handleLeave = () => {
    leaveRoom();
    router.push("/");
  };

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
    }
  };

  const canStart = players.length >= 2 && players.every((p) => p.isReady || p.isHost);

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="card max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">❌ Error</h1>
          <p className="text-slate-300 mb-6">{error}</p>
          <button onClick={() => router.push("/")} className="btn btn-primary">
            {t("backHome")}
          </button>
        </div>
      </main>
    );
  }

  if (!roomCode) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="card max-w-md w-full text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/30 flex items-center justify-center">
              <span className="text-3xl">🎲</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {t("creating")}
            </h2>
            <p className="text-slate-400">{t("pleaseWait")}</p>
          </div>
        </div>
      </main>
    );
  }

  // Affichage du jeu en cours
  if (isGameStarted) {
    return (
      <main className="min-h-screen p-2 md:p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto">
          {/* Header compact */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white">🎲 Parqués</h1>
              <span className="px-3 py-1 bg-slate-700 rounded font-mono text-sm text-slate-300">
                {roomCode}
              </span>
            </div>
            <button onClick={handleLeave} className="btn btn-secondary text-sm">
              {tGame("leave")}
            </button>
          </div>

          {/* Game Layout */}
          <GameArea />
        </div>
      </main>
    );
  }

  // Lobby d'attente
  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              🎲 {t("lobby")}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">{t("roomCode")}:</span>
              <button
                onClick={handleCopyCode}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-mono text-xl text-white tracking-widest transition-colors"
                title={t("copyCode")}
              >
                {roomCode}
              </button>
              <span className="text-xs text-slate-500">({t("clickToCopy")})</span>
            </div>
          </div>
          
          <button onClick={handleLeave} className="btn btn-secondary">
            ← {tGame("leave")}
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players */}
          <div className="lg:col-span-2">
            <PlayerList />
            
            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              {isHost ? (
                <button
                  onClick={startGame}
                  disabled={!canStart}
                  className="btn btn-primary flex-1 text-lg py-4"
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
                  className="btn btn-primary flex-1 text-lg py-4"
                >
                  ✓ {t("toggleReady")}
                </button>
              )}
            </div>

            {/* Debug info */}
            {!canStart && players.length >= 2 && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  ⚠️ {t("needMorePlayers")}
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 card bg-slate-800/50">
              <h3 className="text-lg font-semibold text-white mb-3">
                📋 {t("howToPlay")}
              </h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li>• {t("instruction1")}</li>
                <li>• {t("instruction2")}</li>
                <li>• {t("instruction3")}</li>
              </ul>
            </div>
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

export default function CreateRoomPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-pulse text-white">Cargando...</div>
      </main>
    }>
      <CreateRoomContent />
    </Suspense>
  );
}

