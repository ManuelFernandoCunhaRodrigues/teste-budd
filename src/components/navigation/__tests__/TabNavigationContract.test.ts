import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { ROUTES } from '@/constants/routes';

import { unstable_settings as roleStackSettings } from '../../../../app/(private)/(tabs)/(role)/_layout';
import {
  TAB_BACK_BEHAVIOR,
  TAB_ITEMS,
} from '../tabs.config';

describe('tab navigation route contract', () => {
  const appRoot = join(process.cwd(), 'app', '(private)');
  const roleTabRoot = join(appRoot, '(tabs)', '(role)');

  it('keeps role and bar details in one pathless Stack under the tab navigator', () => {
    expect(existsSync(join(roleTabRoot, '_layout.tsx'))).toBe(true);
    expect(existsSync(join(roleTabRoot, 'role.tsx'))).toBe(true);
    expect(existsSync(join(roleTabRoot, 'bar', '[id].tsx'))).toBe(true);

    expect(existsSync(join(appRoot, 'bar', '[id].tsx'))).toBe(false);
    expect(existsSync(join(appRoot, '(tabs)', 'role.tsx'))).toBe(false);
  });

  it('preserves public URLs and gives a deep-linked bar a deterministic back target', () => {
    expect(ROUTES.role).toBe('/role');
    expect(ROUTES.bar('quintal-74')).toEqual({
      pathname: '/bar/[id]',
      params: { id: 'quintal-74' },
    });
    expect(roleStackSettings.initialRouteName).toBe('role');
  });

  it('assigns /bar to Rolê and uses visited-tab history for Android Back', () => {
    const role = TAB_ITEMS.find((item) => item.name === 'role');

    expect(role?.activePathPrefixes).toContain('/bar');
    expect(TAB_BACK_BEHAVIOR).toBe('history');
  });
});
