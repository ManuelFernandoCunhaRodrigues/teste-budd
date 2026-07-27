import { fireEvent, render, screen } from '@testing-library/react-native';

import { Stepper } from '../Stepper';

/**
 * The quantity control.
 *
 * `render` is awaited: under this version it resolves a promise, and touching
 * `screen` first fails with "render function has not been called".
 */

function setup(quantity = 1, size?: 'sm' | 'md' | 'lg') {
  const onIncrement = jest.fn();
  const onDecrement = jest.fn();

  return {
    onIncrement,
    onDecrement,
    view: render(
      <Stepper
        itemLabel="Chopp Pilsen"
        onDecrement={onDecrement}
        onIncrement={onIncrement}
        quantity={quantity}
        size={size}
      />,
    ),
  };
}

describe('Stepper', () => {
  it('shows the quantity and names the item in every control', async () => {
    const { view } = setup(3);
    await view;

    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByLabelText('Diminuir Chopp Pilsen')).toBeTruthy();
    expect(screen.getByLabelText('Aumentar Chopp Pilsen')).toBeTruthy();
    expect(screen.getByLabelText('3 Chopp Pilsen')).toBeTruthy();
  });

  it('reports each direction to its own handler', async () => {
    const { view, onIncrement, onDecrement } = setup(2);
    await view;

    await fireEvent.press(screen.getByLabelText('Aumentar Chopp Pilsen'));
    expect(onIncrement).toHaveBeenCalledTimes(1);
    expect(onDecrement).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText('Diminuir Chopp Pilsen'));
    expect(onDecrement).toHaveBeenCalledTimes(1);
    expect(onIncrement).toHaveBeenCalledTimes(1);
  });

  it('draws the glyphs instead of typesetting them', async () => {
    const { view } = setup(1);
    await view;

    // As Text, `−` and `+` are different glyphs with different side bearings and
    // never share an optical centre across platforms. Their absence is what says
    // the icons are in use.
    expect(screen.queryByText('−')).toBeNull();
    expect(screen.queryByText('+')).toBeNull();
  });

  it('keeps the touch target at 44pt when the button is drawn smallest', async () => {
    const { view } = setup(1, 'sm');
    await view;

    // 28pt button plus 8pt of slop on each side.
    expect(screen.getByLabelText('Diminuir Chopp Pilsen').props.hitSlop).toBe(8);
  });

  it('announces the quantity when it changes', async () => {
    const { view } = setup(5);
    await view;

    expect(screen.getByText('5').props.accessibilityLiveRegion).toBe('polite');
  });

  it('does not clamp at one, because the cart removes the line there', async () => {
    const { view, onDecrement } = setup(1);
    await view;

    const decrement = screen.getByLabelText('Diminuir Chopp Pilsen');
    expect(decrement.props.accessibilityState?.disabled).toBeFalsy();

    await fireEvent.press(decrement);
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });
});
