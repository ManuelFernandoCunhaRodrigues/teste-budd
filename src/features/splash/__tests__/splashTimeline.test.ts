import {
  SPLASH_DURATION_MS,
  SPLASH_LINKS,
  SPLASH_NODES,
  SPLASH_PHASES,
  SPLASH_REDUCED_DURATION_MS,
  linkPath,
  nodeDelayFraction,
  phaseProgress,
} from '../splashTimeline';

/**
 * The opening sequence's arithmetic.
 *
 * A timeline fails quietly: a phase that starts before the one feeding it, or a
 * gap where no act owns the frame, looks like a stutter on device and like
 * nothing at all in a diff.
 */

const PHASE_ORDER = ['spark', 'scatter', 'connect', 'converge', 'reveal'] as const;

describe('SPLASH_PHASES', () => {
  it('runs inside the 2.8s to 3.5s the design asks for', () => {
    expect(SPLASH_DURATION_MS).toBeGreaterThanOrEqual(2800);
    expect(SPLASH_DURATION_MS).toBeLessThanOrEqual(3500);
  });

  it('covers the whole sequence with no gap and no overlap', () => {
    expect(SPLASH_PHASES.spark.start).toBe(0);
    expect(SPLASH_PHASES.reveal.end).toBe(1);

    for (let index = 1; index < PHASE_ORDER.length; index += 1) {
      const previous = SPLASH_PHASES[PHASE_ORDER[index - 1]];
      const current = SPLASH_PHASES[PHASE_ORDER[index]];

      // Shared boundary: no frame belongs to both acts or to neither.
      expect(current.start).toBe(previous.end);
    }
  });

  it('gives every phase real time', () => {
    for (const name of PHASE_ORDER) {
      expect(SPLASH_PHASES[name].end).toBeGreaterThan(SPLASH_PHASES[name].start);
    }
  });

  it('keeps the reduced-motion path short', () => {
    expect(SPLASH_REDUCED_DURATION_MS).toBeLessThan(SPLASH_DURATION_MS / 3);
  });
});

describe('phaseProgress', () => {
  const phase = { start: 0.25, end: 0.75 };

  it('reads zero before the phase and one after it', () => {
    expect(phaseProgress(0, phase)).toBe(0);
    expect(phaseProgress(0.25, phase)).toBe(0);
    expect(phaseProgress(0.75, phase)).toBe(1);
    expect(phaseProgress(1, phase)).toBe(1);
  });

  it('maps the middle of a phase to the middle of its range', () => {
    expect(phaseProgress(0.5, phase)).toBeCloseTo(0.5, 5);
  });

  it('never runs backwards or overshoots', () => {
    // Clamping is what stops an act rewinding when the next one takes over.
    for (const overall of [-1, 0, 0.4, 0.9, 2]) {
      const value = phaseProgress(overall, phase);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('survives a zero-length phase instead of dividing by it', () => {
    expect(phaseProgress(0.5, { start: 0.5, end: 0.5 })).toBe(1);
    expect(phaseProgress(0.2, { start: 0.5, end: 0.5 })).toBe(0);
  });
});

describe('the network', () => {
  it('places every node inside the viewBox', () => {
    for (const node of SPLASH_NODES) {
      expect(node.x).toBeGreaterThan(0);
      expect(node.x).toBeLessThan(100);
      expect(node.y).toBeGreaterThan(0);
      expect(node.y).toBeLessThan(100);
    }
  });

  it('is deterministic, so two launches draw the same picture', () => {
    // Random placement was ruled out by the design: it reads as noise and lands
    // differently every time.
    const first = SPLASH_NODES.map((node) => `${node.x},${node.y}`).join('|');
    const second = SPLASH_NODES.map((node) => `${node.x},${node.y}`).join('|');

    expect(first).toBe(second);
    expect(linkPath(0, 1, -12)).toBe(linkPath(0, 1, -12));
  });

  it('only links nodes that exist', () => {
    for (const link of SPLASH_LINKS) {
      expect(SPLASH_NODES[link.from]).toBeDefined();
      expect(SPLASH_NODES[link.to]).toBeDefined();
      expect(link.from).not.toBe(link.to);
    }
  });

  it('builds a curve, not a straight line', () => {
    const path = linkPath(0, 1, -12);

    expect(path.startsWith('M')).toBe(true);
    expect(path).toContain('Q');
  });

  it('returns an empty path for a node that is not there', () => {
    expect(linkPath(0, 99, 10)).toBe('');
  });

  it('staggers the nodes without pushing the last one past its phase', () => {
    const delays = SPLASH_NODES.map((_, index) => nodeDelayFraction(index));

    expect(delays[0]).toBe(0);
    for (let index = 1; index < delays.length; index += 1) {
      expect(delays[index]).toBeGreaterThan(delays[index - 1]);
    }
    // Leaves the last node a third of the phase to appear in.
    expect(delays[delays.length - 1]).toBeLessThan(0.7);
  });
});
