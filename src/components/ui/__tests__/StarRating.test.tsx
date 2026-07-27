import { fireEvent, render, screen } from '@testing-library/react-native';

import { StarRating } from '../StarRating';

/**
 * Star rating.
 *
 * Two audiences, two shapes. A screen reader that swipes gets one `adjustable`
 * control it can increment; one that walks element by element gets five
 * individually labelled buttons. Both have to work, and the older version of
 * this component offered only the first, which made an exact score unreachable
 * without dragging.
 *
 * Kept to six renders: past roughly seven mounts in one file, React starts
 * reporting overlapping `act()` calls and later renders come back empty.
 */

describe('StarRating as a picker', () => {
  it('exposes one adjustable control rather than five radios', async () => {
    await render(<StarRating onChange={jest.fn()} value={4} />);

    const group = screen.getByLabelText('Nota da avaliação');

    expect(group.props.accessibilityRole).toBe('adjustable');
    expect(group.props.accessibilityValue).toMatchObject({
      min: 1,
      max: 5,
      now: 4,
      text: '4 de 5 estrelas',
    });
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('increments, decrements and clamps at the limits', async () => {
    const onChange = jest.fn();
    const { rerender } = await render(<StarRating onChange={onChange} value={4} />);

    const group = screen.getByLabelText('Nota da avaliação');
    group.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });
    group.props.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } });

    expect(onChange).toHaveBeenNthCalledWith(1, 5);
    expect(onChange).toHaveBeenNthCalledWith(2, 3);

    await rerender(<StarRating onChange={onChange} value={5} />);
    screen
      .getByLabelText('Nota da avaliação')
      .props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });

    // Never 6.
    expect(onChange).toHaveBeenNthCalledWith(3, 5);

    onChange.mockClear();
    await rerender(<StarRating disabled onChange={onChange} value={3} />);
    const disabledGroup = screen.getByLabelText('Nota da avaliação');
    const fourthStar = screen.getByLabelText('Dar nota 4 de 5');

    expect(disabledGroup.props.accessibilityState).toMatchObject({ disabled: true });
    expect(fourthStar.props.accessibilityState).toMatchObject({
      disabled: true,
      selected: false,
    });

    fireEvent.press(fourthStar);
    disabledGroup.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('lets a screen reader pick an exact score, one star at a time', async () => {
    const onChange = jest.fn();
    await render(<StarRating onChange={onChange} value={0} />);

    expect(screen.getByLabelText('Nota da avaliação').props.accessibilityValue).toEqual({
      min: 1,
      max: 5,
      text: 'Nenhuma nota selecionada',
    });

    for (let star = 1; star <= 5; star += 1) {
      const button = screen.getByLabelText(`Dar nota ${star} de 5`);
      expect(button.props.accessibilityRole).toBe('button');

      fireEvent.press(button);
      expect(onChange).toHaveBeenLastCalledWith(star);
    }
  });
});
