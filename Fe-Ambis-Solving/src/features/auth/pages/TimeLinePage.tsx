import { CheckCircle2, Zap, Hourglass, MessageSquare } from 'lucide-react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBoardStore } from '../store/boardStore';
import { formatRelative } from 'date-fns';
import { id } from 'date-fns/locale';

// Skema validasi untuk form catatan
const noteSchema = z.object({
  content: z.string().min(3, { message: 'Catatan minimal 3 karakter' }),
});
type NoteFormInputs = z.infer<typeof noteSchema>;

// Helper untuk memilih ikon dan warna berdasarkan status/kolom
const statusMap: { [key: string]: { icon: ReactNode; color: string; label: string } } = {
  done: { icon: <CheckCircle2 size={20} />, color: 'bg-green-500', label: 'Selesai' },
  'in-progress': { icon: <Zap size={20} />, color: 'bg-yellow-500', label: 'Dikerjakan' },
  planned: { icon: <Hourglass size={20} />, color: 'bg-gray-400', label: 'Direncanakan' },
};

export function TimeLinePage() {
  // Ambil semua data yang dibutuhkan dari store
  const { boardData, notes, addNote } = useBoardStore();

   const { register, handleSubmit, formState: { errors }, reset } = useForm<NoteFormInputs>({
    resolver: zodResolver(noteSchema),
  });

  const handleNoteSubmit = (data: NoteFormInputs) => {
    addNote(data.content);
    reset();
  };
  // Ubah data board menjadi flat array untuk timeline
 const formattedTasks = boardData.flatMap(column =>
    column.tasks.map(task => ({
      type: 'task' as const,
      id: task.id,
      content: task.content,
      timestamp: new Date(), // Kita gunakan waktu sekarang sebagai placeholder
      status: column.id,
    })));

  const formattedNotes = notes.map(note => ({
    type: 'note' as const,
    id: note.id,
    content: note.content,
    timestamp: note.timestamp,
  }));

  const timelineItems = [...formattedTasks, ...formattedNotes].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Timeline Aktivitas</h1>
        <p className="text-gray-500">Histori pekerjaan tim dan catatan penting.</p>
      </div>

      {/* Form untuk menambah catatan baru */}
      <div className="p-4 mb-8 bg-white border rounded-lg">
        <form onSubmit={handleSubmit(handleNoteSubmit)} className="space-y-4">
          <textarea
            {...register('content')}
            rows={3}
            className={`w-full p-2 border rounded-md ${errors.content ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Tulis catatan atau update penting di sini..."
          />
          {errors.content && <p className="text-sm text-red-600">{errors.content.message}</p>}
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
              Simpan Catatan
            </button>
          </div>
        </form>
      </div>

      <div className="relative pl-8 border-l-2 border-gray-200">
        {/* 3. Render dari array gabungan */}
        {timelineItems.map((item) => {
          if (item.type === 'task') {
            const { icon, color } = statusMap[item.status] || statusMap.planned;
            return (
              <div key={item.id} className="relative pb-8">
                <div className={`absolute left-0 w-8 h-8 -ml-[17px] flex items-center justify-center text-white rounded-full ${color}`}>
                  {icon}
                </div>
                <div className="p-4 ml-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <p className="text-sm font-semibold text-gray-500">Tugas dipindahkan ke "{statusMap[item.status]?.label}"</p>
                  <p className="mt-1 text-gray-800">{item.content}</p>
                </div>
              </div>
            );
          }
          if (item.type === 'note') {
            return (
              <div key={item.id} className="relative pb-8">
                <div className="absolute left-0 w-8 h-8 -ml-[17px] flex items-center justify-center text-white rounded-full bg-blue-500">
                  <MessageSquare size={20} />
                </div>
                <div className="p-4 ml-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500">
                    Catatan ditambahkan - {formatRelative(item.timestamp, new Date(), { locale: id })}
                  </p>
                  <p className="mt-1 text-gray-800 italic">"{item.content}"</p>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}