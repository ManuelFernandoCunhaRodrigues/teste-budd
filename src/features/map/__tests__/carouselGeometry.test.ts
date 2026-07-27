import {
  carouselIndexAt,
  carouselOffsetFor,
  carouselStep,
} from '../carouselGeometry';

/**
 * The map carousel's arithmetic.
 *
 * Selection travels in both directions — a pin sets the scroll offset, a scroll
 * sets the camera — so these two functions have to be exact inverses. Anything
 * else points the camera at a venue other than the card on screen.
 */

// A 390pt phone: compact cards are 60% of the width, with a 14pt gap.
const CARD_WIDTH = Math.min(390 * 0.6, 236);
const GAP = 14;
const STEP = CARD_WIDTH + GAP;

describe('carouselStep', () => {
  it('is the card plus its gap', () => {
    expect(carouselStep(CARD_WIDTH, GAP)).toBe(STEP);
  });

  it('reports zero rather than a negative or unusable step', () => {
    expect(carouselStep(0, 0)).toBe(0);
    expect(carouselStep(-100, 12)).toBe(0);
    expect(carouselStep(Number.NaN, 12)).toBe(0);
  });
});

describe('carouselOffsetFor', () => {
  it('places the first card at the start of the content', () => {
    // The container's own padding centres it; adding the padding here too would
    // push the first card a half-screen to the left of where it belongs.
    expect(carouselOffsetFor(0, CARD_WIDTH, GAP)).toBe(0);
  });

  it('advances exactly one step per card', () => {
    expect(carouselOffsetFor(1, CARD_WIDTH, GAP)).toBe(STEP);
    expect(carouselOffsetFor(3, CARD_WIDTH, GAP)).toBe(STEP * 3);
  });

  it('never scrolls backwards past the start', () => {
    expect(carouselOffsetFor(-2, CARD_WIDTH, GAP)).toBe(0);
  });
});

describe('carouselIndexAt', () => {
  it('reads back the index each offset was built from', () => {
    for (let index = 0; index < 5; index += 1) {
      const offset = carouselOffsetFor(index, CARD_WIDTH, GAP);
      expect(carouselIndexAt(offset, CARD_WIDTH, GAP, 5)).toBe(index);
    }
  });

  it('settles on the nearer card when a drag stops between two', () => {
    expect(carouselIndexAt(STEP * 0.49, CARD_WIDTH, GAP, 5)).toBe(0);
    expect(carouselIndexAt(STEP * 0.51, CARD_WIDTH, GAP, 5)).toBe(1);
  });

  it('clamps an overshoot to the last card instead of running off the array', () => {
    // Momentum past the end used to yield an index with no place behind it.
    expect(carouselIndexAt(STEP * 99, CARD_WIDTH, GAP, 4)).toBe(3);
    expect(carouselIndexAt(-STEP, CARD_WIDTH, GAP, 4)).toBe(0);
  });

  it('stays on zero when there is nothing to select', () => {
    expect(carouselIndexAt(STEP * 2, CARD_WIDTH, GAP, 0)).toBe(0);
  });
});
