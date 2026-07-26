import { Linking } from 'react-native';

import { ARTISTS } from '@/mocks/artists';

import {
  EXTERNAL_URL_ERROR_MESSAGES,
  isLaunchableUrl,
  openExternalUrl,
} from '../openExternalUrl';

/**
 * External links (M-02).
 *
 * The artist "Site" button called the card's own `onPress`, so it opened the
 * artist sheet and never a website.
 */
const canOpenURL = jest.spyOn(Linking, 'canOpenURL');
const openURL = jest.spyOn(Linking, 'openURL');

beforeEach(() => {
  canOpenURL.mockReset();
  openURL.mockReset();
});

describe('isLaunchableUrl', () => {
  it('accepts http and https', () => {
    expect(isLaunchableUrl('https://example-artist.test')).toBe(true);
    expect(isLaunchableUrl('http://example-artist.test')).toBe(true);
  });

  it('rejects absent or blank values', () => {
    expect(isLaunchableUrl(undefined)).toBe(false);
    expect(isLaunchableUrl(null)).toBe(false);
    expect(isLaunchableUrl('')).toBe(false);
    expect(isLaunchableUrl('   ')).toBe(false);
  });

  it('rejects a malformed URL', () => {
    expect(isLaunchableUrl('not a url')).toBe(false);
    expect(isLaunchableUrl('example-artist.test')).toBe(false);
  });

  it('rejects schemes we refuse to launch', () => {
    // These arrive from content, so the scheme check is a real boundary.
    expect(isLaunchableUrl('javascript:alert(1)')).toBe(false);
    expect(isLaunchableUrl('file:///etc/passwd')).toBe(false);
    expect(isLaunchableUrl('data:text/html,<h1>x</h1>')).toBe(false);
  });
});

describe('openExternalUrl', () => {
  it('opens a valid URL once', async () => {
    canOpenURL.mockResolvedValue(true);
    openURL.mockResolvedValue(true);

    await expect(openExternalUrl('https://example-artist.test')).resolves.toEqual({
      status: 'opened',
    });
    expect(openURL).toHaveBeenCalledTimes(1);
  });

  it('refuses an invalid URL without touching Linking', async () => {
    await expect(openExternalUrl('javascript:alert(1)')).resolves.toEqual({ status: 'invalid' });

    expect(canOpenURL).not.toHaveBeenCalled();
    expect(openURL).not.toHaveBeenCalled();
  });

  it('refuses a missing URL', async () => {
    await expect(openExternalUrl(undefined)).resolves.toEqual({ status: 'invalid' });
    expect(openURL).not.toHaveBeenCalled();
  });

  it('reports an unsupported link', async () => {
    canOpenURL.mockResolvedValue(false);

    await expect(openExternalUrl('https://example-artist.test')).resolves.toEqual({
      status: 'unsupported',
    });
    expect(openURL).not.toHaveBeenCalled();
  });

  it('reports a failure when opening throws', async () => {
    canOpenURL.mockResolvedValue(true);
    openURL.mockRejectedValue(new Error('no handler'));

    await expect(openExternalUrl('https://example-artist.test')).resolves.toEqual({
      status: 'failed',
    });
  });

  it('trims surrounding whitespace before opening', async () => {
    canOpenURL.mockResolvedValue(true);
    openURL.mockResolvedValue(true);

    await openExternalUrl('  https://example-artist.test  ');
    expect(openURL).toHaveBeenCalledWith('https://example-artist.test');
  });

  it('has user-facing copy for every failure', () => {
    for (const status of ['invalid', 'unsupported', 'failed'] as const) {
      expect(EXTERNAL_URL_ERROR_MESSAGES[status]).toBeTruthy();
    }
  });
});

describe('artist catalogue', () => {
  it('carries no invented website URLs', () => {
    // No real artist site is known, and inventing a domain could point at a real
    // stranger's page — the same failure mode as the WhatsApp placeholder.
    for (const artist of ARTISTS) {
      expect(artist.website).toBeUndefined();
    }
  });

  it('so the site control is disabled for every seeded artist', () => {
    for (const artist of ARTISTS) {
      expect(isLaunchableUrl(artist.website)).toBe(false);
    }
  });
});
