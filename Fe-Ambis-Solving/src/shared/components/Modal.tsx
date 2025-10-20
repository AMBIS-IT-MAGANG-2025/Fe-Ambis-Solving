import { useEffect, type ReactNode } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Esc to close + lock scroll body
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    document.body.classList.add('overflow-hidden');
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Konten Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          mx-4 w-full max-w-lg rounded-xl border border-slate-200 bg-white
          text-slate-900 shadow-xl transition-all
          dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100
        "
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="
              rounded p-1 text-slate-500 transition-colors
              hover:bg-slate-100 hover:text-slate-700
              dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200
            "
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
