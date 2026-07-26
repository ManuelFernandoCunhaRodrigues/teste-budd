import { BARS } from '@/mocks/bars';
import { EVENTS } from '@/mocks/events';
import { RECOMMENDATIONS } from '@/mocks/profile';
import type { Recommendation } from '@/types/domain';

import {
  isResolvableTarget,
  recommendationHref,
  recommendationTargetLabel,
} from '../recommendationTargets';

/**
 * Recommendation destinations (M-03).
 *
 * Every card used to push `/role` regardless of what it recommended, because the
 * target only named a feed tab.
 */

describe('recommendationHref', () => {
  it('routes a bar recommendation to that bar', () => {
    const href = recommendationHref({
      id: 'r1',
      kind: 'Bar',
      name: 'Quintal 74',
      reason: '',
      image: 'blue',
      target: { type: 'bar', barId: 'quintal-74' },
    });

    expect(href).toEqual({ pathname: '/bar/[id]', params: { id: 'quintal-74' } });
  });

  it('routes an event recommendation to that event', () => {
    const href = recommendationHref({
      id: 'r2',
      kind: 'Evento',
      name: 'Sunset',
      reason: '',
      image: 'violet',
      target: { type: 'event', eventId: 'sunset-underground' },
    });

    expect(href).toEqual({ pathname: '/event/[id]', params: { id: 'sunset-underground' } });
  });

  it('never routes to the feed', () => {
    // The defect: every target collapsed to `/role`.
    for (const recommendation of RECOMMENDATIONS) {
      expect(JSON.stringify(recommendationHref(recommendation))).not.toContain('/role');
    }
  });

  it('gives distinct destinations to distinct recommendations', () => {
    const hrefs = RECOMMENDATIONS.map((item) => JSON.stringify(recommendationHref(item)));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe('isResolvableTarget', () => {
  it('every seeded recommendation points at an id that exists', () => {
    // Guards the data: a typo here would send the user to an error screen.
    for (const recommendation of RECOMMENDATIONS) {
      expect(isResolvableTarget(recommendation)).toBe(true);
    }
  });

  it('rejects an unknown bar', () => {
    const broken: Recommendation = {
      id: 'r3',
      kind: 'Bar',
      name: 'Inexistente',
      reason: '',
      image: 'blue',
      target: { type: 'bar', barId: 'nao-existe' },
    };

    expect(isResolvableTarget(broken)).toBe(false);
  });

  it('rejects an unknown event', () => {
    const broken: Recommendation = {
      id: 'r4',
      kind: 'Evento',
      name: 'Inexistente',
      reason: '',
      image: 'blue',
      target: { type: 'event', eventId: 'nao-existe' },
    };

    expect(isResolvableTarget(broken)).toBe(false);
  });

  it('a product suggestion targets a venue that sells something', () => {
    const product = RECOMMENDATIONS.find((item) => item.kind === 'Produto');
    expect(product).toBeDefined();
    expect(product?.target.type).toBe('bar');

    // There is no product route, so the venue's menu is the real destination.
    const bar = BARS.find(
      (candidate) => product?.target.type === 'bar' && candidate.id === product.target.barId,
    );
    expect(bar).toBeDefined();
    expect(bar?.sections.length).toBeGreaterThan(0);
  });

  it('the event target exists in the events catalogue', () => {
    const event = RECOMMENDATIONS.find((item) => item.kind === 'Evento');
    expect(
      EVENTS.some(
        (candidate) => event?.target.type === 'event' && candidate.id === event.target.eventId,
      ),
    ).toBe(true);
  });
});

describe('recommendationTargetLabel', () => {
  it('describes the destination for a hint', () => {
    for (const recommendation of RECOMMENDATIONS) {
      expect(recommendationTargetLabel(recommendation)).toMatch(/Abrir o (bar|evento)/);
    }
  });
});
