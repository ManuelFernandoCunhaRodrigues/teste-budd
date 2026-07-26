import { render, screen } from '@testing-library/react-native';

import { StarRating } from '../StarRating';

describe('StarRating accessibility', () => {
  it('exposes one adjustable control instead of five selected radios', async () => {
    const onChange = jest.fn();

    await render(<StarRating onChange={onChange} value={4} />);

    const rating = screen.getByLabelText('Avaliação: 4 de 5 estrelas.');

    expect(rating.props.accessibilityRole).toBe('adjustable');
    expect(rating.props.accessibilityValue).toMatchObject({
      min: 0,
      max: 5,
      now: 4,
      text: '4 de 5 estrelas',
    });
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('handles screen-reader increment and decrement actions', async () => {
    const onChange = jest.fn();

    await render(<StarRating onChange={onChange} value={4} />);

    const rating = screen.getByLabelText('Avaliação: 4 de 5 estrelas.');

    rating.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });
    rating.props.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } });

    expect(onChange).toHaveBeenNthCalledWith(1, 5);
    expect(onChange).toHaveBeenNthCalledWith(2, 3);
  });

  it('clamps accessibility actions at the rating limits', async () => {
    const onChange = jest.fn();

    await render(<StarRating onChange={onChange} value={5} />);

    screen
      .getByLabelText('Avaliação: 5 de 5 estrelas.')
      .props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });

    expect(onChange).toHaveBeenCalledWith(5);
  });
});
