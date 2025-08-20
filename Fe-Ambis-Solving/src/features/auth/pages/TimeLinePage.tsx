import { CheckCircle2, Zap, Hourglass } from 'lucide-react';
import type { ReactNode } from 'react';
import { useBoardStore } from '../store/boardStore'; // <-- IMPORT STORE

// Helper untuk memilih ikon dan warna berdasarkan status/kolom
const statusMap: { [key: string]: { icon: ReactNode; color: string; label: string } } = {
  done: { icon: <CheckCircle2 size={20} />, color: 'bg-green-500', label: 'Selesai' },
  'in-progress': { icon: <Zap size={20} />, color: 'bg-yellow-500', label: 'Dikerjakan' },
  planned: { icon: <Hourglass size={20} />, color: 'bg-gray-400', label: 'Direncanakan' },
};

export function TimeLinePage() {
  // Ambil data langsung dari store!
  const { boardData } = useBoardStore();

  // Ubah data board menjadi flat array untuk timeline
  const allTasks = boardData.flatMap(column => 
    column.tasks.map(task => ({
      ...task,
      status: column.id,
      statusLabel: statusMap[column.id]?.label || 'Lainnya',
    }))
  ).reverse(); // Dibalik agar yang terbaru di atas

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Timeline Tugas</h1>
        <p className="text-gray-500">Semua tugas dari papan Kanban.</p>
      </div>

      <div className="relative pl-8 border-l-2 border-gray-200">
        {allTasks.map((task) => {
          const { icon, color } = statusMap[task.status] || statusMap.planned;
          return (
            <div key={task.id} className="relative pb-8">
              <div className={`absolute left-0 w-8 h-8 -ml-[17px] flex items-center justify-center text-white rounded-full ${color}`}>
                {icon}
              </div>
              <div className="p-4 ml-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <p className="text-sm font-semibold text-gray-500">Status: {task.statusLabel}</p>
                <p className="mt-1 text-gray-800">{task.content}</p>
              </div>
            </div>
          );
        })}
        {allTasks.length === 0 && <p className="ml-4">Belum ada tugas.</p>}
      </div>
    </div>
  );
}