interface ProgressProps {
  value: number;
  max: number;
  className?: string;
}

export function ProgressBar({ value, max, className = '' }: ProgressProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = pct < 75 ? 'bg-primary' : pct <= 90 ? 'bg-warning' : 'bg-expense';

  return (
    <div className={`w-full h-2.5 bg-secondary rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full ${color} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
