// src/features/services/api.ts
import { api } from "../../shared/api";

/** Util ekstraksi token dari berbagai bentuk respons */
function extractToken(data: any): string | null {
  return (
    data?.token ??
    data?.accessToken ??
    data?.access_token ??
    data?.jwt ??
    data?.data?.token ??
    null
  );
}

function extractUserId(data: any): string | null {
  return data?.userId ?? data?.user?.id ?? data?.data?.userId ?? null;
}

function saveAuthLocally(token: string, userId?: string | null) {
  // Simpan ke 2 key agar kompatibel dengan guard lama/baru
  localStorage.setItem("token", token);
  localStorage.setItem("authToken", token);
  if (userId) localStorage.setItem("userId", userId);
}

/* ===================== AUTH ===================== */

export async function loginUser(payload: { email: string; password: string }) {
  try {
    // NB: /api ada di path, bukan di baseURL
    const { data } = await api.post("/api/login", payload);

    const token = extractToken(data);
    const userId = extractUserId(data);

    if (!token) {
      throw new Error("Token tidak ditemukan pada respons login");
    }

    saveAuthLocally(token, userId);
    return { token, userId };
  } catch (e: any) {
    if (e?.response) {
      const msg =
        e.response.data?.error ||
        e.response.data?.message ||
        `HTTP ${e.response.status}`;
      throw new Error(msg);
    }
    throw new Error("Network/CORS error: cek VITE_API_URL & CORS backend.");
  }
}

/**
 * Register fleksibel: mencoba beberapa endpoint umum.
 * Urutan:
 *  1) /api/register
 *  2) /api/auth/register
 *  3) /register
 *  4) /auth/register
 *
 * Jika 409 → email sudah terdaftar.
 * Jika 403 → backend menolak pendaftaran mandiri (butuh diaktifkan di server).
 */
export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
}) {
  const candidates = [
    "/api/register",
    "/api/auth/register",
    "/register",
    "/auth/register",
  ];

  let lastErr: any = null;

  for (const path of candidates) {
    try {
      const { data } = await api.post(path, payload);
      return data;
    } catch (e: any) {
      lastErr = e;
      const status = e?.response?.status;

      // Kalau 404, coba endpoint berikutnya
      if (status === 404) continue;

      // 409: email sudah ada → hentikan dan beri pesan jelas
      if (status === 409) {
        throw new Error("Email sudah terdaftar (409). Silakan login.");
      }

      // 403: backend larang self-register → hentikan dengan pesan jelas
      if (status === 403) {
        throw new Error(
          "Registrasi ditolak (403). Backend menonaktifkan pendaftaran mandiri. " +
            "Aktifkan self-register di server (mis. env ALLOW_SELF_REGISTER=true) atau hubungi admin."
        );
      }

      // Selain itu, lempar error saat itu juga
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        (status ? `HTTP ${status}` : e?.message) ||
        "Gagal registrasi";
      throw new Error(msg);
    }
  }

  // Semua kandidat gagal (umumnya karena 404 semua)
  if (lastErr?.response?.status === 404) {
    throw new Error(
      "Endpoint register tidak ditemukan (404). Pastikan server expose salah satu dari: " +
        "/api/register, /api/auth/register, /register, atau /auth/register."
    );
  }

  throw new Error(
    lastErr?.message || "Gagal registrasi. Periksa konfigurasi server."
  );
}

/* ===================== BOARDS/TASKS ===================== */

export type Column = { id: string; name: string; order?: number };
export type Board = {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  members: string[];
  columns: Column[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  order?: number;
  status?: "planned" | "in_progress" | "done";
};

export async function getBoard(boardId: string): Promise<Board> {
  const { data } = await api.get(`/api/boards/${boardId}`);
  return data;
}

/** Dukung pagination & filter */
export type TaskQuery = {
  status?: "planned" | "in_progress" | "done";
  assignee?: string;
  q?: string;
  limit?: number; // default 30, max 100
  cursor?: string; // hex ObjectId dari last item
};

export async function getBoardTasks(
  boardId: string,
  params: TaskQuery = {}
): Promise<{ items: Task[]; nextCursor?: string }> {
  const { data } = await api.get(`/api/boards/${boardId}/tasks`, { params });
  const items: Task[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : [];
  return { items, nextCursor: data?.nextCursor };
}

export async function createTask(p: {
  boardId: string;
  columnId: string;
  title: string;
}) {
  const { data } = await api.post(`/api/boards/${p.boardId}/tasks`, {
    title: p.title,
    columnId: p.columnId,
  });
  return data as Task;
}

export async function updateTask(p: { taskId: string; title: string }) {
  await api.patch(`/api/tasks/${p.taskId}`, { title: p.title });
}

export async function deleteTask(taskId: string) {
  await api.delete(`/api/tasks/${taskId}`);
}

export async function moveTask(p: {
  taskId: string;
  toColumnId: string;
  toPosition: number;
}) {
  await api.post(`/api/tasks/${p.taskId}/move`, {
    toColumnId: p.toColumnId,
    toPosition: p.toPosition, // 1-based
  });
}

export async function getBoards(): Promise<Board[]> {
  const { data } = await api.get("/api/boards");
  return data;
}

export async function createBoard(boardData: {
  name: string;
  description?: string;
  columns: Column[];
  members?: string[];
}): Promise<Board> {
  const { data } = await api.post("/api/boards", boardData);
  return data;
}

export async function updateBoard(
  boardId: string,
  updates: Partial<{
    name: string;
    description: string;
    columns: Column[];
    members: string[];
  }>
): Promise<void> {
  await api.patch(`/api/boards/${boardId}`, updates);
}

export async function deleteBoard(boardId: string): Promise<void> {
  await api.delete(`/api/boards/${boardId}`);
}
