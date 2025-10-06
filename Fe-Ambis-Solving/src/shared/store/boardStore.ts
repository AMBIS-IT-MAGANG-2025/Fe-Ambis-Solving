import { create } from 'zustand';

/** ================== Types ================== */
export type BoardTask = { id: string; content: string; updatedAt?: string | Date; };
export type BoardColumnData = { id: string; name?: string; tasks: BoardTask[] };

export type Note = { id: string; content: string; timestamp: Date };

export type TimelineEvent =
  | {
      id: string;
      type: 'task_created';
      taskId: string;
      title?: string;        // ← baru
      toColumnId?: string;   // ← baru
      boardId?: string;
      timestamp: Date;
    }
  | {
      id: string;
      type: 'task_updated';
      taskId: string;
      title?: string;        // ← baru
      boardId?: string;
      timestamp: Date;
    }
  | {
      id: string;
      type: 'task_deleted';
      taskId: string;
      boardId?: string;
      timestamp: Date;
    }
  | {
      id: string;
      type: 'task_moved';
      taskId: string;
      fromColumnId?: string; // ← baru
      toColumnId?: string;   // ← baru
      toPosition?: number;
      boardId?: string;
      timestamp: Date;
    };

export type BoardStore = {
  boardData: BoardColumnData[];
  setBoardData: (d: BoardColumnData[]) => void;

  notes: Note[];
  addNote: (content: string) => void;
  removeNote: (id: string) => void;
  clearNotes: () => void;

  events: TimelineEvent[];
  addEvent: (e: Omit<TimelineEvent, 'id' | 'timestamp'> & { timestamp?: Date }) => void;
  removeEvent: (id: string) => void;
  clearEvents: () => void;

  // ==== Baru: judul & label task ====
  taskTitles: Record<string, string>;
  setTaskTitle: (taskId: string, title: string) => void;
  bulkSetTaskTitles: (map: Record<string, string>) => void;

  taskLabels: Record<string, string[]>; // taskId -> label[]
  addTaskLabel: (taskId: string, label: string) => void;
  removeTaskLabel: (taskId: string, label: string) => void;
};

/** ================== LocalStorage helpers ================== */
const NOTES_KEY  = 'ambis.notes.v1';
const EVENTS_KEY = 'ambis.timeline.events.v1';
const TITLES_KEY = 'ambis.taskTitles.v1';
const LABELS_KEY = 'ambis.taskLabels.v1';

const uid = () =>
  typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function'
    ? (crypto as any).randomUUID()
    : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

function load<T>(key: string, reviveDates = false): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return (Array.isArray(raw) ? [] : {}) as T;
    const val = JSON.parse(raw);
    if (!reviveDates) return val;
    // revive timestamp fields if array of objects with timestamp
    if (Array.isArray(val)) {
      return val.map((e: any) => (e?.timestamp ? { ...e, timestamp: new Date(e.timestamp) } : e)) as T;
    }
    return val as T;
  } catch {
    return ({} as unknown) as T;
  }
}
const save = (key: string, v: any) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };

export const useBoardStore = create<BoardStore>((set, get) => ({
  boardData: [],
  setBoardData: (d) => set({ boardData: d }),

  notes: load<Note[]>(NOTES_KEY, true) ?? [],
  addNote: (content) => set((s) => {
    const next: Note = { id: uid(), content, timestamp: new Date() };
    const notes = [next, ...s.notes].slice(0, 1000);
    save(NOTES_KEY, notes);
    return { notes };
  }),
  removeNote: (id) => set((s) => {
    const notes = s.notes.filter(n => n.id !== id);
    save(NOTES_KEY, notes);
    return { notes };
  }),
  clearNotes: () => { save(NOTES_KEY, []); set({ notes: [] }); },

  events: load<TimelineEvent[]>(EVENTS_KEY, true) ?? [],
  addEvent: (payload) => set((s) => {
    const ev: TimelineEvent = { id: uid(), timestamp: payload.timestamp ?? new Date(), ...(payload as any) };
    const events = [ev, ...s.events].slice(0, 2000);
    save(EVENTS_KEY, events);
    return { events };
  }),
  removeEvent: (id) => set((s) => {
    const events = s.events.filter(e => e.id !== id);
    save(EVENTS_KEY, events);
    return { events };
  }),
  clearEvents: () => { save(EVENTS_KEY, []); set({ events: [] }); },

  // ==== Titles ====
  taskTitles: load<Record<string, string>>(TITLES_KEY) ?? {},
  setTaskTitle: (taskId, title) => set((s) => {
    const taskTitles = { ...s.taskTitles, [taskId]: title };
    save(TITLES_KEY, taskTitles);
    return { taskTitles };
  }),
  bulkSetTaskTitles: (map) => set((s) => {
    const taskTitles = { ...s.taskTitles, ...map };
    save(TITLES_KEY, taskTitles);
    return { taskTitles };
  }),

  // ==== Labels ====
  taskLabels: load<Record<string, string[]>>(LABELS_KEY) ?? {},
  addTaskLabel: (taskId, label) => set((s) => {
    const cur = s.taskLabels[taskId] ?? [];
    if (cur.includes(label)) return {};
    const taskLabels = { ...s.taskLabels, [taskId]: [...cur, label] };
    save(LABELS_KEY, taskLabels);
    return { taskLabels };
  }),
  removeTaskLabel: (taskId, label) => set((s) => {
    const cur = s.taskLabels[taskId] ?? [];
    const taskLabels = { ...s.taskLabels, [taskId]: cur.filter(l => l !== label) };
    save(LABELS_KEY, taskLabels);
    return { taskLabels };
  }),
}));
