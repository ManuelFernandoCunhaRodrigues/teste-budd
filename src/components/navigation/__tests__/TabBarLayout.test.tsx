import { screen } from '@testing-library/react-native';

import { MIN_TOUCH_TARGET } from '@/theme';

import {
  LABEL_MAX_FONT_SIZE_MULTIPLIER,
  ROW_PADDING_TOP,
  TAB_BAR_HEIGHT,
  TAB_BAR_OVERHANG,
  TAB_ITEMS,
} from '../tabs.config';
import {
  tabBarContentInsetFor,
  tabBarHeightForInset,
} from '../useTabBarInset';

import {
  BUTTON_METRICS,
  GESTURE_METRICS,
  SMALL_METRICS,
  THREE_BUTTON_METRICS,
  renderTabBar,
  styleOf,
} from './tabBarTestHarness';

/**
 * Layout, safe area and the active indicator.
 *
 * Split from `TabBar.test.tsx` for a harness reason documented in
 * `tabBarTestHarness` — not because these belong to a different concern.
 */

describe('TabBar layout', () => {
  it('lays out the overhang, content and safe-area inset in one hit-test box', async () => {
    await renderTabBar('/role', GESTURE_METRICS);

    const box = styleOf(screen.getByTestId('tab-bar'));
    const row = styleOf(screen.getByTestId('tab-bar-row'));

    expect(box.height).toBe(
      TAB_BAR_OVERHANG + TAB_BAR_HEIGHT + GESTURE_METRICS.insets.bottom,
    );
    expect(row.paddingBottom).toBe(GESTURE_METRICS.insets.bottom);
  });

  it('is an absolute overlay rather than consuming TabSlot flow space', async () => {
    await renderTabBar('/role');

    const box = styleOf(screen.getByTestId('tab-bar'));

    expect(box.position).toBe('absolute');
    expect(box.bottom).toBe(0);
    expect(box.zIndex).toBeGreaterThan(0);
  });

  it('adds no software-navigation inset on a device with physical keys', async () => {
    await renderTabBar('/role', BUTTON_METRICS);

    const box = styleOf(screen.getByTestId('tab-bar'));

    expect(box.height).toBe(TAB_BAR_OVERHANG + TAB_BAR_HEIGHT);
  });

  it('grows by the safe-area inset on Android three-button navigation', async () => {
    await renderTabBar('/role', THREE_BUTTON_METRICS);

    expect(styleOf(screen.getByTestId('tab-bar')).height).toBe(
      TAB_BAR_OVERHANG + TAB_BAR_HEIGHT + THREE_BUTTON_METRICS.insets.bottom,
    );
  });

  it('no longer paints an opaque strip across the safe area', async () => {
    await renderTabBar('/role', THREE_BUTTON_METRICS);

    // That underlay was a full-width rectangle, which squared off the two
    // bottom corners the outline now rounds. The app background shows through
    // them instead — the floating look depends on nothing covering them.
    expect(screen.queryByTestId('tab-bar-system-underlay')).toBeNull();
  });

  it('keeps the bar clear of the screen edges', async () => {
    await renderTabBar('/role');

    expect(styleOf(screen.getByTestId('tab-bar')).marginHorizontal).toBeGreaterThan(0);
  });

  it('renders the active indicator above the bar, not inside it', async () => {
    await renderTabBar('/role');

    const box = styleOf(screen.getByTestId('tab-bar-indicator'));

    // The raised circle is visually above the flat bar surface but remains
    // inside the actual parent bounds, so its upper half is tappable. This is
    // what caught the ring overflowing the container by a point when it was
    // added: `TAB_BAR_OVERHANG` reserved room for the shadow but not for it.
    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.top + box.height).toBeLessThanOrEqual(
      TAB_BAR_OVERHANG + TAB_BAR_HEIGHT + GESTURE_METRICS.insets.bottom,
    );
    expect(box.width).toBe(box.height);
    expect(box.borderRadius).toBe(box.width / 2);
  });

  it('keeps every button at least 44pt and neutralizes TabTrigger row style', async () => {
    await renderTabBar('/role', SMALL_METRICS, {
      flexDirection: 'row',
      justifyContent: 'space-between',
    });

    for (const tab of screen.getAllByRole('tab')) {
      const box = styleOf(tab);
      expect(box.minWidth).toBe(MIN_TOUCH_TARGET);
      expect(box.minHeight).toBe(MIN_TOUCH_TARGET);
      expect(box.flexDirection).toBe('column');
      expect(box.paddingTop).toBe(TAB_BAR_OVERHANG + ROW_PADDING_TOP);
      // The two that actually distribute the row. Without them the cells
      // collapse to label width and pack against the left edge, which is how
      // the injected `space-between` used to surface on a device.
      expect(box.flex).toBe(1);
      expect(box.alignItems).toBe('center');
    }
  });

  it('caps label scaling while keeping it enabled', async () => {
    await renderTabBar('/role', SMALL_METRICS);

    const productsLabel = screen.getByText('Produtos');
    expect(productsLabel.props.maxFontSizeMultiplier).toBe(
      LABEL_MAX_FONT_SIZE_MULTIPLIER,
    );
    expect(productsLabel.props.allowFontScaling).not.toBe(false);
  });

  it('lays out on the narrowest supported screen', async () => {
    await renderTabBar('/role', SMALL_METRICS);

    expect(screen.getAllByRole('tab')).toHaveLength(TAB_ITEMS.length);
  });

  it('renders before the first layout pass, when the width is still zero', async () => {
    // The bar mounts unmeasured; the path builder has to cope rather than emit
    // NaN coordinates into the SVG.
    await renderTabBar('/role', {
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    });

    expect(screen.getAllByRole('tab')).toHaveLength(TAB_ITEMS.length);
  });
});

describe('tab content inset', () => {
  it.each([0, 34, 48])(
    'reserves the same visual bar height plus clearance for bottom inset %ipt',
    (bottomInset) => {
      expect(tabBarContentInsetFor(bottomInset)).toBeGreaterThan(
        tabBarHeightForInset(bottomInset),
      );
      expect(tabBarHeightForInset(bottomInset)).toBe(
        TAB_BAR_OVERHANG + TAB_BAR_HEIGHT + bottomInset,
      );
    },
  );

  it('never produces a negative device inset', () => {
    expect(tabBarHeightForInset(-10)).toBe(TAB_BAR_OVERHANG + TAB_BAR_HEIGHT);
  });
});
