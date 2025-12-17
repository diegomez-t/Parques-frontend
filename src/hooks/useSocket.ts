"use client";

import { useEffect, useCallback } from "react";
import {
  getSocket,
  connectSocket,
  type RoomState,
} from "@/lib/socket";
import { useGameStore } from "@/store/gameStore";

export function useSocket() {
  const {
    setConnected,
    setPlayers,
    setSettings,
    setIsHost,
    addMessage,
    reset,
  } = useGameStore();

  useEffect(() => {
    const socket = getSocket();

    // Connexion
    socket.on("connect", () => {
      console.log("Socket connected");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });

    // Room events
    socket.on("room:updated", (state: RoomState) => {
      setPlayers(state.players);
      setSettings(state.settings);
      
      // Trouver le joueur actuel par son nom stocké
      const storedPlayerName = useGameStore.getState().playerName;
      const storedPlayer = useGameStore.getState().player;
      
      let currentPlayer = storedPlayer 
        ? state.players.find((p) => p.id === storedPlayer.id)
        : storedPlayerName
          ? state.players.find((p) => p.name === storedPlayerName)
          : null;
      
      if (currentPlayer) {
        // Mettre à jour le player stocké
        useGameStore.getState().setPlayer(currentPlayer);
        setIsHost(currentPlayer.isHost ?? false);
      }
    });

    socket.on("room:closed", (reason) => {
      console.log("Room closed:", reason);
      reset();
    });

    // Chat
    socket.on("chat:message", (data) => {
      addMessage({
        id: crypto.randomUUID(),
        ...data,
      });
    });

    socket.on("chat:system", (message) => {
      addMessage({
        id: crypto.randomUUID(),
        playerId: "system",
        playerName: "Sistema",
        message,
        timestamp: Date.now(),
        isSystem: true,
      });
    });

    // Game events
    socket.on("game:started", (state) => {
      console.log("Game started:", state);
      useGameStore.getState().setGameState(state);
      
      // Resynchroniser notre joueur avec les données du jeu
      const playerName = useGameStore.getState().playerName;
      if (playerName && state.players) {
        const myPlayer = state.players.find((p: any) => p.name === playerName);
        if (myPlayer) {
          console.log("My player from game:", myPlayer);
          useGameStore.getState().setPlayer(myPlayer);
        }
      }
    });

    socket.on("game:state", (state) => {
      useGameStore.getState().setGameState(state);
    });

    socket.on("game:action", (action) => {
      console.log("Game action:", action);
    });

    socket.on("game:ended", (result) => {
      console.log("Game ended:", result);
      // Keep game state for showing results
    });

    socket.on("turn:start", (data) => {
      console.log("Turn start:", data);
      // Could trigger UI notification here
    });

    // Errors
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Connect
    connectSocket();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room:updated");
      socket.off("room:closed");
      socket.off("chat:message");
      socket.off("chat:system");
      socket.off("game:started");
      socket.off("game:state");
      socket.off("game:action");
      socket.off("game:ended");
      socket.off("turn:start");
      socket.off("error");
    };
  }, [setConnected, setPlayers, setSettings, setIsHost, addMessage, reset]);

  return getSocket();
}

export function useCreateRoom() {
  const { setRoomCode, setPlayerName } = useGameStore();

  return useCallback(
    async (playerName: string, settings?: Record<string, unknown>) => {
      const socket = getSocket();
      
      // Stocker le nom du joueur pour l'identifier plus tard
      setPlayerName(playerName);

      return new Promise<string>((resolve, reject) => {
        socket.emit(
          "room:create",
          { playerName, settings },
          (response) => {
            if (response.success && response.roomCode) {
              setRoomCode(response.roomCode);
              resolve(response.roomCode);
            } else {
              reject(new Error(response.error || "Failed to create room"));
            }
          }
        );
      });
    },
    [setRoomCode, setPlayerName]
  );
}

export function useJoinRoom() {
  const { setRoomCode, setPlayerName } = useGameStore();

  return useCallback(
    async (roomCode: string, playerName: string) => {
      const socket = getSocket();
      
      // Stocker le nom du joueur pour l'identifier plus tard
      setPlayerName(playerName);

      return new Promise<void>((resolve, reject) => {
        socket.emit(
          "room:join",
          { roomCode, playerName },
          (response) => {
            if (response.success) {
              setRoomCode(roomCode);
              resolve();
            } else {
              reject(new Error(response.error || "Failed to join room"));
            }
          }
        );
      });
    },
    [setRoomCode, setPlayerName]
  );
}

export function useLeaveRoom() {
  const { reset } = useGameStore();

  return useCallback(() => {
    const socket = getSocket();
    socket.emit("room:leave");
    reset();
  }, [reset]);
}

export function useGameActions() {
  const socket = getSocket();

  const setReady = useCallback(
    (isReady: boolean) => {
      socket.emit("game:ready", isReady);
    },
    [socket]
  );

  const startGame = useCallback(() => {
    socket.emit("game:start");
  }, [socket]);

  const sendAction = useCallback(
    async (type: string, data: Record<string, unknown> = {}) => {
      return new Promise<void>((resolve, reject) => {
        socket.emit("game:action", { type, data }, (response) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || "Action failed"));
          }
        });
      });
    },
    [socket]
  );

  const sendMessage = useCallback(
    (message: string) => {
      socket.emit("chat:message", message);
    },
    [socket]
  );

  return { setReady, startGame, sendAction, sendMessage };
}

