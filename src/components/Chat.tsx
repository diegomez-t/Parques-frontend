"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useGameStore } from "@/store/gameStore";
import { useGameActions } from "@/hooks/useSocket";
import styles from "./Chat.module.css";

export function Chat() {
  const t = useTranslations("chat");
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = useGameStore((state) => state.messages);
  const { sendMessage } = useGameActions();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <div className={styles.container}>
      {/* Messages */}
      <div className={styles.messages}>
        {messages.length === 0 ? (
          <p className={styles.emptyState}>Sin mensajes aún...</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={msg.isSystem ? styles.messageSystem : styles.message}
            >
              {!msg.isSystem && (
                <span className={styles.messageAuthor}>{msg.playerName}: </span>
              )}
              <span className={msg.isSystem ? undefined : styles.messageContent}>
                {msg.message}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("placeholder")}
          className={styles.input}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className={styles.sendButton}
        >
          {t("send")}
        </button>
      </form>
    </div>
  );
}
