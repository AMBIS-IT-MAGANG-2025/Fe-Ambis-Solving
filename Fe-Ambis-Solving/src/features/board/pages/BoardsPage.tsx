import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Users, Calendar } from 'lucide-react';
import { getBoards, createBoard, deleteBoard, type Board } from '../../../shared/services/api';
import { Modal } from '../../../shared/components/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from '@tanstack/react-router';

const createBoardSchema = z.object({
  name: z.string().min(1, 'Nama board wajib diisi'),
  description: z.string().optional(),
});

type CreateBoardForm = z.infer<typeof createBoardSchema>;

export function BoardsPage() {
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
      { id: 'todo',         name: 'To Do',       order: 0 },
      { id: 'in-progress',  name: 'In Progress', order: 1 },
      { id: 'done',         name: 'Done',        order: 2 },
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
      <div className="flex items-center justify-center min-h-64 text-slate-500 dark:text-slate-300">
        Memuat boards...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64 text-red-600">
        Gagal memuat boards
      </div>
    );
  }

  return (
    <div className="text-slate-900 dark:text-slate-100">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Boards</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">Kelola proyek dan tugas Anda</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={20} />
          Buat Board Baru
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-slate-400 dark:text-slate-500">
            <Users size={64} className="mx-auto" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-100">Belum ada board</h3>
          <p className="mb-6 text-slate-500 dark:text-slate-300">
            Buat board pertama Anda untuk mulai mengorganisir tugas
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={20} />
            Buat Board Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {boards.map((board: Board) => (
            <div
              key={board.id}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md
                         dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  {/* Judul sebagai link ke /boards/<id> */}
                  <Link to={`/boards/${board.id}` as any}>
                    <span className="cursor-pointer text-lg font-semibold text-slate-900 transition-colors hover:text-blue-600 dark:text-slate-100">
                      {board.name}
                    </span>
                  </Link>

                  {board.description && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{board.description}</p>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(board.id, board.name)}
                  className="p-1 text-slate-400 transition-colors hover:text-red-600 dark:text-slate-500"
                  title="Hapus board"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>
                    {Array.isArray(board.members) ? board.members.length : board.members} member
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>{new Date(board.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              <div className="mt-4">
                <Link to={`/boards/${board.id}` as any}>
                  <button
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 transition
                               hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Buka Board
                  </button>
                </Link>
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
            <label
              htmlFor="board-name"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Nama Board
            </label>
            <input
              id="board-name"
              type="text"
              {...register('name')}
              className={`w-full rounded-md border px-3 py-2 shadow-sm outline-none
                          ${errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}
                          bg-white text-slate-900 placeholder:text-slate-400
                          dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500
                          focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/40`}
              placeholder="Masukkan nama board"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="board-description"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Deskripsi (Opsional)
            </label>
            <textarea
              id="board-description"
              rows={3}
              {...register('description')}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 shadow-sm
                         placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900
                         dark:text-slate-100 dark:placeholder:text-slate-500
                         focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/40"
              placeholder="Deskripsikan board ini"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-md bg-slate-100 px-4 py-2 text-slate-700 transition-colors hover:bg-slate-200
                         dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
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
