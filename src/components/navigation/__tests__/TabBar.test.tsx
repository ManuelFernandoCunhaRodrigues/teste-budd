import { fireEvent, screen } from '@testing-library/react-native';

import { resolveActiveIndex } from '../TabBar';
import { CENTER_TAB_INDEX, TAB_ITEMS } from '../tabs.config';

import { renderTabBar } from './tabBarTestHarness';

/**
 * Which tab is active, and what a tap does.
 *
 * Functional assertions only — no snapshots. A snapshot would lock in a path
 * string and tell you nothing about whether the right tab is selected or
 * whether pressing one navigates.
 *
 * Layout, safe area and indicator geometry live in `TabBarLayout.test.tsx`; see
 * `tabBarTestHarness` for why they are not in this file.
 */

describe('resolveActiveIndex', () => {
  it('matches each tab to its own route', () => {
    TAB_ITEMS.forEach((item, index) => {
      expect(resolveActiveIndex(item.href)).toBe(index);
    });
  });

  it('matches a nested route to its tab', () => {
    expect(resolveActiveIndex('/profile/settings')).toBe(
      TAB_ITEMS.findIndex((item) => item.name === 'profile'),
    );
  });

  it('keeps venue details owned by the Rolê tab', () => {
    expect(resolveActiveIndex('/bar/quintal-74')).toBe(
      TAB_ITEMS.findIndex((item) => item.name === 'role'),
    );
  });

  it('normalizes a trailing slash without changing the active tab', () => {
    expect(resolveActiveIndex('/role/')).toBe(
      TAB_ITEMS.findIndex((item) => item.name === 'role'),
    );
  });

  it('does not let a longer sibling route steal a tab', () => {
    // `/map` must not be selected by `/mapa`. The old check was a bare
    // `startsWith` with no separator, which would have matched it.
    expect(resolveActiveIndex('/mapa')).toBe(-1);
    expect(resolveActiveIndex('/barista')).toBe(-1);
  });

  it('reports no active tab instead of defaulting to the first one', () => {
    // `Math.max(0, findIndex(...))` used to turn "unknown route" into "LineUp is
    // selected", and the notch would slide there to confirm the lie.
    expect(resolveActiveIndex('/somewhere-else')).toBe(-1);
  });
});

describe('TabBar selection', () => {
  it('renders all five tabs in the configured order', async () => {
    await renderTabBar('/role');

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(TAB_ITEMS.length);
    expect(tabs.map((tab) => tab.props.accessibilityLabel)).toEqual(
      TAB_ITEMS.map((item) => item.label),
    );
  });

  it('keeps ROLÊ in the centre position', async () => {
    await renderTabBar('/role');

    const tabs = screen.getAllByRole('tab');
    expect(tabs[CENTER_TAB_INDEX].props.accessibilityLabel).toBe('ROLÊ');
  });

  it('marks exactly one tab selected, and it is the one the route names', async () => {
    await renderTabBar('/map');

    const selected = screen
      .getAllByRole('tab')
      .filter((tab) => tab.props.accessibilityState?.selected);

    expect(selected).toHaveLength(1);
    expect(selected[0].props.accessibilityLabel).toBe('Mapa');
  });

  it('opens on a tab other than ROLÊ when the route says so', async () => {
    // Covers a deep link, a restored navigation state and a notification alike:
    // all three arrive as nothing more than a different initial pathname.
    await renderTabBar('/lineup');

    expect(screen.getByLabelText('LineUp').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('ROLÊ').props.accessibilityState.selected).toBe(false);
  });

  it('navigates when an inactive tab is pressed', async () => {
    const { onPress } = await renderTabBar('/role');

    await fireEvent.press(screen.getByLabelText('Perfil'));

    expect(onPress).toHaveBeenCalledWith('profile');
  });

  it('forwards a re-tap so TabTrigger can emit tabPress without duplicating the route', async () => {
    const { onPress } = await renderTabBar('/role');

    await fireEvent.press(screen.getByLabelText('ROLÊ'));

    expect(onPress).toHaveBeenCalledWith('role');
  });

  it('handles twenty rapid taps without dropping one', async () => {
    const { onPress } = await renderTabBar('/role');

    for (let i = 0; i < 20; i += 1) {
      await fireEvent.press(
        screen.getByLabelText(i % 2 === 0 ? 'Mapa' : 'Produtos'),
      );
    }

    expect(onPress).toHaveBeenCalledTimes(20);
  });
});
