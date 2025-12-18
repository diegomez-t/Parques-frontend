"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import styles from "./page.module.css";

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
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Logo / Title */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.diceIcon}>🎲</span>
            {t("title")}
          </h1>
          <p className={styles.subtitle}>{t("subtitle")}</p>
        </div>

        {/* Form Card */}
        <div className={styles.card}>
          <div className={styles.formGroup}>
            {/* Player Name */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>{t("playerName")}</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={t("enterName")}
                className={styles.input}
                maxLength={20}
              />
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              {/* Create Game */}
              <button
                onClick={handleCreateGame}
                disabled={!playerName.trim()}
                className={`${styles.btnPrimary} ${styles.btnFull}`}
              >
                🎲 {t("createGame")}
              </button>

              {/* Divider */}
              <div className={styles.divider}>
                <div className={styles.dividerLine}>
                  <div className={styles.dividerLineInner} />
                </div>
                <div className={styles.dividerText}>
                  <span className={styles.dividerTextInner}>ou</span>
                </div>
              </div>

              {/* Join Game */}
              <div className={styles.joinGroup}>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder={t("enterCode")}
                  className={styles.inputFlex}
                  maxLength={6}
                />
                <button
                  onClick={handleJoinGame}
                  disabled={!playerName.trim() || roomCode.length !== 6}
                  className={styles.btnSecondary}
                >
                  {t("joinGame")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Public Games Link */}
        <div className={styles.footerLinks}>
          <Link href="/rooms" className={styles.footerLink}>
            {t("publicGames")} →
          </Link>
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <p className={styles.footerText}>
            Parqués Colombiano - Juego de mesa tradicional
          </p>
        </footer>
      </div>
    </main>
  );
}
