import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Komponen & Store
import { Modal } from '../../../shared/components/Modal';
import { useBoardStore } from '../store/boardStore';
import type {  Column } from '../store/boardStore';
import type { Task } from '../store/boardStore';

// Skema validasi untuk form tugas
const taskSchema = z.object({
  content: z.string().min(3, { message: 'Konten tugas minimal 3 karakter' }),
});
type TaskFormInputs = z.infer<typeof taskSchema>;


export function BoardPage() {
  // 1. Ambil state dan fungsi-fungsi dari global store Zustand
  const { boardData, handleDragEnd, addTask, updateTask, deleteTask } = useBoardStore();
  
  // 2. State yang bersifat lokal untuk komponen ini (mengelola UI modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetColumn, setTargetColumn] = useState<Column['id'] | null>(null);

  // 3. Inisialisasi react-hook-form
  const { register, handleSubmit, formState: { errors }, reset } = useForm<TaskFormInputs>({
    resolver: zodResolver(taskSchema),
  });

  // 4. Handler untuk membuka/menutup modal (logika UI)
  const handleOpenCreateModal = (columnId: Column['id']) => {
    setTargetColumn(columnId);
    setEditingTask(null);
    reset({ content: '' }); // Kosongkan form
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (task: Task, columnId: Column['id']) => {
    setTargetColumn(columnId);
    setEditingTask(task);
    reset({ content: task.content }); // Isi form dengan konten yang ada
    setIsModalOpen(true);
  };

  const handleDeleteTask = (taskId: Task['id'], columnId: Column['id']) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
      deleteTask(columnId, taskId); // Panggil aksi dari store
    }
  };

  // 5. Handler untuk submit form, yang kemudian memanggil aksi dari store
  const handleFormSubmit = (data: TaskFormInputs) => {
    if (editingTask && targetColumn) {
      updateTask(targetColumn, editingTask.id, data.content); // Panggil aksi update dari store
    } else if (targetColumn) {
      addTask(targetColumn, data.content); // Panggil aksi create dari store
    }
    setIsModalOpen(false); // Tutup modal setelah submit
  };

  // 6. Render komponen (JSX)
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Project Task Manager</h1>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {boardData.map((column) => (
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
                            onClick={() => handleOpenEditModal(task, column.id)}
                          >
                            <p className="text-gray-800 break-words">{task.content}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id, column.id);
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