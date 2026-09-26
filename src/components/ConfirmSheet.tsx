interface Props {
  title: string;
  subtitle?: string;
  body: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Drawn left of the title (a seal, an icon) */
  icon?: React.ReactNode;
}

/** The app's own "are you sure?" sheet, used instead of the browser's confirm() everywhere */
export function ConfirmSheet({ title, subtitle, body, confirmLabel, onConfirm, onCancel, icon }: Props) {
  return (
    <div className="fixed inset-0 z-[2100] flex items-end justify-center bg-black/40" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg rounded-t-3xl border-t border-gray-200 bg-white px-5 pb-6 pt-5 shadow-2xl animate-[toast-in_0.25s_ease-out] dark:border-gray-800 dark:bg-gray-900"
        style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          {icon}
          <div className="min-w-0">
            <h3 className="font-display font-bold text-gray-800 dark:text-gray-100">{title}</h3>
            {subtitle && <p className="truncate text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">{body}</div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 active:scale-[0.98] dark:bg-gray-800 dark:text-gray-200"
          >
            Annulla
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-mc-red py-3 text-sm font-bold text-white shadow-sm active:scale-[0.98]">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
