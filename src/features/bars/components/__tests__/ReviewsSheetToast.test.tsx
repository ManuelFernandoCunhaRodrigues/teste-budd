import { act, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { BARS } from '@/mocks/bars';
import { useSessionStore } from '@/store/sessionStore';
import { showToast, useToastStore } from '@/store/toastStore';

import { useReviewsStore } from '../../store/reviewsStore';
import { ReviewsSheet } from '../ReviewsSheet';

jest.mock('@/hooks/useModalAccessibility', () => ({
  __esModule: true,
  useModalAccessibility: () => ({ current: null }),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

beforeEach(() => {
  useReviewsStore.setState({ reviews: [], hasHydrated: true });
  useSessionStore.setState({
    status: 'authenticated',
    accessToken: 'token',
    user: { id: 'u1', name: 'Ana', email: 'ana@budd.com' },
  });
  useToastStore.getState().hide();
});

afterEach(() => {
  useToastStore.getState().hide();
});

it('renders toast feedback in the reviews native modal window', async () => {
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ReviewsSheet bar={BARS[0]} onClose={() => {}} visible />
    </SafeAreaProvider>,
  );

  await act(async () => {
    showToast('Avaliação publicada.');
  });

  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.getByText('Avaliação publicada.')).toBeTruthy();
});
