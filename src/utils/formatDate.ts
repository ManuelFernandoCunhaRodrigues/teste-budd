const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

/**
 * Label for the order-history month stepper, e.g. `"Julho de 2026"`.
 *
 * `offset` is relative to the current month: `-1` is last month, `1` is next.
 */
export function formatMonthLabel(offset: number, from: Date = new Date()): string {
  const date = new Date(from.getFullYear(), from.getMonth() + offset, 1);
  return `${MONTHS_PT[date.getMonth()]} de ${date.getFullYear()}`;
}

/**
 * How far back the month stepper may go.
 *
 * A bound in both directions: the future holds no orders by definition, and an
 * unbounded past lets someone scroll for years through empty months. The stepper
 * used to allow either (M-04).
 */
export const MONTH_OFFSET_RANGE = { min: -24, max: 0 } as const;

/** Clamps a stepper offset into the navigable range. */
export function clampMonthOffset(offset: number): number {
  if (!Number.isFinite(offset)) return 0;

  return Math.min(MONTH_OFFSET_RANGE.max, Math.max(MONTH_OFFSET_RANGE.min, Math.trunc(offset)));
}

export function canGoToPreviousMonth(offset: number): boolean {
  return offset > MONTH_OFFSET_RANGE.min;
}

/** False at the current month — there is no future to browse. */
export function canGoToNextMonth(offset: number): boolean {
  return offset < MONTH_OFFSET_RANGE.max;
}

/** Inclusive bounds of the month an offset refers to, in local time. */
export function monthRange(offset: number, from: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(from.getFullYear(), from.getMonth() + offset, 1, 0, 0, 0, 0);
  // Day 0 of the following month is the last day of this one.
  const end = new Date(from.getFullYear(), from.getMonth() + offset + 1, 0, 23, 59, 59, 999);

  return { start, end };
}

/** Whether an ISO instant falls inside the month an offset refers to. */
export function isWithinMonth(isoDate: string, offset: number, from: Date = new Date()): boolean {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return false;

  const { start, end } = monthRange(offset, from);
  return parsed >= start && parsed <= end;
}

/** Clock label for the status bar, e.g. `"23:27"`. */
export function formatClock(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
