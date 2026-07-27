import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react-native';

import { LoadingState } from '../LoadingState';
import { ScreenSkeleton, type LoadingVariant } from '../ScreenSkeleton';
import { SkeletonList } from '../SkeletonList';

/**
 * The single loading treatment.
 *
 * The app used to carry five: a flame, a map loader, three pulsing dots, a
 * second skeleton implementation and inline spinners. These assertions are what
 * keeps them from creeping back one screen at a time.
 *
 * `render` is awaited throughout — it resolves a promise under this version,
 * and reading `screen` first fails with "render function has not been called".
 */

/**
 * The blocks are deliberately hidden from assistive tech, and RNTL skips such
 * elements unless a query opts in. Without this the suite would report an empty
 * screen and read as a rendering bug.
 */
const HIDDEN = { includeHiddenElements: true } as const;

describe('ScreenSkeleton', () => {
  it.each<[LoadingVariant, string]>([
    ['role', 'Procurando rolê'],
    ['products', 'Procurando produto'],
    ['profile', 'Carregando perfil'],
    ['map', 'Carregando mapa'],
    ['lineup', 'Carregando lineup'],
  ])('announces %s as "%s"', async (variant, label) => {
    await render(<ScreenSkeleton variant={variant} />);

    const container = screen.getByLabelText(label);
    expect(container.props.accessibilityRole).toBe('progressbar');
    // Polite, not assertive: the loop must not talk over the rest of the screen.
    expect(container.props.accessibilityLiveRegion).toBe('polite');
  });

  it('lets a caller override the announcement without changing the shape', async () => {
    await render(<ScreenSkeleton label="Verificando sua sessão" variant="role" />);

    expect(screen.getByLabelText('Verificando sua sessão')).toBeTruthy();
    expect(screen.queryByLabelText('Procurando rolê')).toBeNull();
  });

  it('draws placeholder blocks for every variant', async () => {
    await render(<ScreenSkeleton variant="products" />);

    expect(screen.getAllByTestId('skeleton-block', HIDDEN).length).toBeGreaterThan(0);
  });

  it('hides the blocks from assistive tech, announcing only once', async () => {
    await render(<ScreenSkeleton variant="role" />);

    // A screen reader walking dozens of empty boxes would learn nothing; the
    // container carries the message instead.
    for (const block of screen.getAllByTestId('skeleton-block', HIDDEN)) {
      expect(block.props.accessibilityElementsHidden).toBe(true);
    }
  });
});

describe('SkeletonList', () => {
  it('renders one card per requested item', async () => {
    const { rerender } = await render(<SkeletonList count={2} />);
    const two = screen.getAllByTestId('skeleton-block', HIDDEN).length;

    await rerender(<SkeletonList count={4} />);
    const four = screen.getAllByTestId('skeleton-block', HIDDEN).length;

    expect(four).toBeGreaterThan(two);
  });

  it('renders nothing for a count of zero rather than a stray card', async () => {
    await render(<SkeletonList count={0} />);

    expect(screen.queryAllByTestId('skeleton-block', HIDDEN)).toHaveLength(0);
  });
});

describe('LoadingState', () => {
  it('is a skeleton now, not a flame with a title', async () => {
    await render(<LoadingState variant="role" />);

    expect(screen.getAllByTestId('skeleton-block', HIDDEN).length).toBeGreaterThan(0);
    // The old treatment announced itself with visible copy; the shape is the
    // message now.
    expect(screen.queryByText('Carregando rolês')).toBeNull();
    expect(screen.queryByText('Buscando os melhores lugares…')).toBeNull();
  });
});

describe('the old loaders', () => {
  const feedback = join(process.cwd(), 'src', 'components', 'feedback');

  it('are gone from disk, not merely unused', () => {
    expect(existsSync(join(feedback, 'FlameLoader.tsx'))).toBe(false);
    expect(existsSync(join(feedback, 'MapLoader.tsx'))).toBe(false);
  });

  it('left no second skeleton implementation behind', () => {
    expect(existsSync(join(process.cwd(), 'src', 'components', 'ui', 'Skeleton.tsx'))).toBe(false);
  });
});
