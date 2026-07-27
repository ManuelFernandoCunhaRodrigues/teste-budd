import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/constants/storage';
import { BARS } from '@/mocks/bars';
import { backend, devBackendControls } from '@/services/backend';
import { AppError } from '@/services/errors';

import {
  selectActiveReview,
  selectVisibleReviewsForVenue,
  useReviewsStore,
  type LocalReview,
} from '../reviewsStore';

const VENUE = BARS[0];
const USER = { id: 'user-demo', name: 'Ana Souza' };

function persistedReview(overrides: Partial<LocalReview> = {}): LocalReview {
  const now = '2026-07-27T12:00:00.000Z';

  return {
    id: 'persisted-review-1',
    venueId: VENUE.id,
    userId: USER.id,
    author: USER.name,
    initial: 'A',
    date: 'há 2 dias',
    stars: 5,
    text: 'Avaliação persistida válida.',
    status: 'published',
    idempotencyKey: 'persisted-review-key-1',
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    ...overrides,
  };
}

beforeEach(async () => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  devBackendControls.resetForTests();
  await AsyncStorage.clear();
  useReviewsStore.setState({ reviews: [], hasHydrated: true });
});

it('keeps draft text and stars in the local store', () => {
  useReviewsStore.getState().updateDraft({
    venueId: VENUE.id,
    userId: USER.id,
    authorName: USER.name,
    stars: 5,
  });
  useReviewsStore.getState().updateDraft({
    venueId: VENUE.id,
    userId: USER.id,
    authorName: USER.name,
    text: 'Atendimento excelente.',
  });

  const draft = selectActiveReview(useReviewsStore.getState(), VENUE.id, USER.id);

  expect(draft).toMatchObject({
    status: 'draft',
    stars: 5,
    text: 'Atendimento excelente.',
  });
});

it('restores a persisted draft', async () => {
  const now = new Date().toISOString();
  const persistedDraft: LocalReview = {
    id: 'local-review-1',
    venueId: VENUE.id,
    userId: USER.id,
    author: USER.name,
    initial: 'A',
    date: 'rascunho',
    stars: 4,
    text: 'Rascunho antes de fechar o app.',
    status: 'draft',
    idempotencyKey: 'review-persist-1',
    createdAt: now,
    updatedAt: now,
  };

  useReviewsStore.setState({ reviews: [], hasHydrated: false });
  await AsyncStorage.setItem(
    STORAGE_KEYS.reviews,
    JSON.stringify({ state: { reviews: [persistedDraft] }, version: 1 }),
  );

  await useReviewsStore.persist.rehydrate();

  expect(selectActiveReview(useReviewsStore.getState(), VENUE.id, USER.id)).toMatchObject({
    text: persistedDraft.text,
    status: 'draft',
  });
});

it('marks a review as published only after the backend adapter resolves', async () => {
  useReviewsStore.getState().updateDraft({
    venueId: VENUE.id,
    userId: USER.id,
    authorName: USER.name,
    stars: 5,
    text: 'Atendimento excelente e pedido rapido.',
  });

  const result = await useReviewsStore.getState().submitDraft({ venueId: VENUE.id, user: USER });
  const visible = selectVisibleReviewsForVenue(useReviewsStore.getState(), VENUE.id);

  expect(result.status).toBe('published');
  expect(result.message).toMatch(/demonstração/i);
  expect(visible[0]).toMatchObject({
    status: 'published',
    text: 'Atendimento excelente e pedido rapido.',
  });
});

it('drops a concurrent submit and sends a single backend request', async () => {
  const spy = jest.spyOn(backend, 'submitReview');

  useReviewsStore.getState().updateDraft({
    venueId: VENUE.id,
    userId: USER.id,
    authorName: USER.name,
    stars: 4,
    text: 'Boa musica e fila curta.',
  });

  const first = useReviewsStore.getState().submitDraft({ venueId: VENUE.id, user: USER });
  const second = useReviewsStore.getState().submitDraft({ venueId: VENUE.id, user: USER });

  await expect(second).resolves.toMatchObject({ status: 'submitting' });
  await expect(first).resolves.toMatchObject({ status: 'published' });
  expect(spy).toHaveBeenCalledTimes(1);
});

it('preserves the draft and marks it failed when publication is unavailable', async () => {
  jest.spyOn(backend, 'submitReview').mockRejectedValue(
    new AppError('unavailable', {
      userMessage: 'Servidor indisponivel. Tente novamente.',
    }),
  );

  useReviewsStore.getState().updateDraft({
    venueId: VENUE.id,
    userId: USER.id,
    authorName: USER.name,
    stars: 5,
    text: 'Texto que nao pode sumir.',
  });

  await expect(
    useReviewsStore.getState().submitDraft({ venueId: VENUE.id, user: USER }),
  ).rejects.toMatchObject({ code: 'unavailable' });

  const failed = selectActiveReview(useReviewsStore.getState(), VENUE.id, USER.id);
  expect(failed).toMatchObject({
    status: 'failed',
    text: 'Texto que nao pode sumir.',
    errorMessage: 'Servidor indisponivel. Tente novamente.',
  });
});

it('rejects a publication response that belongs to another venue', async () => {
  const publishedAt = new Date().toISOString();
  jest.spyOn(backend, 'submitReview').mockResolvedValue({
    id: 'crossed-review',
    venueId: 'another-venue',
    userId: USER.id,
    author: USER.name,
    initial: 'A',
    date: 'agora',
    stars: 5,
    text: 'Este texto deve continuar no bar correto.',
    publishedAt,
  });

  useReviewsStore.getState().updateDraft({
    venueId: VENUE.id,
    userId: USER.id,
    authorName: USER.name,
    stars: 5,
    text: 'Este texto deve continuar no bar correto.',
  });

  await expect(
    useReviewsStore.getState().submitDraft({ venueId: VENUE.id, user: USER }),
  ).rejects.toMatchObject({ code: 'unknown' });

  expect(selectActiveReview(useReviewsStore.getState(), VENUE.id, USER.id)).toMatchObject({
    status: 'failed',
    venueId: VENUE.id,
    text: 'Este texto deve continuar no bar correto.',
  });
  expect(selectVisibleReviewsForVenue(useReviewsStore.getState(), 'another-venue')).toEqual([]);
});

it('turns a failed attempt back into a draft when the user edits it', async () => {
  jest.spyOn(backend, 'submitReview').mockRejectedValue(new AppError('network'));

  useReviewsStore.getState().updateDraft({
    venueId: VENUE.id,
    userId: USER.id,
    authorName: USER.name,
    stars: 5,
    text: 'Texto inicial.',
  });
  await useReviewsStore
    .getState()
    .submitDraft({ venueId: VENUE.id, user: USER })
    .catch(() => undefined);

  useReviewsStore.getState().updateDraft({
    venueId: VENUE.id,
    userId: USER.id,
    authorName: USER.name,
    text: 'Texto corrigido.',
  });

  const edited = selectActiveReview(useReviewsStore.getState(), VENUE.id, USER.id);

  expect(edited).toMatchObject({
    status: 'draft',
    text: 'Texto corrigido.',
  });
  expect(edited?.errorMessage).toBeUndefined();
});

it('rejects an invalid draft before calling the backend', async () => {
  const spy = jest.spyOn(backend, 'submitReview');

  useReviewsStore.getState().updateDraft({
    venueId: VENUE.id,
    userId: USER.id,
    authorName: USER.name,
    stars: 0,
    text: 'Texto suficiente, mas sem nota.',
  });

  await expect(
    useReviewsStore.getState().submitDraft({ venueId: VENUE.id, user: USER }),
  ).rejects.toMatchObject({ code: 'validation' });

  expect(spy).not.toHaveBeenCalled();
  expect(selectActiveReview(useReviewsStore.getState(), VENUE.id, USER.id)).toMatchObject({
    status: 'failed',
    stars: 0,
    text: 'Texto suficiente, mas sem nota.',
  });
});

it('drops a corrupted persisted review without losing valid records', async () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const mangledCedilla = String.fromCodePoint(0x00c3, 0x00a7);
  const valid = persistedReview();
  const corrupted = persistedReview({
    id: 'persisted-review-corrupted',
    text: `Avalia${mangledCedilla}ão ilegível`,
  });

  useReviewsStore.setState({ reviews: [], hasHydrated: false });
  await AsyncStorage.setItem(
    STORAGE_KEYS.reviews,
    JSON.stringify({ state: { reviews: [valid, corrupted] }, version: 1 }),
  );

  await useReviewsStore.persist.rehydrate();

  expect(useReviewsStore.getState().reviews).toEqual([valid]);
  expect(useReviewsStore.getState().hasHydrated).toBe(true);
  expect(warning).toHaveBeenCalled();
  warning.mockRestore();
});

it('recovers a persisted submitting review as an editable failed attempt', async () => {
  const interrupted = persistedReview({
    id: 'persisted-review-interrupted',
    status: 'submitting',
    publishedAt: undefined,
  });

  useReviewsStore.setState({ reviews: [], hasHydrated: false });
  await AsyncStorage.setItem(
    STORAGE_KEYS.reviews,
    JSON.stringify({ state: { reviews: [interrupted] }, version: 1 }),
  );

  await useReviewsStore.persist.rehydrate();

  expect(selectActiveReview(useReviewsStore.getState(), VENUE.id, USER.id)).toMatchObject({
    id: interrupted.id,
    status: 'failed',
    errorMessage: 'O envio anterior foi interrompido. Tente novamente.',
  });
});
