import { render } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { BARS } from '@/mocks/bars';
import { useSessionStore } from '@/store/sessionStore';

import { useReviewsStore } from '../../store/reviewsStore';
import { ReviewsSheet, type ReviewsSheetProps } from '../ReviewsSheet';

export const REVIEWS_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

export const REVIEWS_BAR = BARS[0];
export const REVIEWS_USER = {
  id: 'u1',
  name: 'Ana',
  email: 'ana@budd.com',
};

export function resetReviewsSheetState() {
  useReviewsStore.setState({ reviews: [], hasHydrated: true });
  useSessionStore.setState({
    status: 'authenticated',
    accessToken: 'token',
    user: REVIEWS_USER,
  });
}

export function renderReviewsSheet(
  props: Partial<ReviewsSheetProps> = {},
  metrics: Metrics = REVIEWS_METRICS,
) {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ReviewsSheet
        bar={props.bar ?? REVIEWS_BAR}
        onClose={props.onClose ?? (() => {})}
        restoreFocusTarget={props.restoreFocusTarget}
        visible={props.visible ?? true}
      />
    </SafeAreaProvider>,
  );
}
