// src/shared/socket.ts
import { io, Socket } from "socket.io-client";

export const socket: Socket = io(import.meta.env.VITE_SOCKET_URL, {
  path: import.meta.env.VITE_SOCKET_PATH || "/socket.io/",
  transports: ["websocket", "polling"],
  withCredentials: false,
  autoConnect: false, // biar kita kontrol
  auth: { token: localStorage.getItem("token") || "" },
});
