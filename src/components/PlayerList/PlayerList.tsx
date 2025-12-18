"use client";

import { useTranslations } from "next-intl";
import { useGameStore } from "@/store/gameStore";
import styles from "./PlayerList.module.css";

const PLAYER_COLORS = ["red", "blue", "green", "yellow", "purple", "orange"] as const;

const AVATAR_STYLES: Record<string, string> = {
  red: styles.avatarRed,
  blue: styles.avatarBlue,
  green: styles.avatarGreen,
  yellow: styles.avatarYellow,
  purple: styles.avatarPurple,
  orange: styles.avatarOrange,
};

export function PlayerList() {
  const t = useTranslations("game");
  const tCommon = useTranslations("common");
  const players = useGameStore((state) => state.players);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{tCommon("players")} ({players.length})</h3>
      <div className={styles.list}>
        {players.length === 0 ? (
          <p className={styles.emptyState}>{t("waiting")}</p>
        ) : (
          players.map((player, index) => {
            const color = PLAYER_COLORS[index] || "blue";
            const avatarStyle = AVATAR_STYLES[color] || styles.avatarBlue;

            return (
              <div key={player.id} className={styles.playerItem}>
                <div className={styles.playerInfo}>
                  {/* Avatar */}
                  <div className={`${styles.avatar} ${avatarStyle}`}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Details */}
                  <div className={styles.playerDetails}>
                    <div className={styles.playerNameRow}>
                      <span className={styles.playerName}>{player.name}</span>
                      {player.isHost && (
                        <span className={styles.hostBadge}>Host</span>
                      )}
                    </div>
                    <span
                      className={`${styles.connectionStatus} ${
                        player.connectionStatus === "connected"
                          ? styles.statusConnected
                          : styles.statusDisconnected
                      }`}
                    >
                      {player.connectionStatus === "connected"
                        ? t("connected")
                        : t("disconnected")}
                    </span>
                  </div>
                </div>

                {/* Ready Status */}
                <div
                  className={
                    player.isReady || player.isHost
                      ? styles.readyStatusReady
                      : styles.readyStatusNotReady
                  }
                >
                  {player.isReady || player.isHost ? t("ready") : t("notReady")}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
