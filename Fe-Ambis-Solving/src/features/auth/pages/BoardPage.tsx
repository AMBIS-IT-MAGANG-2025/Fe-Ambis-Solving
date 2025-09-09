// src/features/auth/pages/BoardPage.tsx
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type OnDragEndResponder } from "@hello-pangea/dnd";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getBoard, getBoardTasks, createTask, deleteTask, moveTask, updateTask,
  type Board, type Task
} from "../../services/api"; // <- path relatif dari file ini

const schema = z.object({ title: z.string().min(3, "Judul minimal 3 karakter") });
type FormInputs = z.infer<typeof schema>;

export function BoardPage() { // <-- NAMED EXPORT
  const { id: boardId } = useParams();
  const qc = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetColumn, setTargetColumn] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormInputs>({ resolver: zodResolver(schema) });

  const { data: board, isLoading: lb, error: eb } = useQuery<Board>({
    queryKey: ["board", boardId],
    queryFn: () => getBoard(boardId!),
    enabled: !!boardId,
  });
  const { data: tasks = [], isLoading: lt, error: et } = useQuery<Task[]>({
    queryKey: ["tasks", boardId],
    queryFn: () => getBoardTasks(boardId!),
    enabled: !!boardId,
  });

  const mCreate = useMutation({
    mutationFn: (p: { title: string; columnId: string }) => createTask({ boardId: boardId!, ...p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", boardId] }),
  });
  const mUpdate = useMutation({
    mutationFn: (p: { taskId: string; title: string }) => updateTask(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", boardId] }),
  });
  const mDelete = useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", boardId] }),
  });
  const mMove = useMutation({
    mutationFn: (p: { taskId: string; toColumnId: string; toPosition: number }) => moveTask(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", boardId] }),
  });

  const onDragEnd: OnDragEndResponder = (r) => {
    const { source, destination, draggableId } = r;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    mMove.mutate({ taskId: draggableId, toColumnId: destination.droppableId, toPosition: destination.index + 1 });
  };

  const tasksByCol: Record<string, Task[]> = useMemo(() => {
    const map: Record<string, Task[]> = {};
    (board?.columns ?? []).forEach((c) => (map[c.id] = []));
    (tasks ?? []).forEach((t) => { (map[t.columnId] ||= []).push(t); });
    Object.keys(map).forEach((k) => map[k].sort((a,b)=>(a.order??0)-(b.order??0)));
    return map;
  }, [board, tasks]);

  const submit = (data: FormInputs) => {
    if (editingTask) mUpdate.mutate({ taskId: editingTask.id, title: data.title });
    else if (targetColumn) mCreate.mutate({ title: data.title, columnId: targetColumn });
    setIsModalOpen(false);
  };

  const openCreate = (colId: string) => { setEditingTask(null); setTargetColumn(colId); reset({ title: "" }); setIsModalOpen(true); };
  const openEdit   = (t: Task) => { setEditingTask(t); setTargetColumn(null); reset({ title: t.title }); setIsModalOpen(true); };
  const del        = (id: string) => { if (confirm("Hapus task ini?")) mDelete.mutate(id); };

  if (lb || lt) return <div className="p-8 text-center">Memuat papan…</div>;
  if (eb || et) return <div className="p-8 text-center text-red-600">Gagal memuat data.</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{board?.name ?? "Board"}</h1>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {(board?.columns ?? []).sort((a,b)=>(a.order??0)-(b.order??0)).map((col) => (
            <Droppable key={col.id} droppableId={col.id}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col p-4 bg-gray-100 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-700">{col.name}</h2>
                    <button onClick={() => openCreate(col.id)} className="p-1 text-gray-500 rounded hover:bg-gray-300 hover:text-gray-700">
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="space-y-4 overflow-y-auto">
                    {(tasksByCol[col.id] ?? []).map((t, i) => (
                      <Draggable key={t.id} draggableId={t.id} index={i}>
                        {(prov) => (
                          <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                               className="relative p-4 bg-white rounded-md shadow-sm cursor-pointer group"
                               onClick={() => openEdit(t)}>
                            <p className="text-gray-800 break-words">{t.title}</p>
                            <button onClick={(e)=>{e.stopPropagation(); del(t.id);}}
                                    className="absolute top-2 right-2 p-1 text-gray-400 bg-white rounded-full opacity-0 group-hover:opacity-100 hover:text-red-600">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
      {/* modal kamu tetap di sini */}
    </div>
  );
}

// optional default export agar import default juga jalan:
export default BoardPage;
