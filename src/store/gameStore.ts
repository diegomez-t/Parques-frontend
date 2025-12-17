import { create } from "zustand";
import type { PlayerState, GameState, RoomState } from "@/lib/socket";

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

interface GameStore {
  // État
  isConnected: boolean;
  roomCode: string | null;
  playerName: string | null;
  player: PlayerState | null;
  players: PlayerState[];
  gameState: GameState | null;
  settings: Record<string, unknown> | null;
  isHost: boolean;
  messages: ChatMessage[];

  // Actions
  setConnected: (connected: boolean) => void;
  setRoomCode: (code: string | null) => void;
  setPlayerName: (name: string | null) => void;
  setPlayer: (player: PlayerState | null) => void;
  setPlayers: (players: PlayerState[]) => void;
  setGameState: (state: GameState | null) => void;
  setSettings: (settings: Record<string, unknown> | null) => void;
  setIsHost: (isHost: boolean) => void;
  addMessage: (message: ChatMessage) => void;
  reset: () => void;
}

const initialState = {
  isConnected: false,
  roomCode: null,
  playerName: null,
  player: null,
  players: [],
  gameState: null,
  settings: null,
  isHost: false,
  messages: [],
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setConnected: (isConnected) => set({ isConnected }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setPlayerName: (playerName) => set({ playerName }),
  setPlayer: (player) => set({ player }),
  setPlayers: (players) => set({ players }),
  setGameState: (gameState) => set({ gameState }),
  setSettings: (settings) => set({ settings }),
  setIsHost: (isHost) => set({ isHost }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages.slice(-99), message], // Garder max 100 messages
    })),

  reset: () => set(initialState),
}));

