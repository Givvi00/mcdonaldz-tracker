/** Progress bar filled with golden stripes, with a portion of fries riding at the head of the bar. */
export function FoodProgressBar({ percentage }: { percentage: number }) {
  const pct = Math.min(100, Math.max(0, percentage));
  return (
    <div
      className="relative mt-3 h-3 rounded-full bg-white/25"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-3 rounded-full transition-all"
        style={{
          width: `${pct}%`,
          backgroundImage: 'repeating-linear-gradient(45deg, #FFC72C 0 6px, #F2AE00 6px 12px)',
        }}
      />
      <span
        aria-hidden="true"
        className="absolute top-1/2 text-lg leading-none drop-shadow transition-all"
        style={{ left: `clamp(0.7rem, ${pct}%, calc(100% - 0.7rem))`, transform: 'translate(-50%, -50%) rotate(12deg)' }}
      >
        🍟
      </span>
    </div>
  );
}
