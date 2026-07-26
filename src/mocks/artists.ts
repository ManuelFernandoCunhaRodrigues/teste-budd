import type { Artist } from '@/types/domain';

/** Line-up artists. Follower counts are in thousands, as in the design. */
export const ARTISTS: Artist[] = [
  { id: 'cecilia-leite', name: 'Cecília Leite', shortName: 'Cecília L.', albums: 2, followers: 27 },
  { id: 'aguila', name: 'Águila', shortName: 'Águila', albums: 8, followers: 40 },
  { id: 'laue-ribeiro', name: 'Lauê Ribeiro', shortName: 'Lauê R.', albums: 3, followers: 18 },
  { id: 'dj-kaos', name: 'DJ Kaos', shortName: 'DJ Kaos', albums: 5, followers: 52 },
];

/** Attribution shown on each artist card. */
export const ARTIST_DATA_SOURCE = 'Deezer';
