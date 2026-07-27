import type { Place } from '@/types/domain';

/**
 * Pins and bottom-sheet cards on the map screen.
 *
 * Note: in the prototype both bar cards opened the default venue detail because
 * no venue was attached to the tap. "Cosme Brito" therefore points at
 * `pixzinho-dos-crias` to preserve that behaviour exactly. Repoint it once the
 * API supplies a real venue id.
 */
export const PLACES: Place[] = [
  {
    id: 'pixzinho',
    name: 'Pixzinho Dos Crias',
    category: 'Boteco e petiscos',
    address: 'Rua Lina Figueiredo, Jardins de Allah',
    distance: '2.4 km',
    hours:
      'Segunda: 09:00 as 23:00; Terca: 09:00 as 23:00; Quarta: 09:00 as 23:00; Quinta: 09:00 as 23:00; Sext...',
    rating: '4.9',
    isOpen: true,
    image: 'neutral',
    coordinate: { latitude: -2.5487, longitude: -44.249 },
    target: { type: 'bar', id: 'pixzinho-dos-crias' },
  },
  {
    id: 'cosme-brito',
    name: 'Cosme Brito',
    category: 'Bar local',
    address: 'Rua Alto da Paz, Aurora, Sao Luis/MA 47 B',
    distance: '3.1 km',
    hours:
      'Segunda: 07:00 as 12:09; Terca: 07:00 as 00:09; Quarta: 07:00 as 00:09; Quinta...',
    rating: '4.6',
    isOpen: false,
    image: 'amber',
    coordinate: { latitude: -2.5561, longitude: -44.2432 },
    target: { type: 'bar', id: 'pixzinho-dos-crias' },
  },
  {
    id: 'festival-kommander',
    name: 'Festival Kommander',
    category: 'Evento',
    address: 'Avenida Santos Dumont, Anil, Sao Luis/MA',
    distance: '4.8 km',
    hours: '15:00 - 23:50',
    image: 'forest',
    coordinate: { latitude: -2.5423, longitude: -44.2601 },
    target: { type: 'event', id: 'kommander-of-kaos-iv' },
  },
];
