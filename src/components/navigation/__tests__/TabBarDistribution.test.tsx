import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import { TAB_ITEMS } from '../tabs.config';

import { GESTURE_METRICS, renderTabBar } from './tabBarTestHarness';

/**
 * The two failures a screenshot shows first: labels running into each other,
 * and a bar whose surface does not follow the real width.
 *
 * A third file rather than cases appended to the other two — see
 * `tabBarTestHarness` for the per-file mount ceiling that forces the split.
 */

describe('TabBar label distribution', () => {
  it('gives every tab its own label node instead of one concatenated run', async () => {
    await renderTabBar('/role');

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(TAB_ITEMS.length);

    tabs.forEach((tab, index) => {
      const texts = within(tab).getAllByText(/\S/);

      // One label per tab. Two would mean a neighbour's text is being rendered
      // inside this cell, which is what "labels sobrepostos" looks like in the
      // tree rather than on screen.
      expect(texts).toHaveLength(1);
      expect(texts[0].props.children).toBe(TAB_ITEMS[index].label);
    });

    // The exact symptom from the bug report: every label fused into one string.
    expect(
      screen.queryByText(TAB_ITEMS.map((item) => item.label).join('')),
    ).toBeNull();
  });
});

describe('TabBar width', () => {
  it('redraws the surface at the measured width after a dimension change', async () => {
    await renderTabBar('/role', GESTURE_METRICS);

    const initialWidth = screen.getByTestId('tab-bar-surface').props.width;
    // Falls back to the window width less both margins until the first layout
    // pass lands, so it must never start at the rotated width.
    expect(initialWidth).not.toBe(720);

    fireEvent(screen.getByTestId('tab-bar'), 'layout', {
      nativeEvent: { layout: { width: 720, height: 0, x: 0, y: 0 } },
    });

    // Awaited rather than asserted inline: under React 19 the re-render from
    // `onLayout` does not land within `fireEvent`, so a synchronous read here
    // returns the pre-measurement fallback and the test passes for the wrong
    // reason. Wrapping the event in `act` also works but nests act scopes.
    //
    // The path, the notch and the indicator all derive their x from this same
    // width, so re-measuring the surface re-solves the whole bar.
    await waitFor(() => {
      expect(screen.getByTestId('tab-bar-surface').props.width).toBe(720);
    });
  });
});
