import type { Review } from '@/types/domain';

/** Seed reviews shown under the rating summary. */
export const REVIEWS: Review[] = [
  {
    id: 'marina-s',
    author: 'Marina S.',
    initial: 'M',
    date: 'há 2 dias',
    stars: 5,
    text: 'Ambiente ótimo, atendimento rápido e bebidas geladas. Voltarei com certeza!',
  },
  {
    id: 'rafael-l',
    author: 'Rafael L.',
    initial: 'R',
    date: 'há 1 semana',
    stars: 5,
    text: 'Melhor lugar da região pra curtir com os amigos. Recomendo o combo.',
  },
  {
    id: 'camila-t',
    author: 'Camila T.',
    initial: 'C',
    date: 'há 2 semanas',
    stars: 4,
    text: 'Muito bom, só demorou um pouco no pedido em horário de pico.',
  },
];
