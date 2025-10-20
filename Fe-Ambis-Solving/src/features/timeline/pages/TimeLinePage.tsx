import { CheckCircle2, Zap, Hourglass, MessageSquare, Tag } from 'lucide-react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBoardStore } from '../../../shared/store/boardStore';
import { formatRelative, startOfDay, compareDesc } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const noteSchema = z.object({ content: z.string().min(3, { message: 'Catatan minimal 3 karakter' }) });
type NoteFormInputs = z.infer<typeof noteSchema>;

const statusMap: Record<string, { icon: ReactNode; color: string; label: string }> = {
  done: { icon: <CheckCircle2 size={18} />, color: 'bg-emerald-500', label: 'Selesai' },
  'in-progress': { icon: <Zap size={18} />, color: 'bg-amber-500', label: 'Dikerjakan' },
  planned: { icon: <Hourglass size={18} />, color: 'bg-slate-400', label: 'Direncanakan' },
  todo: { icon: <Hourglass size={18} />, color: 'bg-slate-400', label: 'Direncanakan' }, // alias
};

function groupByDay<T extends { timestamp: Date }>(items: T[]) {
  const map = new Map<number, T[]>();
  for (const it of items) {
    const key = startOfDay(it.timestamp).getTime();
    const arr = map.get(key) ?? [];
    arr.push(it);
    map.set(key, arr);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([key, arr]) => ({ day: new Date(key), items: arr.sort((a, b) => compareDesc(a.timestamp, b.timestamp)) }));
}

export function TimeLinePage() {
  const { notes, addNote, events, taskTitles, taskLabels } = useBoardStore();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<NoteFormInputs>({
    resolver: zodResolver(noteSchema),
  });

  const handleNoteSubmit = (data: NoteFormInputs) => { addNote(data.content); reset(); };

  // Ubah events -> item tampil
  const eventItems = (events ?? []).map((e) => {
    const title = (e as any).title ?? taskTitles[e.taskId]; // judul task bila ada
    const statusKey = (e as any).toColumnId ?? 'planned';
    const status = statusMap[statusKey] ?? statusMap.planned;

    if (e.type === 'task_created') {
      return {
        type: 'task' as const,
        id: e.id,
        header: 'Tugas dibuat',
        content: title ?? `Task #${e.taskId}`,
        statusKey,
        timestamp: new Date(e.timestamp),
        labels: taskLabels[e.taskId] ?? [],
      };
    }
    if (e.type === 'task_updated') {
      return {
        type: 'task' as const,
        id: e.id,
        header: 'Tugas diperbarui',
        content: title ?? `Task #${e.taskId}`,
        statusKey,
        timestamp: new Date(e.timestamp),
        labels: taskLabels[e.taskId] ?? [],
      };
    }
    if (e.type === 'task_moved') {
      return {
        type: 'task' as const,
        id: e.id,
        header: 'Tugas dipindahkan',
        content: (title ?? `Task #${e.taskId}`) + ` dipindah ke "${(statusMap[statusKey]?.label || statusKey)}"`,
        statusKey,
        timestamp: new Date(e.timestamp),
        labels: taskLabels[e.taskId] ?? [],
      };
    }
    return {
      type: 'task' as const,
      id: e.id,
      header: 'Tugas dihapus',
      content: title ?? `Task #${e.taskId} dihapus`,
      statusKey,
      timestamp: new Date(e.timestamp),
      labels: taskLabels[e.taskId] ?? [],
    };
  });

  const noteItems = (notes ?? []).map((n) => ({
    type: 'note' as const,
    id: n.id,
    content: n.content,
    timestamp: new Date(n.timestamp),
  }));

  const items = [...eventItems, ...noteItems].sort((a, b) => compareDesc(a.timestamp, b.timestamp));
  const grouped = groupByDay(items as any);

  return (
    <div className="text-slate-900 dark:text-slate-100">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Timeline Aktivitas</h1>
        <p className="text-slate-600 dark:text-slate-300">Histori pekerjaan tim dan catatan penting.</p>
      </div>

      {/* Form catatan */}
      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSubmit(handleNoteSubmit)} className="space-y-4">
          <textarea
            {...register('content')}
            rows={3}
            className={`w-full rounded-md border px-3 py-2 shadow-sm outline-none
              ${errors.content ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}
              bg-white text-slate-900 placeholder:text-slate-400
              dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500
              focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/40`}
            placeholder="Tulis catatan atau update penting di sini..."
          />
          {errors.content && <p className="text-sm text-red-600">{errors.content.message}</p>}
          <div className="flex justify-end">
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
              Simpan Catatan
            </button>
          </div>
        </form>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-slate-200 dark:bg-slate-800" />
        <div className="pl-8">
          {grouped.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Belum ada aktivitas.
            </div>
          )}

          {grouped.map(({ day, items }) => (
            <section key={day.toISOString()} className="pb-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {day.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
              </h3>

              {items.map((it: any) => {
                if (it.type === 'task') {
                  const meta = statusMap[it.statusKey] ?? statusMap.planned;
                  return (
                    <article key={it.id} className="relative pb-4">
                      <div className={`absolute left-[-3px] top-2 h-6 w-6 rounded-full ${meta.color} ring-2 ring-white dark:ring-slate-900`} />
                      <div className="ml-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {it.header} • {formatRelative(it.timestamp, new Date(), { locale: idLocale })}
                        </p>
                        <p className="mt-1">{it.content}</p>
                        {it.labels?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {it.labels.map((lab: string) => (
                              <span key={lab} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                <Tag className="size-3" /> {lab}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                }

                // note
                return (
                  <article key={it.id} className="relative pb-4">
                    <div className="absolute left-[-3px] top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white ring-2 ring-white dark:ring-slate-900">
                      <MessageSquare size={16} />
                    </div>
                    <div className="ml-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Catatan ditambahkan • {formatRelative(it.timestamp, new Date(), { locale: idLocale })}
                      </p>
                      <p className="mt-1 italic">"{it.content}"</p>
                    </div>
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TimeLinePage;
