export interface MonthlyContributionInput {
  targetAmount: number;
  currentAmount: number;
  months: number;
  annualReturnPct: number;
}

/**
 * Required monthly savings (Future Value of Annuity).
 * r > 0: PMT = (target - current) * r / ((1 + r)^n - 1), r = annual/100/12
 * r = 0: PMT = (target - current) / n
 * Returns 0 when target is already met or months <= 0.
 */
export function calculateMonthlyContribution({
  targetAmount,
  currentAmount,
  months,
  annualReturnPct,
}: MonthlyContributionInput): number {
  const remaining = targetAmount - currentAmount;
  if (remaining <= 0 || months <= 0) return 0;
  const r = annualReturnPct / 100 / 12;
  if (r <= 0) return Math.ceil(remaining / months);
  return Math.ceil((remaining * r) / (Math.pow(1 + r, months) - 1));
}

/** Whole calendar months between two dates, rounded up (min 0). */
export function monthsBetween(from: Date, targetDate: Date): number {
  const f = new Date(from.getFullYear(), from.getMonth(), 1);
  const t = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  const diff = (t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  return Math.max(0, Math.ceil(diff));
}

export function durationLabel(months: number): string {
  if (months <= 0) return '0 Bulan';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} Tahun`);
  if (rest > 0) parts.push(`${rest} Bulan`);
  return `${parts.join(' ')} (${months} Bulan)`;
}

// DEV self-checks use exact closed forms (no float drift):
// 1) r_monthly = 1 (annual 1200%), n = 2 => (1+1)^2 - 1 = 3 => PMT = remaining / 3 = 50_000_000
// 2) r = 0 => PMT = remaining / n = 30_000_000
if (import.meta.env.DEV) {
  const case1 = calculateMonthlyContribution({ targetAmount: 150_000_000, currentAmount: 0, months: 2, annualReturnPct: 1200 });
  if (case1 !== 50_000_000) console.warn(`goalMath self-check 1 failed: expected 50000000, got ${case1}`);
  const case2 = calculateMonthlyContribution({ targetAmount: 150_000_000, currentAmount: 0, months: 5, annualReturnPct: 0 });
  if (case2 !== 30_000_000) console.warn(`goalMath self-check 2 failed: expected 30000000, got ${case2}`);
}
