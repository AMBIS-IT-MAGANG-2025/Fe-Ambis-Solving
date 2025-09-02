import type {Column} from '../auth/store/boardStore';


const BASE_URL = 'http://localhost:8080/api'; // Sesuaikan dengan URL backend Go Anda


export const loginUser = async (credentials: any) => { // Ganti 'any' dengan tipe data login Anda
  const response = await fetch(`${BASE_URL}/login`, { // Pastikan endpointnya benar
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error('Email atau password salah');
  }
  return response.json(); // Backend harus mengembalikan { token: "..." }
};

// Buat helper untuk mendapatkan headers dengan token
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`, // Format standar: "Bearer spasi token"
  };
};

export const getBoard = async (): Promise<Column[]> => {
  const response = await fetch(`${BASE_URL}/boards`, {
    headers: getAuthHeaders(), // <-- Gunakan helper di sini
  });
  if (!response.ok) throw new Error('Gagal mengambil data board');
  return response.json();
};

export const createTask = async (data: { content: string; columnId: string }) => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(), // <-- Gunakan helper di sini
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