import type {Column} from '../auth/store/boardStore';


const BASE_URL = 'http://localhost:8080/api'; // Sesuaikan dengan URL backend Go Anda

export const getBoard = async (): Promise<Column[]> => {
  const response = await fetch(`${BASE_URL}/board`);
  if (!response.ok) throw new Error('Gagal mengambil data board');
  return response.json();
};

export const createTask = async (data: { content: string; columnId: string }) => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Gagal membuat tugas');
  return response.json();
};

// ... Tambahkan fungsi untuk updateTask, deleteTask, dan moveTask di sini
// Contoh untuk deleteTask:
export const deleteTask = async (taskId: string) => {
    const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Gagal menghapus tugas');
};

export const updateTask = async (data: { taskId: string; content: string }) => {
  const response = await fetch(`${BASE_URL}/tasks/${data.taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: data.content }),
  });
  if (!response.ok) throw new Error('Gagal memperbarui tugas');
  return response.json();
};

export const moveTask = async (data: { 
  taskId: string; 
  sourceColumnId: string; 
  destColumnId: string; 
  newIndex: number; 
}) => {
  const response = await fetch(`${BASE_URL}/tasks/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Gagal memindahkan tugas');
  return response.json();
};

// Anda bisa lengkapi sisanya sesuai kebutuhan endpoint di atas