"use client";

import { useTranslations } from "next-intl";
import { useGameStore } from "@/store/gameStore";
import { cn } from "@/lib/utils";

const PLAYER_COLORS = ["red", "blue", "green", "yellow", "purple", "orange"];

export function PlayerList() {
  const t = useTranslations("game");
  const players = useGameStore((state) => state.players);

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">
        Jugadores ({players.length})
      </h3>
      <div className="space-y-3">
        {players.length === 0 ? (
          <p className="text-slate-400 text-sm">{t("waiting")}</p>
        ) : (
          players.map((player, index) => (
            <div
              key={player.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg",
                "bg-slate-700/50"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Avatar/Color */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                    `bg-player-${PLAYER_COLORS[index] || "blue"}`
                  )}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{player.name}</span>
                    {player.isHost && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                        Host
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs",
                      player.connectionStatus === "connected"
                        ? "text-green-400"
                        : "text-red-400"
                    )}
                  >
                    {player.connectionStatus === "connected"
                      ? "Conectado"
                      : "Desconectado"}
                  </span>
                </div>
              </div>

              {/* Ready status */}
              <div
                className={cn(
                  "text-xs font-medium px-3 py-1 rounded-full",
                  player.isReady || player.isHost
                    ? "bg-green-500/20 text-green-400"
                    : "bg-slate-600/50 text-slate-400"
                )}
              >
                {player.isReady || player.isHost ? t("ready") : t("notReady")}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

