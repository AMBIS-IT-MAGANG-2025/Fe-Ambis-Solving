// src/shared/services/socket.ts
import { io, type Socket } from "socket.io-client";

const SOCKET_URL  = (import.meta.env.VITE_SOCKET_URL  as string) || "http://localhost:8080";
const SOCKET_PATH = (import.meta.env.VITE_SOCKET_PATH as string) || "/socket.io/";
const ENABLE_SOCKET = false; // Disable socket to prevent CORS errors

function getToken(): string | null {
  return localStorage.getItem("authToken") || localStorage.getItem("token") || null;
}

interface ServerToClientEvents {
  task_created: (p: any) => void;
  task_updated: (p: any) => void;
  task_moved:   (p: any) => void;
  task_deleted: (p: any) => void;
}
interface ClientToServerEvents {
  join_board: (boardId: string) => void;
  leave_board: (boardId: string) => void;
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  path: SOCKET_PATH,
  autoConnect: false,
   transports: ["polling"],  // ❌ hapus baris ini kalau ada: transports: ["websocket"],
  // (biarkan default: polling → upgrade websocket)
  auth: cb => cb({ token: getToken() || undefined }),
  withCredentials: false,
});

export function connectSocket() {
  if (!ENABLE_SOCKET) return;
  try {
    (socket as any).auth = { token: getToken() || undefined };
    if (!socket.connected) socket.connect();
  } catch (error) {
    console.warn('[SOCKET] Failed to connect:', error);
  }
}
export function joinBoard(boardId: string) {
  if (!ENABLE_SOCKET) return;
  try {
    connectSocket();
    socket.emit("join_board", boardId);
  } catch (error) {
    console.warn('[SOCKET] Failed to join board:', error);
  }
}
export function leaveBoard(boardId: string) {
  if (!ENABLE_SOCKET) return;
  try {
    socket.emit("leave_board", boardId);
  } catch (error) {
    console.warn('[SOCKET] Failed to leave board:', error);
  }
}


/** ===== Logging ringan untuk debug dev ===== */
if (import.meta.env.DEV && ENABLE_SOCKET) {
  socket.on("connect", () => {
    // eslint-disable-next-line no-console
    console.log("[SOCKET] connected", socket.id);
  });
  socket.on("disconnect", (reason) => {
    // eslint-disable-next-line no-console
    console.log("[SOCKET] disconnected:", reason);
  });
  socket.on("connect_error", (err) => {
    // eslint-disable-next-line no-console
    console.warn("[SOCKET] connect_error:", err.message);
  });
  // Spy semua event (bisa dinonaktifkan jika sudah stabil)
  (socket as any).onAny?.((event: string, ...args: any[]) => {
    // eslint-disable-next-line no-console
    console.debug("[SOCKET][EV]", event, ...args);
  });
}
