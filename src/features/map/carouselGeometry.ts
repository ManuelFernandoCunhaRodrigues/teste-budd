/**
 * Pure geometry for the map's snap carousel.
 *
 * Extracted from `MapScreen` for the same reason `tabBarGeometry` was extracted
 * from the tab bar: the map cannot be rendered under Jest without mocking
 * `react-native-maps`, and this arithmetic is where selection actually goes
 * wrong — an off-by-one here points the camera at the wrong venue.
 *
 * Both directions share one step, so a card the user scrolled to and a card the
 * code scrolled to cannot disagree about where it sits.
 */

/** Distance from one card's left edge to the next. */
export function carouselStep(cardWidth: number, gap: number): number {
  const step = cardWidth + gap;
  return Number.isFinite(step) && step > 0 ? step : 0;
}

/**
 * Scroll offset that brings `index` into the snap position.
 *
 * The carousel pads its content by half the leftover width, so card `index`
 * lands centred when the offset is a plain multiple of the step — the padding
 * cancels out and must not be added here.
 */
export function carouselOffsetFor(index: number, cardWidth: number, gap: number): number {
  const step = carouselStep(cardWidth, gap);
  if (step === 0 || !Number.isFinite(index)) return 0;

  return Math.max(0, index) * step;
}

/**
 * Index the carousel has settled on for a given scroll offset.
 *
 * Clamped rather than trusted: momentum can overshoot past the last card, and
 * an out-of-range index would read `undefined` off the places array.
 */
export function carouselIndexAt(
  offsetX: number,
  cardWidth: number,
  gap: number,
  count: number,
): number {
  if (count <= 0) return 0;

  const step = carouselStep(cardWidth, gap);
  if (step === 0 || !Number.isFinite(offsetX)) return 0;

  return Math.max(0, Math.min(count - 1, Math.round(offsetX / step)));
}
