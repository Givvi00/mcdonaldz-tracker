/** Empty state: a tray with nothing on it, with a line saying what to do. */
export function EmptyTray({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
      <div className="mx-auto mb-3 w-40 rounded-2xl bg-gradient-to-b from-mc-red to-mc-red-dark p-1.5 shadow-md shadow-red-900/20">
        <div className="flex justify-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-900 py-3">
          {['🥤', '🍟', '🍔'].map(emoji => (
            <span key={emoji} className="text-2xl opacity-25 grayscale">{emoji}</span>
          ))}
        </div>
      </div>
      <p className="text-lg font-display font-semibold text-gray-700 dark:text-gray-300">{title}</p>
      {hint && <p className="text-sm">{hint}</p>}
    </div>
  );
}
