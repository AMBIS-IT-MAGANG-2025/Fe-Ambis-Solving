// src/features/board/pages/BoardPage.tsx
import React, { useMemo, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBoard,
  getBoardTasks,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
} from "../../../shared/services/api";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { useBoardStore } from "../../../shared/store/boardStore";

/** ===== Types (samakan dengan API) ===== */
type BoardColumn = { id: string; name: string; order: number };
type Board = { id: string; name: string; description?: string; columns: BoardColumn[] };
// penting: order optional agar cocok dengan API yang bisa undefined
type Task = { id: string; title: string; columnId: string; order?: number };

/** ===== Util: validasi 24-hex ===== */
const isHex24 = (s: string) => /^[a-f0-9]{24}$/i.test(s);

/** ===== Status helper untuk pewarnaan kartu & glow ===== */
type Status = "todo" | "inprogress" | "done";

const COLUMN_KEYS = {
  todo: ["todo", "planned", "backlog", "direncanakan"],
  inprogress: ["in-progress", "progress", "doing", "dikerjakan"],
  done: ["done", "selesai", "completed"],
} as const;

function columnStatus(col: { id: string; name?: string }): Status {
  const id = (col.id || "").toLowerCase();
  const name = (col.name || "").toLowerCase();
  if (COLUMN_KEYS.done.some((k) => id === k || name.includes(k))) return "done";
  if (COLUMN_KEYS.inprogress.some((k) => id === k || name.includes(k))) return "inprogress";
  return "todo";
}

function toneClass(status: Status) {
  return status === "inprogress" ? "glow-blue" : status === "done" ? "glow-green" : "glow-slate";
}

function taskCardClasses(status: Status, dragging: boolean) {
  const ring = dragging ? " ring-2 ring-blue-500" : "";
  switch (status) {
    case "inprogress":
      return (
        "mb-2 rounded-xl border p-3 shadow-sm transition " +
        "border-blue-200 bg-blue-50 text-blue-900 " +
        "dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-100" +
        ring
      );
    case "done":
      return (
        "mb-2 rounded-xl border p-3 shadow-sm transition " +
        "border-emerald-200 bg-emerald-50 text-emerald-900 " +
        "dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-100" +
        ring
      );
    default:
      return (
        "mb-2 rounded-xl border p-3 shadow-sm transition " +
        "border-slate-200 bg-white text-slate-900 " +
        "dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" +
        ring
      );
  }
}

/** ====== PRIORITY (UI-only, disimpan di localStorage) ====== */
type Priority = "low" | "medium" | "high";
const PRIORITY_KEY = "ambis.taskPriority.v1";

const loadPriorityMap = (): Record<string, Priority> => {
  try {
    const raw = localStorage.getItem(PRIORITY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
const savePriorityMap = (map: Record<string, Priority>) => {
  try {
    localStorage.setItem(PRIORITY_KEY, JSON.stringify(map));
  } catch {}
};
const nextPriority = (p: Priority): Priority =>
  p === "low" ? "medium" : p === "medium" ? "high" : "low";

const priorityChip = (p: Priority) => {
  switch (p) {
    case "high":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200 border border-rose-200 dark:border-rose-800";
    case "medium":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-200 dark:border-amber-800";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700";
  }
};
const priorityLabel = (p: Priority) =>
  p === "high" ? "High" : p === "medium" ? "Medium" : "Small";

/** Cari boardId dari props, params, query, atau path */
function useSafeBoardId(propId?: string): string | null {
  if (propId && isHex24(propId)) return propId;

  try {
    // @ts-ignore - biar aman kalau route augmentation belum kena
    const { useParams } = require("@tanstack/react-router");
    if (useParams) {
      // @ts-ignore
      const p = useParams({ from: "/boards/$boardId" }) as { boardId?: string };
      if (p?.boardId && isHex24(p.boardId)) return p.boardId;
    }
  } catch {}

  const qs = new URLSearchParams(window.location.search).get("boardId");
  if (qs && isHex24(qs)) return qs;

  const parts = window.location.pathname.split("/").filter(Boolean);
  const i = parts.findIndex((x) => ["boards", "board"].includes(x.toLowerCase()));
  if (i >= 0 && parts[i + 1] && isHex24(parts[i + 1])) return parts[i + 1];

  const last = parts.at(-1);
  if (last && isHex24(last)) return last;

  return null;
}

function SectionHeader({ title, onRefresh }: { title: string; onRefresh?: () => void }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          title="Refresh tasks"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </button>
      )}
    </div>
  );
}

export function BoardPage(props: { boardId?: string }) {
  const boardId = useSafeBoardId(props.boardId);
  const qc = useQueryClient();
  const { addEvent } = useBoardStore(); // payload minimal agar cocok tipe store sekarang

  // Map priority per taskId (persist di localStorage)
  const [priorityByTask, setPriorityByTask] = useState<Record<string, Priority>>(
    () => loadPriorityMap()
  );
  const setTaskPriority = (taskId: string, prio: Priority) => {
    setPriorityByTask((prev) => {
      const next = { ...prev, [taskId]: prio };
      savePriorityMap(next);
      return next;
    });
  };

  // Priority pilihan saat "Tambah task" per kolom
  const [newPriorityByCol, setNewPriorityByCol] = useState<Record<string, Priority>>({});

  if (!boardId) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">
          Board ID tidak valid. Gunakan rute{" "}
          <code>/boards/&lt;24-hex&gt;</code> atau tambahkan <code>?boardId=&lt;id&gt;</code>.
        </p>
      </div>
    );
  }

  /** ===== Queries ===== */
  const {
    data: board,
    isLoading: loadingBoard,
    isError: errBoard,
    refetch: refetchBoard,
  } = useQuery<Board>({
    queryKey: ["board", boardId],
    queryFn: () => getBoard(boardId) as Promise<Board>,
  });

  const {
    data: tasksRes,
    isLoading: loadingTasks,
    isError: errTasks,
    refetch: refetchTasks,
  } = useQuery<{ items: Task[] }>({
    queryKey: ["tasks", boardId],
    queryFn: () => getBoardTasks(boardId) as Promise<{ items: Task[] }>,
  });

  const tasks: Task[] = useMemo(() => (tasksRes?.items ?? []).slice(), [tasksRes]);

  /** ===== Mutations (catat event: payload MINIMAL) ===== */
  const mCreate = useMutation<Task, Error, { title: string; columnId: string }>({
    mutationFn: (p) => createTask({ boardId, ...p }) as Promise<Task>,
    onSuccess: (task, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", boardId] });
      // set priority untuk task baru (UI-only)
      const pr = newPriorityByCol[vars.columnId] ?? "medium";
      setTaskPriority(task.id, pr);
      addEvent({ type: "task_created", taskId: task.id, boardId });
    },
  });

  const mUpdate = useMutation<void, Error, { taskId: string; title: string }>({
    mutationFn: (p) => updateTask(p),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", boardId] });
      addEvent({ type: "task_updated", taskId: vars.taskId, boardId });
    },
  });

  const mDelete = useMutation<void, Error, string>({
    mutationFn: (taskId) => deleteTask(taskId),
    onSuccess: (_res, taskId) => {
      qc.invalidateQueries({ queryKey: ["tasks", boardId] });
      addEvent({ type: "task_deleted", taskId, boardId });
    },
  });

  const mMove = useMutation<void, Error, { taskId: string; toColumnId: string; toPosition: number }>(
    {
      mutationFn: (p) => moveTask(p) as Promise<void>,
      onSuccess: (_res, vars) => {
        qc.invalidateQueries({ queryKey: ["tasks", boardId] });
        addEvent({ type: "task_moved", taskId: vars.taskId, boardId });
      },
    }
  );

  /** ===== State judul baru per kolom ===== */
  const [newTitleByCol, setNewTitleByCol] = useState<Record<string, string>>({});
  const setTitle = (colId: string, v: string) =>
    setNewTitleByCol((s) => ({ ...s, [colId]: v }));

  const columns = useMemo(
    () => (board?.columns ?? []).slice().sort((a, b) => a.order - b.order),
    [board]
  );

  const tasksByCol = (colId: string) =>
    tasks
      .filter((t) => t.columnId === colId)
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  /** ===== DnD handler ===== */
  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    mMove.mutate({
      taskId: draggableId,
      toColumnId: destination.droppableId,
      toPosition: destination.index + 1,
    });
  };

  /** ===== UI states ===== */
  if (loadingBoard || loadingTasks) {
    return (
      <div className="grid gap-4 p-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[420px] rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-2 h-4 w-1/3 animate-pulse rounded bg-slate-300 dark:bg-slate-700" />
            {Array.from({ length: 6 }).map((__, j) => (
              <div
                key={j}
                className="mb-2 h-16 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (errBoard || errTasks) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">
          Gagal memuat board atau tasks.{" "}
          <button
            className="underline"
            onClick={() => {
              refetchBoard();
              refetchTasks();
            }}
          >
            Coba lagi
          </button>
        </p>
      </div>
    );
  }

  /** ===== Render ===== */
  return (
    <div className="p-4 md:p-6 text-slate-900 dark:text-slate-100">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{board?.name ?? "Board"}</h1>
          {board?.description && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {board.description}
            </p>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {columns.map((col) => (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided) => {
                const status = columnStatus(col);
                const tone = toneClass(status);
                const selectedPrio = newPriorityByCol[col.id] ?? "medium";
                return (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      min-h-[420px] rounded-2xl border border-slate-200 bg-white p-3
                      dark:border-slate-800 dark:bg-slate-900
                      glow-column ${tone}
                    `}
                  >
                    <SectionHeader
                      title={col.name}
                      onRefresh={() =>
                        qc.invalidateQueries({ queryKey: ["tasks", boardId] })
                      }
                    />

                    {/* Tambah task cepat */}
                    <form
                      className="mb-3 flex flex-col gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const title = (newTitleByCol[col.id] || "").trim();
                        if (!title) return;
                        mCreate.mutate(
                          { title, columnId: col.id },
                          { onSuccess: () => setTitle(col.id, "") }
                        );
                      }}
                    >
                      <div className="flex gap-2">
                        <input
                          value={newTitleByCol[col.id] || ""}
                          onChange={(e) => setTitle(col.id, e.target.value)}
                          placeholder="Tambah task…"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-indigo-400/40"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          disabled={mCreate.isPending}
                          title="Tambah task"
                        >
                          <Plus className="size-4" />
                          Add
                        </button>
                      </div>

                      {/* Picker Priority */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Priority:
                        </span>
                        <div className="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                          {(["low", "medium", "high"] as Priority[]).map((p) => (
                            <button
                              type="button"
                              key={p}
                              onClick={() =>
                                setNewPriorityByCol((s) => ({ ...s, [col.id]: p }))
                              }
                              className={
                                "px-3 py-1 text-xs font-medium " +
                                (selectedPrio === p
                                  ? priorityChip(p)
                                  : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")
                              }
                              title={priorityLabel(p)}
                            >
                              {priorityLabel(p)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </form>

                    {/* List task */}
                    {tasksByCol(col.id).map((t, index) => {
                      const prio = priorityByTask[t.id] ?? "medium";
                      return (
                        <Draggable draggableId={t.id} index={index} key={t.id}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={`${taskCardClasses(status, snap.isDragging)} glow-card ${tone}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0 text-sm">
                                  <InlineEditableTitle
                                    title={t.title}
                                    onSave={(title) =>
                                      mUpdate.mutate({ taskId: t.id, title })
                                    }
                                  />
                                </div>

                                {/* Badge priority — klik untuk toggle */}
                                <button
                                  type="button"
                                  onClick={() => setTaskPriority(t.id, nextPriority(prio))}
                                  className={
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs " +
                                    priorityChip(prio)
                                  }
                                  title={`Klik untuk ubah priority (${priorityLabel(prio)})`}
                                >
                                  {priorityLabel(prio)}
                                </button>

                                <button
                                  onClick={() => mDelete.mutate(t.id)}
                                  className="rounded-md p-1 text-slate-600 hover:bg-slate-100 hover:text-red-600 dark:text-slate-300 dark:hover:bg-slate-800"
                                  title="Hapus task"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                );
              }}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

function InlineEditableTitle({
  title,
  onSave,
}: {
  title: string;
  onSave: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(title);

  return editing ? (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const next = val.trim();
        if (!next || next === title) {
          setEditing(false);
          return;
        }
        onSave(next);
        setEditing(false);
      }}
      className="flex items-center gap-2"
    >
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-400/40"
      />
      <button
        type="submit"
        className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
      >
        Save
      </button>
      <button
        type="button"
        className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        onClick={() => {
          setVal(title);
          setEditing(false);
        }}
      >
        Cancel
      </button>
    </form>
  ) : (
    <button
      onClick={() => setEditing(true)}
      className="group inline-flex max-w-full items-center gap-2"
      title="Edit judul"
    >
      <span className="truncate">{title}</span>
      <Pencil className="size-3.5 text-slate-400 opacity-0 group-hover:opacity-100 dark:text-slate-500" />
    </button>
  );
}

export default BoardPage;
