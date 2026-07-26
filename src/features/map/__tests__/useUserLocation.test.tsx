import { act, renderHook, waitFor } from '@testing-library/react-native';

import { usePreferencesStore } from '@/store/preferencesStore';

/**
 * Location state machine (§10.2).
 *
 * The service is mocked, not the screen logic: what matters is that each outcome
 * maps to a distinct state the UI can act on.
 */
jest.mock('@/services/location/locationService', () => {
  const actual = jest.requireActual('@/services/location/locationService');
  return {
    __esModule: true,
    ...actual,
    resolveLocation: jest.fn(),
  };
});

const { resolveLocation } = require('@/services/location/locationService') as {
  resolveLocation: jest.Mock;
};

const { useUserLocation } = require('../hooks/useUserLocation');

const FIX = { latitude: -2.53, longitude: -44.3 };

beforeEach(() => {
  jest.clearAllMocks();
  usePreferencesStore.setState({ permissions: { location: true, personalized: true, share: false } });
});

it('reports a valid fix as available', async () => {
  resolveLocation.mockResolvedValue({ kind: 'available', coordinate: FIX });

  const { result } = await renderHook(() => useUserLocation());
  await waitFor(() => expect(result.current.status).toBe('available'));

  expect(result.current.coordinate).toEqual(FIX);
  expect(result.current.isPrecise).toBe(true);
  expect(result.current.message).toBeNull();
});

it('falls back with an explanation when permission is denied', async () => {
  resolveLocation.mockResolvedValue({ kind: 'denied' });

  const { result } = await renderHook(() => useUserLocation());
  await waitFor(() => expect(result.current.status).toBe('denied'));

  expect(result.current.isPrecise).toBe(false);
  expect(result.current.coordinate).toBeNull();
  // The screen still renders the default region; it must say why.
  expect(result.current.message).toBeTruthy();
});

it('distinguishes a blocked permission and points at settings', async () => {
  resolveLocation.mockResolvedValue({ kind: 'blocked' });

  const { result } = await renderHook(() => useUserLocation());
  await waitFor(() => expect(result.current.status).toBe('blocked'));

  expect(result.current.message).toMatch(/configura/i);
});

it('treats location services being off as unavailable', async () => {
  resolveLocation.mockResolvedValue({ kind: 'services-off' });

  const { result } = await renderHook(() => useUserLocation());
  await waitFor(() => expect(result.current.status).toBe('unavailable'));

  expect(result.current.message).toBeTruthy();
});

it('reports an error without hanging in loading', async () => {
  resolveLocation.mockResolvedValue({ kind: 'error', detail: 'boom' });

  const { result } = await renderHook(() => useUserLocation());
  await waitFor(() => expect(result.current.status).toBe('error'));

  // No infinite spinner: the state settles and offers a retry.
  expect(result.current.isSlow).toBe(false);
  expect(typeof result.current.retry).toBe('function');
});

it('rejects a malformed fix rather than centring on the Atlantic', async () => {
  resolveLocation.mockResolvedValue({
    kind: 'available',
    coordinate: { latitude: 0, longitude: 0 },
  });

  const { result } = await renderHook(() => useUserLocation());
  await waitFor(() => expect(result.current.status).toBe('error'));

  expect(result.current.coordinate).toBeNull();
});

it('never prompts when the in-app location preference is off', async () => {
  usePreferencesStore.setState({
    permissions: { location: false, personalized: true, share: false },
  });

  const { result } = await renderHook(() => useUserLocation());
  await waitFor(() => expect(result.current.status).toBe('denied'));

  expect(resolveLocation).not.toHaveBeenCalled();
});

it('resolves once per mount, not on every render', async () => {
  resolveLocation.mockResolvedValue({ kind: 'available', coordinate: FIX });

  const { result, rerender } = await renderHook(() => useUserLocation());
  await waitFor(() => expect(result.current.status).toBe('available'));

  await rerender({});
  await rerender({});

  // Re-requesting on every render would re-prompt the OS (§4.5).
  expect(resolveLocation).toHaveBeenCalledTimes(1);
});

it('retry asks again', async () => {
  resolveLocation.mockResolvedValue({ kind: 'denied' });

  const { result } = await renderHook(() => useUserLocation());
  await waitFor(() => expect(result.current.status).toBe('denied'));

  await act(async () => {
    result.current.retry();
  });
  await waitFor(() => expect(resolveLocation).toHaveBeenCalledTimes(2));
});

it('does not update state after unmount', async () => {
  let settle: (value: unknown) => void = () => {};
  resolveLocation.mockReturnValue(
    new Promise((resolve) => {
      settle = resolve;
    }),
  );

  const { unmount } = await renderHook(() => useUserLocation());
  unmount();

  // Resolving after teardown must not warn or write state.
  await act(async () => {
    settle({ kind: 'available', coordinate: FIX });
  });
});
