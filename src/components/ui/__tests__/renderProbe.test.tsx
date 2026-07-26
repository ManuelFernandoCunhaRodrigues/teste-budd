import { render, renderHook, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { Text } from 'react-native';

/**
 * Confirms the Testing Library environment itself works before other suites rely
 * on it. If these two fail, a render-based failure elsewhere is tooling, not the
 * code under test.
 */

function Probe() {
  return <Text>hello</Text>;
}

// Testing Library v14 made `render` and `renderHook` async — they must be
// awaited, or `screen` stays empty and `result` is undefined.
it('renders a component', async () => {
  await render(<Probe />);
  expect(screen.getByText('hello')).toBeTruthy();
});

it('renders a hook', async () => {
  const { result } = await renderHook(() => useState(1));
  expect(result.current[0]).toBe(1);
});
