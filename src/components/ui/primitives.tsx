// The shared pieces of the redesign (DESIGN.md, "Forme, spazi, tocco" and "Componenti ricorrenti"): one look for
// buttons, chips, segmented controls, cards and progress bars, so every screen is built from the same parts.
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { size?: 'md' | 'lg' };

/**
 * The main gesture of a screen, and only one per screen: yellow, standing on a solid darker edge that it sinks
 * into when pressed. md is 44px (inside cards), lg 56px (the screen's main action).
 */
export function PrimaryButton({ size = 'lg', className = '', children, ...rest }: ButtonProps) {
  const height = size === 'lg' ? 'min-h-[56px] text-base' : 'min-h-[44px] text-[15px]';
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-btn bg-mz-yellow px-5 font-bold text-mz-on-yellow transition-[transform,box-shadow] duration-75 disabled:opacity-40 ${
        size === 'lg' ? 'shadow-press active:translate-y-1 active:shadow-press-down' : 'active:scale-[0.97]'
      } ${height} ${className}`}
    >
      {children}
    </button>
  );
}

/** Everything else that is a button: dark surface with a thin border */
export function SecondaryButton({ size = 'lg', className = '', children, ...rest }: ButtonProps) {
  const height = size === 'lg' ? 'min-h-[52px] text-base' : 'min-h-[44px] text-[15px]';
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-btn border border-mz-line bg-mz-surface px-5 font-bold text-mz-text transition-transform active:scale-[0.97] disabled:opacity-40 ${height} ${className}`}
    >
      {children}
    </button>
  );
}

/** A small rounded label: distance, date, vote */
export function Chip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-mz-surface-2 px-2.5 py-1 text-[13px] font-bold text-mz-text ${className}`}>
      {children}
    </span>
  );
}

export interface SegmentOption<T> {
  value: T;
  label: string;
  /** A coloured dot before the label (the status filters) */
  dot?: string;
}

/** One choice among a few: a surface track with the chosen one lifted. Scrolls sideways when the options do not fit */
export function Segmented<T>({
  options,
  value,
  onChange,
  label,
  stretch = false,
  className = '',
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** What the choice is about, for screen readers */
  label: string;
  /** Options share the width equally instead of keeping their own size */
  stretch?: boolean;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex gap-1 overflow-x-auto rounded-[18px] border border-mz-line bg-mz-surface p-1 [scrollbar-width:none] ${className}`}
    >
      {options.map(o => {
        const selected = o.value === value;
        return (
          <button
            key={o.label}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-[14px] px-4 text-sm font-bold transition-colors ${
              stretch ? 'flex-1' : 'flex-none'
            } ${selected ? 'bg-mz-active text-mz-text' : 'text-mz-muted'}`}
          >
            {o.dot && <span className="h-2 w-2 flex-none rounded-full" style={{ background: o.dot }} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** A card: surface, thin border, 22px corners. `tone` tints the border by status */
export function Card({
  children,
  tone,
  className = '',
}: {
  children: ReactNode;
  tone?: 'visited' | 'verified' | 'highlight';
  className?: string;
}) {
  const border =
    tone === 'verified' ? 'border-mz-blue/60' : tone === 'visited' ? 'border-mz-green/50' : tone === 'highlight' ? 'border-mz-yellow' : 'border-mz-line';
  return <div className={`rounded-card border bg-mz-surface ${border} ${className}`}>{children}</div>;
}

/**
 * Progress towards a goal (never a share of all 834: it would sit near zero). Yellow on a dark track by default;
 * `fill` changes the colour (red on the road of levels), `track` the background (darker on the red hero).
 */
export function ProgressBar({
  value,
  max,
  label,
  fill = 'bg-mz-yellow',
  track = 'bg-mz-surface-2',
  className = '',
}: {
  value: number;
  max: number;
  label: string;
  fill?: string;
  track?: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={`h-3 overflow-hidden rounded-full ${track} ${className}`}
    >
      <div className={`h-full rounded-full transition-[width] duration-500 ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Small capital label above a group ("IL TUO PROGRESSO", "EMAIL") */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`text-xs font-bold uppercase tracking-[0.14em] ${className}`}>{children}</span>;
}
