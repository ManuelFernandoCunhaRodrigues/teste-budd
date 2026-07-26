import type { Place } from '@/types/domain';

/**
 * Pins and bottom-sheet cards on the map screen.
 *
 * Note: in the prototype both bar cards opened the default venue detail
 * because no venue was attached to the tap. "Cosme Brito" therefore points at
 * `pixzinho-dos-crias` to preserve that behaviour exactly — it is a data gap in
 * the prototype, not intended product behaviour, and should be repointed at a
 * real venue once the API supplies one.
 */
export const PLACES: Place[] = [
  {
    id: 'pixzinho',
    name: 'Pixzinho Dos Cri…',
    address: 'Rua Lina Figuereido. Jardins de Allah',
    hours:
      'Segunda: 09:00 às 23:00; Terça: 09:00 às 23:00; Quarta: 09:00 às 23:00; Quinta: 09:00 às 23:00; Sext…',
    image: 'neutral',
    coordinate: { latitude: -2.5487, longitude: -44.249 },
    target: { type: 'bar', id: 'pixzinho-dos-crias' },
  },
  {
    id: 'cosme-brito',
    name: 'Cosme Brito',
    address: 'Rua Alto da Paz - Aurora - São Luís/MA 47 B',
    hours: 'Segunda: 07:00 às 07:00; Terça: 12:09 às 00:09',
    image: 'amber',
    coordinate: { latitude: -2.5561, longitude: -44.2432 },
    target: { type: 'bar', id: 'pixzinho-dos-crias' },
  },
  {
    id: 'festival-kommander',
    name: 'Festival Kommander',
    address: 'Avenida Santos Dumont - Anil - São Luís/MA',
    hours: '15:00 - 23:50',
    image: 'forest',
    coordinate: { latitude: -2.5423, longitude: -44.2601 },
    target: { type: 'event', id: 'kommander-of-kaos-iv' },
  },
];
