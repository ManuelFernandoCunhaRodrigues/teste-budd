import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { useModalAccessibility } from '../useModalAccessibility';

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('announces the modal and restores focus to the control that opened it', async () => {
  jest.useFakeTimers();
  const announce = jest
    .spyOn(AccessibilityInfo, 'announceForAccessibility')
    .mockImplementation(() => {});
  const focus = jest
    .spyOn(AccessibilityInfo, 'setAccessibilityFocus')
    .mockImplementation(() => {});

  const hook = await renderHook(
    ({ visible, target }: { visible: boolean; target: number | null }) =>
      useModalAccessibility(visible, 'Avaliações de Bar Exemplo', target),
    {
      initialProps: { visible: true, target: 73 },
    },
  );

  await act(async () => {
    jest.advanceTimersByTime(80);
  });
  expect(announce).toHaveBeenCalledWith('Avaliações de Bar Exemplo');

  await hook.rerender({ visible: false, target: null });
  await act(async () => {
    jest.advanceTimersByTime(80);
  });

  expect(focus).toHaveBeenCalledWith(73);
});
