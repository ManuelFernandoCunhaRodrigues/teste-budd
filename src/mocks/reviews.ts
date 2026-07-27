import type { Review } from '@/types/domain';

export interface MockReview extends Review {
  venueId: string;
}

/** Seed reviews shown under the rating summary. */
export const REVIEWS: MockReview[] = [
  {
    id: 'marina-s',
    venueId: 'pixzinho-dos-crias',
    author: 'Marina S.',
    initial: 'M',
    date: 'há 2 dias',
    stars: 5,
    text: 'Ambiente ótimo, atendimento rápido e bebidas geladas. Voltarei com certeza!',
  },
  {
    id: 'rafael-l',
    venueId: 'pixzinho-dos-crias',
    author: 'Rafael L.',
    initial: 'R',
    date: 'há 1 semana',
    stars: 5,
    text: 'Melhor lugar da região pra curtir com os amigos. Recomendo o combo.',
  },
  {
    id: 'camila-t',
    venueId: 'pixzinho-dos-crias',
    author: 'Camila T.',
    initial: 'C',
    date: 'há 2 semanas',
    stars: 4,
    text: 'Muito bom, só demorou um pouco no pedido em horário de pico.',
  },
  {
    id: 'joana-p',
    venueId: 'bar-do-ze',
    author: 'Joana P.',
    initial: 'J',
    date: 'há 3 dias',
    stars: 5,
    text: 'Petiscos bem servidos e atendimento muito atencioso.',
  },
  {
    id: 'lucas-a',
    venueId: 'quintal-74',
    author: 'Lucas A.',
    initial: 'L',
    date: 'há 5 dias',
    stars: 4,
    text: 'Música ótima e ambiente agradável para ir com amigos.',
  },
  {
    id: 'beatriz-m',
    venueId: 'terraco-anil',
    author: 'Beatriz M.',
    initial: 'B',
    date: 'há 1 semana',
    stars: 5,
    text: 'Vista linda, bons drinks e equipe muito prestativa.',
  },
];
