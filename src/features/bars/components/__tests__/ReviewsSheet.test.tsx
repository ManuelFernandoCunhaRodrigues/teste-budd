import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { BARS } from '@/mocks/bars';
import { useSessionStore } from '@/store/sessionStore';
import { hasMojibake } from '@/utils/textIntegrity';

import { useReviewsStore, type LocalReview } from '../../store/reviewsStore';
import { ReviewsSheet } from '../ReviewsSheet';

/**
 * The reviews sheet.
 *
 * Two classes of regression are pinned here. The subscription must stay
 * reference-stable, or `useSyncExternalStore` loops the screen to death; and
 * every string that reaches the user must be readable Portuguese, because a
 * mis-encoded save is invisible to every other check in the pipeline.
 */

/**
 * The focus hook defers 80ms before touching `AccessibilityInfo`.
 *
 * That timer outlives a fast test and fires after Jest has torn the environment
 * down, which crashes the worker rather than failing a case. It has its own
 * coverage; here it is noise.
 */
jest.mock('@/hooks/useModalAccessibility', () => ({
  __esModule: true,
  useModalAccessibility: () => ({ current: null }),
}));

jest.mock('../../services/reviewService', () => {
  const actual = jest.requireActual('../../services/reviewService');
  return {
    __esModule: true,
    ...actual,
    // Content/composer cases do not exercise remote loading. Keeping this
    // request pending prevents the real mock adapter's timer from updating a
    // sheet after its test has already been cleaned up.
    fetchVenueReviews: jest.fn(() => new Promise(() => {})),
  };
});

/** Gesture-bar device: the inset the sheet has to reserve for. */
const GESTURE_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const BAR = BARS[0];

function seedReview(overrides: Partial<LocalReview> = {}): LocalReview {
  return {
    id: 'rev-1',
    venueId: BAR.id,
    userId: 'u1',
    author: 'Ana',
    initial: 'A',
    date: 'há 2 dias',
    stars: 5,
    text: 'Muito bom',
    status: 'published',
    idempotencyKey: 'key-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderSheet() {
  return render(
    <SafeAreaProvider initialMetrics={GESTURE_METRICS}>
      <ReviewsSheet bar={BAR} onClose={() => {}} visible />
    </SafeAreaProvider>,
  );
}

interface RenderedNode {
  props?: Record<string, unknown>;
  children?: (RenderedNode | string)[] | null;
}

/**
 * Every string in the rendered tree — visible copy *and* string props.
 *
 * Props matter as much as copy here: accessibility labels, hints and
 * placeholders are read aloud, and were just as exposed to the encoding bug.
 *
 * Collected by walking rather than by `JSON.stringify`, which throws on this
 * tree: a `ref` prop holds a component instance that points back at its own
 * fiber.
 */
function renderedStrings(): string[] {
  const found: string[] = [];

  const walk = (node: RenderedNode | string | null | undefined) => {
    if (node == null) return;
    if (typeof node === 'string') {
      found.push(node);
      return;
    }

    for (const value of Object.values(node.props ?? {})) {
      if (typeof value === 'string') found.push(value);
    }

    for (const child of node.children ?? []) walk(child);
  };

  walk(screen.toJSON() as RenderedNode | null);
  return found;
}

beforeEach(() => {
  useReviewsStore.setState({ reviews: [], hasHydrated: true });
  useSessionStore.setState({
    status: 'authenticated',
    accessToken: 'token',
    user: { id: 'u1', name: 'Ana', email: 'ana@budd.com' },
  });
});

describe('ReviewsSheet content', () => {
  it('shows the average with a comma and the count with its accent', async () => {
    // The numeric catalogue value must never leak into pt-BR presentation.
    await renderSheet();

    expect(screen.getByText('4,9')).toBeTruthy();
    expect(screen.getByText(/284 avaliações/)).toBeTruthy();
  });

  it('describes the average in words', async () => {
    await renderSheet();

    expect(screen.getByText(/Excelente/)).toBeTruthy();
  });

  it('renders no mis-encoded text anywhere', async () => {
    useReviewsStore.setState({ reviews: [seedReview()], hasHydrated: true });
    await renderSheet();

    expect(renderedStrings().filter(hasMojibake)).toEqual([]);
  });

  it('keeps Portuguese accents intact in its own labels', async () => {
    await renderSheet();

    expect(screen.getByText('Deixe sua avaliação')).toBeTruthy();
    expect(screen.getByLabelText('Conte como foi sua experiência')).toBeTruthy();
    expect(screen.getByText('Enviar avaliação')).toBeTruthy();
  });

  it('mounts with no stored reviews without looping', async () => {
    // An empty list still produces a *new* empty array each read, so this is the
    // case that regressed first — the loop needs no data at all to start.
    await renderSheet();

    expect(screen.getByRole('header')).toBeTruthy();
  });

  it('shows a stored review with its score', async () => {
    useReviewsStore.setState({ reviews: [seedReview()], hasHydrated: true });
    await renderSheet();

    expect(screen.getByText('Muito bom')).toBeTruthy();
    expect(screen.getAllByLabelText('Nota 5,0 de 5').length).toBeGreaterThan(0);
  });

  it('does not show another venue’s review', async () => {
    useReviewsStore.setState({
      reviews: [seedReview({ id: 'rev-2', venueId: 'other-venue', text: 'De outro bar' })],
      hasHydrated: true,
    });
    await renderSheet();

    expect(screen.queryByText('De outro bar')).toBeNull();
  });
});

describe('ReviewsSheet composer', () => {
  it('offers five selectable stars', async () => {
    await renderSheet();

    for (let star = 1; star <= 5; star += 1) {
      expect(screen.getByLabelText(`Dar nota ${star} de 5`)).toBeTruthy();
    }
  });

  it('blocks submission until a score is chosen', async () => {
    await renderSheet();

    const button = screen.getByLabelText('Enviar avaliação');
    expect(button.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('Escolha uma nota para continuar.')).toBeTruthy();
  });

  it('explains what is still missing after a score is chosen', async () => {
    await renderSheet();

    await fireEvent.press(screen.getByLabelText('Dar nota 4 de 5'));

    // `find*`, not `get*`: the press writes to the store, and the assertion has
    // to wait for React to flush that before reading the tree.
    expect(await screen.findByText(/Escreva algumas palavras/)).toBeTruthy();
    // Still disabled, but for a different and now-stated reason.
    expect(screen.getByLabelText('Enviar avaliação').props.accessibilityState.disabled).toBe(true);
  });

  it('enables submission once the score and the comment are both valid', async () => {
    await renderSheet();

    await fireEvent.press(screen.getByLabelText('Dar nota 5 de 5'));
    await fireEvent.changeText(
      screen.getByLabelText('Conte como foi sua experiência'),
      'Ambiente ótimo, atendimento rápido.',
    );

    const button = await screen.findByLabelText('Enviar avaliação');
    expect(button.props.accessibilityState.disabled).toBe(false);
  });
});
