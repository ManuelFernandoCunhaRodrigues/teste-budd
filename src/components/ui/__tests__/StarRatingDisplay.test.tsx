import { render, screen } from '@testing-library/react-native';

import { StarRating } from '../StarRating';

/**
 * Read-only scores and touch targets.
 *
 * Split from `StarRating.test.tsx` only to stay under the per-file mount budget
 * described there; these belong to the same component.
 */

describe('StarRating targets', () => {
  it('gives every star a target at least 44pt on each side', async () => {
    await render(<StarRating onChange={jest.fn()} size={16} value={3} />);

    // Deliberately rendered small: the icon may shrink, the target may not.
    for (let star = 1; star <= 5; star += 1) {
      const style = screen.getByTestId(`star-${star}`).props.style;
      const box = Object.assign({}, ...(Array.isArray(style) ? style.flat() : [style]).filter(Boolean));

      expect(box.minWidth).toBeGreaterThanOrEqual(44);
      expect(box.minHeight).toBeGreaterThanOrEqual(44);
    }
  });
});

describe('StarRating as a read-only score', () => {
  it('announces the score once instead of five times', async () => {
    await render(<StarRating value={4} />);

    // No `onChange`, so no per-star buttons to wade through.
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByLabelText('4,0 de 5 estrelas')).toBeTruthy();
  });

  it('reports the score in pt-BR', async () => {
    // Accepts the string the catalogue stores without rounding its decimal away.
    await render(<StarRating size={20} value="4.9" />);

    expect(screen.getByLabelText('4,9 de 5 estrelas')).toBeTruthy();
    expect(
      screen.getByTestId('rating-star-4-fill', { includeHiddenElements: true }).props.style.width,
    ).toBe(20);
    expect(
      screen.getByTestId('rating-star-5-fill', { includeHiddenElements: true }).props.style.width,
    ).toBeCloseTo(18);
  });

  it('supports a custom scale and spacing in display mode', async () => {
    await render(
      <StarRating max={7} onChange={jest.fn()} readonly spacing={6} value={3.5} />,
    );

    const rating = screen.getByLabelText('3,5 de 7 estrelas');

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(
      screen.getAllByTestId(/^rating-star-\d+$/, { includeHiddenElements: true }),
    ).toHaveLength(7);
    expect(rating.props.style).toMatchObject({ gap: 6 });
  });
});
