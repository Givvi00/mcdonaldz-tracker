/** null: all. true: visited (verified or not). false: still to visit. 'verified': visited and verified */
export type StatusValue = boolean | 'verified' | null;

/** Whether a restaurant (through its visit, if any) passes the filter */
export function matchesStatus(value: StatusValue, visit: { verified?: boolean } | undefined): boolean {
  if (value === null) return true;
  if (value === 'verified') return !!visit?.verified;
  return value === !!visit;
}

const OPTIONS: Array<{ value: StatusValue; label: string; dot: string; active: string }> = [
  { value: null, label: 'Tutti', dot: 'bg-gray-400', active: 'bg-gray-800 dark:bg-gray-600 text-white' },
  { value: false, label: 'Da visitare', dot: 'bg-mc-red', active: 'bg-mc-red text-white' },
  { value: true, label: 'Visitati', dot: 'bg-green-500', active: 'bg-green-600 text-white' },
  { value: 'verified', label: 'Verificati', dot: 'bg-blue-500', active: 'bg-blue-600 text-white' },
];

interface Props {
  value: StatusValue;
  onChange: (value: StatusValue) => void;
  className?: string;
}

/** Tutti / Da visitare / Visitati / Verificati, each with its own colour (grey / red / green / blue). */
export function StatusFilter({ value, onChange, className = '' }: Props) {
  return (
    <div className={`flex gap-0.5 p-1 rounded-2xl bg-gray-100 dark:bg-gray-800 ${className}`}>
      {OPTIONS.map(({ value: optionValue, label, dot, active }) => {
        const selected = value === optionValue;
        return (
          <button
            key={label}
            onClick={() => onChange(optionValue)}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1 px-1 py-1.5 rounded-xl text-[0.8rem] font-semibold whitespace-nowrap transition-all ${
              selected ? `${active} shadow-sm` : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <span className={`w-2 h-2 flex-shrink-0 rounded-full ${selected ? 'bg-white' : dot}`} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
