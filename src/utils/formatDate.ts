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

/** Clock label for the status bar, e.g. `"23:27"`. */
export function formatClock(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
