import { io, Socket } from "socket.io-client";

export interface ClientToServerEvents {
  "room:create": (
    data: { playerName: string; avatar?: string; settings?: Record<string, unknown> },
    callback: (response: { success: boolean; roomCode?: string; error?: string }) => void
  ) => void;
  "room:join": (
    data: { roomCode: string; playerName: string; avatar?: string },
    callback: (response: { success: boolean; roomCode?: string; error?: string }) => void
  ) => void;
  "room:leave": () => void;
  "room:settings": (data: Record<string, unknown>) => void;
  "game:start": () => void;
  "game:action": (
    data: { type: string; data: Record<string, unknown> },
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;
  "game:ready": (isReady: boolean) => void;
  "player:kick": (playerId: string) => void;
  "player:transfer-host": (playerId: string) => void;
  "chat:message": (message: string) => void;
}

export interface ServerToClientEvents {
  "room:updated": (state: RoomState) => void;
  "room:player-joined": (player: PlayerState) => void;
  "room:player-left": (playerId: string) => void;
  "room:closed": (reason: string) => void;
  "game:started": (state: GameState) => void;
  "game:state": (state: GameState) => void;
  "game:action": (action: GameActionResult) => void;
  "game:ended": (result: GameEndPayload) => void;
  "turn:start": (data: TurnStartPayload) => void;
  "turn:timeout-warning": (secondsRemaining: number) => void;
  "turn:ended": (data: TurnEndPayload) => void;
  "chat:message": (data: ChatMessagePayload) => void;
  "chat:system": (message: string) => void;
  error: (error: { code: string; message: string }) => void;
}

// Types simplifiés
export interface PlayerState {
  id: string;
  name: string;
  avatar?: string;
  socketId: string;
  connectionStatus: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  turnOrder: number;
}

export interface RoomState {
  code: string;
  hostId: string;
  players: PlayerState[];
  settings: Record<string, unknown>;
  status: string;
}

export interface GameState {
  id: string;
  code: string;
  status: string;
  phase: string;
  hostId: string;
  currentPlayerId: string | null;
  players: PlayerState[];
  settings: Record<string, unknown>;
  roundNumber: number;
  turnNumber: number;
  gameData: Record<string, unknown>;
}

export interface GameActionResult {
  playerId: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface GameEndPayload {
  winnerId: string | null;
  rankings: Array<{ playerId: string; rank: number; score: number }>;
  stats: Record<string, unknown>;
}

export interface TurnStartPayload {
  playerId: string;
  timeoutMs: number;
  validActions: string[];
}

export interface TurnEndPayload {
  playerId: string;
  action: GameActionResult;
  nextPlayerId: string | null;
}

export interface ChatMessagePayload {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: GameSocket | null = null;

export function getSocket(): GameSocket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001", {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

