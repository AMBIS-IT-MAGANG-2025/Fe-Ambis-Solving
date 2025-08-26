import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { OnDragEndResponder } from '@hello-pangea/dnd'; // <-- FIX 2: Gunakan 'import type'
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getBoard, createTask, deleteTask, moveTask, updateTask } from '../../services/api';
import { Modal } from '../../../shared/components/Modal';
import type { Column, Task } from '../store/boardStore';

const taskSchema = z.object({
  content: z.string().min(3, { message: 'Konten tugas minimal 3 karakter' }),
});
type TaskFormInputs = z.infer<typeof taskSchema>;


export function BoardPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetColumn, setTargetColumn] = useState<Column['id'] | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TaskFormInputs>({
    resolver: zodResolver(taskSchema),
  });

  const { data: boardData, isLoading, isError } = useQuery({
    queryKey: ['board'],
    queryFn: getBoard,
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board'] }),
  });

  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board'] }),
  });

   const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board'] }),
  });

  const moveTaskMutation = useMutation({
    mutationFn: moveTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board'] }),
  });

  const handleDragEnd: OnDragEndResponder = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }
    
    // Panggil mutasi dengan object yang benar
    moveTaskMutation.mutate({
      taskId: draggableId,
      sourceColumnId: source.droppableId,
      destColumnId: destination.droppableId,
      newIndex: destination.index,
    });
  };

  const handleFormSubmit = (data: TaskFormInputs) => {
    if (editingTask) {
      // FIX 1: Panggil mutasi update dengan object yang benar
      updateTaskMutation.mutate({ taskId: editingTask.id, content: data.content });
    } else if (targetColumn) {
      createTaskMutation.mutate({ content: data.content, columnId: targetColumn });
    }
    setIsModalOpen(false);
  };
  
  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleOpenCreateModal = (columnId: Column['id']) => {
    setEditingTask(null);
    setTargetColumn(columnId);
    reset({ content: '' });
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setTargetColumn(null);
    reset({ content: task.content });
    setIsModalOpen(true);
  };

  if (isLoading) return <div className="p-8 text-center">Loading papan kerja...</div>;
  if (isError) return <div className="p-8 text-center text-red-600">Terjadi error saat memuat data. Pastikan server backend sudah berjalan.</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Project Task Manager</h1>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {boardData?.map((column) => (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col p-4 bg-gray-100 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-700">{column.title}</h2>
                    <button onClick={() => handleOpenCreateModal(column.id)} className="p-1 text-gray-500 rounded hover:bg-gray-300 hover:text-gray-700">
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="space-y-4 overflow-y-auto">
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="relative p-4 bg-white rounded-md shadow-sm cursor-pointer group"
                            onClick={() => handleOpenEditModal(task)}
                          >
                            <p className="text-gray-800 break-words">{task.content}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id);
                              }}
                              className="absolute top-2 right-2 p-1 text-gray-400 bg-white rounded-full opacity-0 group-hover:opacity-100 hover:text-red-600"
                            >
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

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Tugas' : 'Buat Tugas Baru'}
      >
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <textarea
            {...register('content')}
            rows={4}
            className={`w-full p-2 border rounded-md ${errors.content ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Masukkan konten tugas..."
          />
          {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
          <div className="flex justify-end gap-4 mt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}