import { render, screen } from '@testing-library/react-native';

import { useSessionStore } from '@/store/sessionStore';

/**
 * Route protection (§3.5, §17.1).
 *
 * The guard lives in the group layout, so it runs for *any* entry into the group:
 * a deep link, a typed URL, restored navigation state, a notification, the back
 * stack. The previous build only redirected from `app/index`, so all of those
 * paths walked straight into a private screen.
 *
 * `expo-router` is mocked down to markers, which is what lets the test assert
 * which branch the layout chose without a navigator.
 */
jest.mock('expo-router', () => require('../../test-support/expoRouterMock'));

jest.mock('@/features/cart/components/VenueSwitchDialog', () => ({
  __esModule: true,
  VenueSwitchDialog: () => null,
}));

const PrivateLayout = require('../(private)/_layout').default;
const PublicLayout = require('../(public)/_layout').default;

function setStatus(status: 'checking' | 'authenticated' | 'unauthenticated') {
  useSessionStore.setState({
    status,
    accessToken: status === 'authenticated' ? 'token' : null,
    user: status === 'authenticated' ? { id: 'u1', name: 'Ana', email: 'a@b.com' } : null,
  });
}

describe('private layout', () => {
  it('shows a loading state while the session is being checked', async () => {
    setStatus('checking');
    await render(<PrivateLayout />);

    // Crucially, not the private content — the app must not render private
    // screens before it knows whether there is a session.
    expect(screen.queryByText(/PRIVATE_CONTENT/)).toBeNull();
    expect(screen.queryByText(/REDIRECT/)).toBeNull();
  });

  it('redirects an unauthenticated visitor to login', async () => {
    setStatus('unauthenticated');
    await render(<PrivateLayout />);

    expect(screen.getByText('REDIRECT:/login')).toBeTruthy();
    expect(screen.queryByText(/PRIVATE_CONTENT/)).toBeNull();
  });

  it('renders private routes for an authenticated user', async () => {
    setStatus('authenticated');
    await render(<PrivateLayout />);

    expect(screen.getByText(/PRIVATE_CONTENT/)).toBeTruthy();
  });

  it('closes again the moment the session ends', async () => {
    setStatus('authenticated');
    const view = await render(<PrivateLayout />);
    expect(screen.getByText(/PRIVATE_CONTENT/)).toBeTruthy();

    // Signing out mid-session must not leave the private tree mounted, which is
    // also what stops the Android back button returning to it.
    setStatus('unauthenticated');
    await view.rerender(<PrivateLayout />);

    expect(screen.getByText('REDIRECT:/login')).toBeTruthy();
    expect(screen.queryByText(/PRIVATE_CONTENT/)).toBeNull();
  });
});

describe('public layout', () => {
  it('shows login to an unauthenticated visitor', async () => {
    setStatus('unauthenticated');
    await render(<PublicLayout />);

    expect(screen.queryByText(/REDIRECT/)).toBeNull();
  });

  it('bounces an authenticated user away from the login form', async () => {
    setStatus('authenticated');
    await render(<PublicLayout />);

    // §3.5: a signed-in user must not be able to reach the form and start a
    // second sign-in over a live session.
    expect(screen.getByText('REDIRECT:/role')).toBeTruthy();
  });

  it('waits rather than guessing while checking', async () => {
    setStatus('checking');
    await render(<PublicLayout />);

    expect(screen.queryByText(/REDIRECT/)).toBeNull();
  });
});
