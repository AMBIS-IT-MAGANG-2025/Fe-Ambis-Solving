// src/features/services/api.ts
import axios from "axios";

// === axios instance ===
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // TANPA /api di env
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const s = err?.response?.status;
    const url = err?.config?.url;
    console.error("API error:", s, url, err?.response?.data || err.message);
    if (s === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      if (location.pathname !== "/login") location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ==== AUTH ====
export async function loginUser(payload: { email: string; password: string }) {
  try {
    const { data } = await api.post("/api/login", payload); // <— /api ada di path, bukan di baseURL
    if (data?.token) {
      localStorage.setItem("token", data.token);
      if (data?.userId) localStorage.setItem("userId", data.userId);
    }
    return data;
  } catch (e: any) {
    // Biar tidak cuma “Network Error”, beri pesan jelas
    if (e?.response) {
      const msg = e.response.data?.error || `HTTP ${e.response.status}`;
      throw new Error(msg);
    }
    throw new Error("Network/CORS error: cek VITE_API_URL & CORS backend.");
  }
}

export async function registerUser(payload: { name: string; email: string; password: string }) {
  const { data } = await api.post("/api/register", payload);
  return data;
}

// ==== BOARDS/TASKS ====
export type Column = { id: string; name: string; order?: number };
export type Board  = { id: string; name: string; columns: Column[] };

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

/** ⬇️ Baru: dukung pagination & filter */
export type TaskQuery = {
  status?: "planned" | "in_progress" | "done";
  assignee?: string;
  q?: string;
  limit?: number;    // default 30, max 100
  cursor?: string;   // hex ObjectId dari last item
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

export async function createTask(p: { boardId: string; columnId: string; title: string }) {
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

export async function moveTask(p: { taskId: string; toColumnId: string; toPosition: number }) {
  await api.post(`/api/tasks/${p.taskId}/move`, {
    toColumnId: p.toColumnId,
    toPosition: p.toPosition, // 1-based
  });
}
