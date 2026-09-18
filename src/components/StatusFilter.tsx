const OPTIONS: Array<{ value: boolean | null; label: string; dot: string; active: string }> = [
  { value: null, label: 'Tutti', dot: 'bg-gray-400', active: 'bg-gray-800 dark:bg-gray-600 text-white' },
  { value: true, label: 'Visitati', dot: 'bg-green-500', active: 'bg-green-600 text-white' },
  { value: false, label: 'Da visitare', dot: 'bg-mc-red', active: 'bg-mc-red text-white' },
];

interface Props {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  className?: string;
}

/** Tutti / Visitati / Da visitare, each with its own colour (grey / green / red). */
export function StatusFilter({ value, onChange, className = '' }: Props) {
  return (
    <div className={`flex gap-1 p-1 rounded-2xl bg-gray-100 dark:bg-gray-800 ${className}`}>
      {OPTIONS.map(({ value: optionValue, label, dot, active }) => {
        const selected = value === optionValue;
        return (
          <button
            key={label}
            onClick={() => onChange(optionValue)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              selected ? `${active} shadow-sm` : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${selected ? 'bg-white' : dot}`} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
