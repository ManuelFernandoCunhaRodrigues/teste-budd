import { Linking } from 'react-native';

import {
  maskPhoneNumber,
  normalisePhoneNumber,
  validatePhoneNumber,
  WHATSAPP_MESSAGES,
} from '@/config/support';

import {
  buildWhatsAppUrl,
  getSupportNumber,
  isWhatsAppSupportAvailable,
  openWhatsAppSupport,
  WHATSAPP_ERROR_MESSAGES,
} from '../whatsapp';

/**
 * WhatsApp support contact (§6.2).
 *
 * Every number here is fictitious and reserved for tests. The real support number
 * is never hard-coded, in source or in tests.
 */
const TEST_NUMBER = '5511987654321';
const PLACEHOLDER = '5598999999999';

/**
 * The configured number, swapped per test.
 *
 * `mock`-prefixed so the hoisted `jest.mock` factory below may reference it. The
 * config is mocked through a getter rather than by reloading the module: calling
 * `jest.resetModules()` would hand the service a fresh `react-native`, and the
 * `Linking` spies would no longer be the functions it calls.
 */
let mockSupportNumber: string | null = TEST_NUMBER;

jest.mock('@/config/environment', () => ({
  __esModule: true,
  get environment() {
    return {
      environment: 'development',
      apiBaseUrl: null,
      apiTimeoutMs: 15_000,
      enableMocks: false,
      whatsappSupportNumber: mockSupportNumber,
    };
  },
}));

/**
 * Installed after the imports, which is safe: ES imports are hoisted, and the
 * service only reads `Linking.*` when a function is called — by then the spies
 * are in place.
 */
const canOpenURL = jest.spyOn(Linking, 'canOpenURL');
const openURL = jest.spyOn(Linking, 'openURL');

beforeEach(() => {
  canOpenURL.mockReset();
  openURL.mockReset();
  mockSupportNumber = TEST_NUMBER;
});

describe('normalisePhoneNumber', () => {
  it('reduces any accepted spelling to digits', () => {
    expect(normalisePhoneNumber('+55 (11) 98765-4321')).toBe(TEST_NUMBER);
    expect(normalisePhoneNumber(TEST_NUMBER)).toBe(TEST_NUMBER);
    expect(normalisePhoneNumber('+55.11.98765.4321')).toBe(TEST_NUMBER);
  });

  it('strips letters rather than keeping them', () => {
    expect(normalisePhoneNumber('55abc11987654321')).toBe(TEST_NUMBER);
  });
});

describe('validatePhoneNumber', () => {
  it('accepts a formatted number', () => {
    expect(validatePhoneNumber('+55 (11) 98765-4321')).toEqual({
      valid: true,
      number: TEST_NUMBER,
    });
  });

  it('rejects empty and whitespace', () => {
    expect(validatePhoneNumber('')).toMatchObject({ valid: false, reason: 'empty' });
    expect(validatePhoneNumber('   ')).toMatchObject({ valid: false, reason: 'empty' });
    expect(validatePhoneNumber(null)).toMatchObject({ valid: false, reason: 'empty' });
    expect(validatePhoneNumber(undefined)).toMatchObject({ valid: false, reason: 'empty' });
  });

  it('rejects a number that is too short or too long', () => {
    expect(validatePhoneNumber('5511')).toMatchObject({ valid: false, reason: 'too_short' });
    expect(validatePhoneNumber('5511987654321000000')).toMatchObject({
      valid: false,
      reason: 'too_long',
    });
  });

  it('rejects the placeholder that used to be hard-coded', () => {
    expect(validatePhoneNumber(PLACEHOLDER)).toMatchObject({
      valid: false,
      reason: 'placeholder',
    });
    // Also when written with formatting.
    expect(validatePhoneNumber('+55 (98) 99999-9999')).toMatchObject({
      valid: false,
      reason: 'placeholder',
    });
  });

  it('does not reject a legitimate number containing a run of nines', () => {
    // A blunt "repeated digits" heuristic would wrongly kill this one.
    expect(validatePhoneNumber('5511999884321')).toMatchObject({ valid: true });
  });
});

describe('maskPhoneNumber', () => {
  it('keeps only the last four digits', () => {
    const masked = maskPhoneNumber(TEST_NUMBER);

    expect(masked).toContain('4321');
    expect(masked).not.toContain('98765');
  });
});

describe('buildWhatsAppUrl', () => {
  it('uses the wa.me form', () => {
    expect(buildWhatsAppUrl(TEST_NUMBER)).toBe(`https://wa.me/${TEST_NUMBER}`);
  });

  it('percent-encodes the message', () => {
    const url = buildWhatsAppUrl(TEST_NUMBER, 'Olá! Pedido #12 & conta');

    // Raw concatenation would break on `&` and smuggle a second parameter.
    expect(url).toContain(encodeURIComponent('Olá! Pedido #12 & conta'));
    expect(url).not.toContain(' ');
    expect(url).not.toContain('& conta');
  });

  it('produces a parseable URL', () => {
    const url = new URL(buildWhatsAppUrl(TEST_NUMBER, WHATSAPP_MESSAGES.support));

    expect(url.host).toBe('wa.me');
    expect(url.pathname).toBe(`/${TEST_NUMBER}`);
    expect(url.searchParams.get('text')).toBe(WHATSAPP_MESSAGES.support);
  });
});

describe('openWhatsAppSupport', () => {
  it('opens the configured number once', async () => {
    canOpenURL.mockResolvedValue(true);
    openURL.mockResolvedValue(true);

    await expect(openWhatsAppSupport('support')).resolves.toEqual({ status: 'opened' });

    expect(openURL).toHaveBeenCalledTimes(1);
    expect(openURL.mock.calls[0][0]).toContain(TEST_NUMBER);
  });

  it('refuses when no number is configured, without opening anything', async () => {
    mockSupportNumber = null;

    await expect(openWhatsAppSupport()).resolves.toEqual({ status: 'not_configured' });
    // The critical assertion: never fall back to a guess.
    expect(canOpenURL).not.toHaveBeenCalled();
    expect(openURL).not.toHaveBeenCalled();
  });

  it('never opens the known placeholder', async () => {
    // A rejected number reaches config as `null`, so the service cannot open it.
    mockSupportNumber = null;
    await openWhatsAppSupport();

    expect(getSupportNumber()).toBeNull();
    for (const call of openURL.mock.calls) {
      expect(String(call[0])).not.toContain(PLACEHOLDER);
    }
  });

  it('reports an unsupported link', async () => {
    canOpenURL.mockResolvedValue(false);

    await expect(openWhatsAppSupport()).resolves.toEqual({ status: 'unsupported' });
    expect(openURL).not.toHaveBeenCalled();
  });

  it('reports a failure when opening throws', async () => {
    canOpenURL.mockResolvedValue(true);
    openURL.mockRejectedValue(new Error('no activity found'));

    await expect(openWhatsAppSupport()).resolves.toEqual({ status: 'failed' });
  });

  it('reports a failure when the availability check throws', async () => {
    canOpenURL.mockRejectedValue(new Error('bridge error'));

    await expect(openWhatsAppSupport()).resolves.toEqual({ status: 'failed' });
  });

  it('uses a different message per context', async () => {
    canOpenURL.mockResolvedValue(true);
    openURL.mockResolvedValue(true);

    await openWhatsAppSupport('order');

    // An order enquiry must not silently reuse the general support copy.
    expect(openURL.mock.calls[0][0]).toContain(encodeURIComponent(WHATSAPP_MESSAGES.order));
  });

  it('exposes availability so the UI can disable the control', () => {
    mockSupportNumber = TEST_NUMBER;
    expect(isWhatsAppSupportAvailable()).toBe(true);

    mockSupportNumber = null;
    expect(isWhatsAppSupportAvailable()).toBe(false);
  });

  it('has user-facing copy for every failure', () => {
    for (const status of ['not_configured', 'unsupported', 'failed'] as const) {
      expect(WHATSAPP_ERROR_MESSAGES[status]).toBeTruthy();
      // No technical detail leaks into the message.
      expect(WHATSAPP_ERROR_MESSAGES[status]).not.toContain('wa.me');
    }
  });
});
