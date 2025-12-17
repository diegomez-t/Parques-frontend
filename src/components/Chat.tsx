"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useGameStore } from "@/store/gameStore";
import { useGameActions } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";

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
    <div className="card flex flex-col h-80">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-4">
            Sin mensajes aún...
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "text-sm",
                msg.isSystem && "text-slate-400 italic text-center"
              )}
            >
              {!msg.isSystem && (
                <span className="font-semibold text-blue-400">
                  {msg.playerName}:{" "}
                </span>
              )}
              <span className={msg.isSystem ? "" : "text-slate-300"}>
                {msg.message}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("placeholder")}
          className="input flex-1"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="btn btn-primary"
        >
          {t("send")}
        </button>
      </form>
    </div>
  );
}

