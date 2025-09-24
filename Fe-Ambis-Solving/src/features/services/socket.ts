// src/features/auth/services/socket.ts
import { io, type Socket } from "socket.io-client";

const SOCKET_URL  = (import.meta.env.VITE_SOCKET_URL  as string) || "http://localhost:8080";
const SOCKET_PATH = (import.meta.env.VITE_SOCKET_PATH as string) || "/socket.io/";

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
  (socket as any).auth = { token: getToken() || undefined };
  if (!socket.connected) socket.connect();
}
export function joinBoard(boardId: string) { connectSocket(); socket.emit("join_board", boardId); }
export function leaveBoard(boardId: string) { socket.emit("leave_board", boardId); }


/** ===== Logging ringan untuk debug dev ===== */
if (import.meta.env.DEV) {
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
