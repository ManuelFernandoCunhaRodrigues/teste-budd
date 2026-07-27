import { useMemo } from 'react';

import { findLineUpArtist, showsForArtist } from '../services/lineupService';
import type { LineUpArtist, LineUpShow } from '../types';

export interface ArtistDetailsState {
  artist: LineUpArtist | null;
  shows: LineUpShow[];
}

export function useArtistDetails(artistId: string): ArtistDetailsState {
  return useMemo(
    () => ({
      artist: findLineUpArtist(artistId),
      shows: showsForArtist(artistId),
    }),
    [artistId],
  );
}
