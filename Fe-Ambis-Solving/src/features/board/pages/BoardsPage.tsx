import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Trash2, Users, Calendar } from 'lucide-react';
import { getBoards, createBoard, deleteBoard, type Board } from '../../../shared/services/api';
import { Modal } from '../../../shared/components/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createBoardSchema = z.object({
  name: z.string().min(1, 'Nama board wajib diisi'),
  description: z.string().optional(),
});

type CreateBoardForm = z.infer<typeof createBoardSchema>;

export function BoardsPage() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const qc = useQueryClient();

  const { data: boardsData, isLoading, error } = useQuery({
    queryKey: ['boards'],
    queryFn: getBoards,
  });
  const boards = boardsData || [];

  const createMutation = useMutation({
    mutationFn: createBoard,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boards'] });
      setIsCreateModalOpen(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBoard,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateBoardForm>({
    resolver: zodResolver(createBoardSchema),
  });

  const onCreateSubmit = (data: CreateBoardForm) => {
    const defaultColumns = [
      { id: 'todo', name: 'To Do', order: 0 },
      { id: 'in-progress', name: 'In Progress', order: 1 },
      { id: 'done', name: 'Done', order: 2 },
    ];

    createMutation.mutate({
      name: data.name,
      description: data.description,
      columns: defaultColumns,
      members: [],
    });
  };

  const handleDelete = (boardId: string, boardName: string) => {
    if (confirm(`Hapus board "${boardName}"?`)) {
      deleteMutation.mutate(boardId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">Memuat boards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-red-500">Gagal memuat boards</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Boards</h1>
          <p className="text-gray-600 mt-1">Kelola proyek dan tugas Anda</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Buat Board Baru
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users size={64} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada board</h3>
          <p className="text-gray-500 mb-6">Buat board pertama Anda untuk mulai mengorganisir tugas</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            Buat Board Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board: Board) => (
            <div
              key={board.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <button
                    onClick={() => navigate({ to: '/board/$boardId' as any, params: { boardId: board.id } as any })}
                    className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors text-left"
                  >
                    {board.name}
                  </button>
                  {board.description && (
                    <p className="text-gray-600 text-sm mt-1">{board.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(board.id, board.name)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                  title="Hapus board"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>{board.members.length} member</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>{new Date(board.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => navigate({ to: '/board/$boardId' as any, params: { boardId: board.id } as any })}
                  className="w-full inline-flex justify-center items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Buka Board
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Board Baru"
      >
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <div>
            <label htmlFor="board-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Board
            </label>
            <input
              id="board-name"
              type="text"
              {...register('name')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan nama board"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="board-description" className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi (Opsional)
            </label>
            <textarea
              id="board-description"
              rows={3}
              {...register('description')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Deskripsikan board ini"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
            >
              {createMutation.isPending ? 'Membuat...' : 'Buat Board'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default BoardsPage;