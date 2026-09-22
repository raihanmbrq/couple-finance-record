import React from 'react';
import { formatMoneyInput } from '@/lib/format';

interface MoneyInputProps {
  /** Current *formatted* value (e.g. `50.000.000`); `''` means empty. */
  value: string;
  /** Emits the formatted value — read it back with `parseMoneyInput`. */
  onChange: (formatted: string) => void;
  /** Drives the thousand-separator locale. */
  currency?: string;
  label?: string;
  hint?: string;
  placeholder?: string;
  testId?: string;
  /** `sm` = compact dashboard tools, `lg` = dialog money fields. */
  size?: 'sm' | 'lg';
  className?: string;
  ariaLabel?: string;
}

/**
 * Desktop money field with live thousand separators.
 *
 * Keeps the shared `formatMoneyInput` / `parseMoneyInput` contract: typing is
 * normalised to digits, leading zeros are rejected and no decimals are
 * accepted (consistent with every other money field in the app).
 */
export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  currency = 'IDR',
  label,
  hint,
  placeholder = '0',
  testId,
  size = 'sm',
  className = '',
  ariaLabel,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '').replace(/^0+/, '');
    onChange(digits ? formatMoneyInput(Number.parseInt(digits, 10), currency) : '');
  };

  const sizeClass =
    size === 'lg' ? 'px-3.5 py-2.5 text-lg font-bold' : 'px-3 py-2 text-xs font-bold';

  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>}
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={handleChange}
        onFocus={(event) => event.target.select()}
        placeholder={placeholder}
        data-testid={testId}
        aria-label={ariaLabel ?? label}
        className={`w-full ${sizeClass} bg-surface border border-border rounded-xl text-text-primary tabular-nums focus:outline-none focus:ring-2 focus:ring-accent`}
      />
      {hint && <p className="text-[11px] text-text-muted mt-1">{hint}</p>}
    </div>
  );
};
