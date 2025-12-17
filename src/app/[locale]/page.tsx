"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";

export default function Home() {
  const t = useTranslations("home");
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const handleCreateGame = () => {
    if (playerName.trim()) {
      router.push(`/room/create?name=${encodeURIComponent(playerName)}`);
    }
  };

  const handleJoinGame = () => {
    if (playerName.trim() && roomCode.length === 6) {
      router.push(`/room/${roomCode}?name=${encodeURIComponent(playerName)}`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-md w-full space-y-8">
        {/* Logo / Titre */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-2">
            🎲 {t("title")}
          </h1>
          <p className="text-slate-400">{t("subtitle")}</p>
        </div>

        {/* Formulaire */}
        <div className="card space-y-6">
          {/* Nom du joueur */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t("playerName")}
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={t("enterName")}
              className="input"
              maxLength={20}
            />
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {/* Créer une partie */}
            <button
              onClick={handleCreateGame}
              disabled={!playerName.trim()}
              className="btn btn-primary w-full"
            >
              🎲 {t("createGame")}
            </button>

            {/* Séparateur */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">ou</span>
              </div>
            </div>

            {/* Rejoindre une partie */}
            <div className="flex gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder={t("enterCode")}
                className="input flex-1"
                maxLength={6}
              />
              <button
                onClick={handleJoinGame}
                disabled={!playerName.trim() || roomCode.length !== 6}
                className="btn btn-secondary"
              >
                {t("joinGame")}
              </button>
            </div>
          </div>
        </div>

        {/* Parties publiques */}
        <div className="text-center">
          <Link
            href="/rooms"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            {t("publicGames")} →
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs">
          Parqués Colombiano - Juego de mesa tradicional
        </p>
      </div>
    </main>
  );
}

