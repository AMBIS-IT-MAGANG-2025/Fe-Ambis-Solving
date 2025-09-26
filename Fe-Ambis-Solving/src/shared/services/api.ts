// src/features/services/api.ts
import { api } from "../../shared/api";

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
export type Board  = {
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

// ==== BOARDS ====
export async function getBoards(): Promise<Board[]> {
  const { data } = await api.get('/api/boards');
  return data;
}

export async function createBoard(boardData: {
  name: string;
  description?: string;
  columns: Column[];
  members?: string[];
}): Promise<Board> {
  const { data } = await api.post('/api/boards', boardData);
  return data;
}

export async function updateBoard(boardId: string, updates: Partial<{
  name: string;
  description: string;
  columns: Column[];
  members: string[];
}>): Promise<void> {
  await api.patch(`/api/boards/${boardId}`, updates);
}

export async function deleteBoard(boardId: string): Promise<void> {
  await api.delete(`/api/boards/${boardId}`);
}
