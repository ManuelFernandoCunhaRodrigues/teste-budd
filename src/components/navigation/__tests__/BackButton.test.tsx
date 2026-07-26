import { act, fireEvent, render, screen } from '@testing-library/react-native';

/**
 * Back navigation (§10.7).
 *
 * The defect: `router.back()` was called only when `canGoBack()` was true, so on
 * a deep-linked screen the button rendered as enabled and did nothing.
 */

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn();
let mockPathname = '/bar/pixzinho-dos-crias';

jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
    push: jest.fn(),
  }),
  usePathname: () => mockPathname,
}));

const { BackButton, DEFAULT_BACK_FALLBACK } = require('../BackButton');

beforeEach(() => {
  jest.clearAllMocks();
  mockPathname = '/bar/pixzinho-dos-crias';
});

it('pops the stack when there is history, and is accessible', async () => {
  mockCanGoBack.mockReturnValue(true);
  await render(<BackButton accessibilityHint="Voltar para eventos" fallbackHref="/role" />);

  // Every other case queries by this label too, so the role/label contract is
  // exercised throughout; the hint is only set here.
  const button = screen.getByLabelText('Voltar');
  expect(button.props.accessibilityRole).toBe('button');
  expect(button.props.accessibilityHint).toBe('Voltar para eventos');

  fireEvent.press(button);

  expect(mockBack).toHaveBeenCalledTimes(1);
  expect(mockReplace).not.toHaveBeenCalled();
});

it('replaces with the fallback when there is no history', async () => {
  mockCanGoBack.mockReturnValue(false);
  await render(<BackButton fallbackHref="/role" />);

  fireEvent.press(screen.getByLabelText('Voltar'));

  expect(mockBack).not.toHaveBeenCalled();
  // `replace`, not `push`: the fallback stands in for a parent that was never
  // on the stack.
  expect(mockReplace).toHaveBeenCalledWith('/role');
});

it('uses the global fallback when none is given', async () => {
  mockCanGoBack.mockReturnValue(false);
  await render(<BackButton />);

  fireEvent.press(screen.getByLabelText('Voltar'));

  expect(mockReplace).toHaveBeenCalledWith(DEFAULT_BACK_FALLBACK);
});

it('never navigates to undefined', async () => {
  mockCanGoBack.mockReturnValue(false);
  await render(<BackButton />);

  fireEvent.press(screen.getByLabelText('Voltar'));

  expect(mockReplace).toHaveBeenCalledTimes(1);
  expect(mockReplace.mock.calls[0][0]).toBeDefined();
});

it('gives a custom onPress priority over both paths', async () => {
  mockCanGoBack.mockReturnValue(true);
  const onPress = jest.fn();
  await render(<BackButton fallbackHref="/role" onPress={onPress} />);

  fireEvent.press(screen.getByLabelText('Voltar'));

  expect(onPress).toHaveBeenCalledTimes(1);
  expect(mockBack).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
});

it('avoids a loop when the fallback is the current screen', async () => {
  mockCanGoBack.mockReturnValue(false);
  mockPathname = '/role';
  await render(<BackButton fallbackHref="/role" />);

  fireEvent.press(screen.getByLabelText('Voltar'));

  // Replacing /role with /role would look like a dead button.
  expect(mockReplace).toHaveBeenCalledWith(DEFAULT_BACK_FALLBACK);
});

it('does not navigate twice on a double tap', async () => {
  mockCanGoBack.mockReturnValue(true);
  const view = await render(<BackButton fallbackHref="/role" />);

  const button = screen.getByLabelText('Voltar');
  fireEvent.press(button);
  fireEvent.press(button);

  expect(mockBack).toHaveBeenCalledTimes(1);

  // Unmount here and let the guard's release timer drain, so the next test
  // starts from a clean tree.
  view.unmount();
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});

