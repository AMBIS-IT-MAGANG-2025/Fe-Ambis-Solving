import { create } from 'zustand';
import type { OnDragEndResponder } from '@hello-pangea/dnd';

// Tipe Data (bisa kita pindahkan ke file types/ terpisah nanti)
export type Task = {
  id: string;
  content: string;
};

export type Column = {
  id: string;
  title: string;
  tasks: Task[];
};

// Data Awal
const initialBoardData: Column[] = [
  // ... (salin data dummy dari BoardPage.tsx sebelumnya ke sini)
  {
    id: 'planned',
    title: 'Direncanakan',
    tasks: [
      { id: 'task-1', content: 'Analisis kebutuhan fitur timeline' },
      { id: 'task-2', content: 'Desain UI/UX untuk halaman login' },
    ],
  },
  {
    id: 'in-progress',
    title: 'Sedang Dikerjakan',
    tasks: [
      { id: 'task-4', content: 'Membuat Halaman Login (UI & Validasi)' },
    ],
  },
  {
    id: 'done',
    title: 'Selesai',
    tasks: [
      { id: 'task-6', content: 'Inisialisasi Proyek Frontend Vite + React' },
    ],
  },
];

// Definisikan state dan aksi-aksinya
type BoardState = {
  boardData: Column[];
  addTask: (columnId: Column['id'], content: string) => void;
  updateTask: (columnId: Column['id'], taskId: Task['id'], content: string) => void;
  deleteTask: (columnId: Column['id'], taskId: Task['id']) => void;
  handleDragEnd: OnDragEndResponder;
};

export const useBoardStore = create<BoardState>((set) => ({
  boardData: initialBoardData,

  addTask: (columnId, content) => set((state) => ({
    boardData: state.boardData.map(col =>
      col.id === columnId
        ? { ...col, tasks: [...col.tasks, { id: `task-${Date.now()}`, content }] }
        : col
    ),
  })),

  updateTask: (columnId, taskId, content) => set((state) => ({
    boardData: state.boardData.map(col =>
      col.id === columnId
        ? { ...col, tasks: col.tasks.map(t => t.id === taskId ? { ...t, content } : t) }
        : col
    ),
  })),

  deleteTask: (columnId, taskId) => set((state) => ({
    boardData: state.boardData.map(col =>
      col.id === columnId ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) } : col
    ),
  })),

  handleDragEnd: (result) => set((state) => {
    const { destination, source } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return state;
    }

    const startColumn = state.boardData.find(col => col.id === source.droppableId);
    const finishColumn = state.boardData.find(col => col.id === destination.droppableId);
    if (!startColumn || !finishColumn) return state;

    let newBoardData = [...state.boardData];
    
    if (startColumn === finishColumn) {
      const newTasks = Array.from(startColumn.tasks);
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);
      const newColumn: Column = { ...startColumn, tasks: newTasks };
      newBoardData = newBoardData.map(col => (col.id === newColumn.id ? newColumn : col));
    } else {
      const startTasks = Array.from(startColumn.tasks);
      const [removed] = startTasks.splice(source.index, 1);
      const newStartColumn: Column = { ...startColumn, tasks: startTasks };

      const finishTasks = Array.from(finishColumn.tasks);
      finishTasks.splice(destination.index, 0, removed);
      const newFinishColumn: Column = { ...finishColumn, tasks: finishTasks };

      newBoardData = newBoardData.map(col => {
        if (col.id === newStartColumn.id) return newStartColumn;
        if (col.id === newFinishColumn.id) return newFinishColumn;
        return col;
      });
    }

    return { boardData: newBoardData };
  }),
}));