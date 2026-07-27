import { fireEvent, render, screen } from '@testing-library/react-native';

import { IconButton } from '@/components/ui';
import { HeartIcon } from '@/components/ui/icons';
import { BARS } from '@/mocks/bars';
import { colors } from '@/theme';

import { BarCard } from '../BarCard';

/**
 * One card serves the ROLÊ feed and the favourites screen. These assertions are
 * the contract that lets the second reuse the first: the details it shows, and
 * the fact that an action nested inside the card's own pressable fires alone.
 *
 * `render` is awaited throughout — under this version it resolves a promise, and
 * reading `screen` before it settles fails with "render function has not been
 * called" rather than with anything about the component.
 */

const bar = BARS[0];

describe('BarCard', () => {
  it('shows the venue details a listing needs', async () => {
    await render(<BarCard bar={bar} onPress={jest.fn()} />);

    expect(screen.getByText(bar.name)).toBeTruthy();
    expect(screen.getByText(bar.category)).toBeTruthy();
    expect(screen.getByText(bar.location)).toBeTruthy();
    expect(screen.getByText(bar.distance)).toBeTruthy();
  });

  it('wraps a long name instead of truncating it to one line', async () => {
    await render(<BarCard bar={bar} onPress={jest.fn()} />);

    // The favourites screen used to cap this at one line, which cut
    // "Pixzinho Dos Crias HeadShop" mid-word.
    expect(screen.getByText(bar.name).props.numberOfLines).toBe(2);
  });

  it('opens the venue when the card is pressed', async () => {
    const onPress = jest.fn();
    await render(<BarCard bar={bar} onPress={onPress} />);

    await fireEvent.press(screen.getByLabelText(new RegExp(`^${bar.name},`)));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders no action slot unless one is given', async () => {
    await render(<BarCard bar={bar} onPress={jest.fn()} />);

    expect(screen.queryByLabelText('Remover dos favoritos')).toBeNull();
  });

  it('fires the action alone, without also opening the venue', async () => {
    const onPress = jest.fn();
    const onRemove = jest.fn();

    await render(
      <BarCard
        action={
          <IconButton
            accessibilityLabel="Remover dos favoritos"
            onPress={onRemove}
            size={34}
          >
            <HeartIcon color={colors.primary} filled size={18} />
          </IconButton>
        }
        bar={bar}
        onPress={onPress}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Remover dos favoritos'));

    // Removing a favourite must not navigate away from the list it was removed
    // from — the whole card is pressable, so this is the case that breaks first.
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });
});
