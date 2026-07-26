import type { EnvironmentConfig } from '../environment.types';
import {
  blockingIssues,
  normaliseBaseUrl,
  parseApiBaseUrl,
  validateEnvironmentConfig,
} from '../environment.validation';

/**
 * Environment validation (§6.1).
 *
 * Exercised as pure functions over an explicit config, so each environment's rules
 * can be asserted without mutating `process.env`.
 */

function config(overrides: Partial<EnvironmentConfig> = {}): EnvironmentConfig {
  return {
    environment: 'production',
    apiBaseUrl: 'https://api.budd.app',
    apiTimeoutMs: 15_000,
    enableMocks: false,
    whatsappSupportNumber: null,
    ...overrides,
  };
}

describe('normaliseBaseUrl', () => {
  it('strips trailing slashes so paths never double up', () => {
    expect(normaliseBaseUrl('https://api.budd.app/')).toBe('https://api.budd.app');
    expect(normaliseBaseUrl('https://api.budd.app///')).toBe('https://api.budd.app');
    expect(normaliseBaseUrl('  https://api.budd.app  ')).toBe('https://api.budd.app');
  });
});

describe('parseApiBaseUrl', () => {
  it('blocks a missing URL in production', () => {
    const { url, issue } = parseApiBaseUrl(null, 'production');

    expect(url).toBeNull();
    expect(issue?.code).toBe('api_url_missing');
    // There is no fallback host any more; production cannot start without one.
    expect(issue?.severity).toBe('blocking');
  });

  it('only warns about a missing URL in development', () => {
    const { issue } = parseApiBaseUrl(null, 'development');

    // Dev runs against the in-memory backend or reports features unavailable.
    expect(issue?.code).toBe('api_url_missing');
    expect(issue?.severity).toBe('warning');
  });

  it('rejects a malformed URL', () => {
    expect(parseApiBaseUrl('not a url', 'development').issue?.code).toBe('api_url_invalid');
    expect(parseApiBaseUrl('https://api budd app', 'development').issue?.code).toBe(
      'api_url_invalid',
    );
  });

  it('rejects a non-http protocol', () => {
    expect(parseApiBaseUrl('ftp://api.budd.app', 'development').issue?.code).toBe(
      'api_url_invalid',
    );
  });

  it('rejects embedded credentials in any environment', () => {
    // These would be inlined into the JS bundle.
    const { issue } = parseApiBaseUrl('https://user:pass@api.budd.app', 'development');
    expect(issue?.code).toBe('api_url_credentials');
    expect(issue?.severity).toBe('blocking');
  });

  it('rejects known placeholder hosts', () => {
    for (const host of ['https://example.com', 'https://api.exemplo.com', 'https://test.com']) {
      expect(parseApiBaseUrl(host, 'development').issue?.code).toBe('api_url_placeholder');
    }
  });

  it('requires https in production', () => {
    expect(parseApiBaseUrl('http://api.budd.app', 'production').issue?.code).toBe(
      'api_url_insecure',
    );
  });

  it('allows http outside production', () => {
    expect(parseApiBaseUrl('http://192.168.0.10:3000', 'development').issue).toBeNull();
  });

  it('blocks localhost and private addresses in production', () => {
    for (const host of [
      'https://localhost:3000',
      'https://127.0.0.1',
      'https://10.0.2.2',
      'https://192.168.1.5',
      'https://172.16.0.1',
    ]) {
      expect(parseApiBaseUrl(host, 'production').issue?.code).toBe('api_url_local');
    }
  });

  it('allows localhost in development', () => {
    expect(parseApiBaseUrl('http://localhost:3000', 'development').issue).toBeNull();
  });

  it('accepts a valid production URL', () => {
    const { url, issue } = parseApiBaseUrl('https://api.budd.app/', 'production');

    expect(issue).toBeNull();
    expect(url?.hostname).toBe('api.budd.app');
  });

  it('does not treat a public domain as a placeholder by heuristic', () => {
    // §3.4: legitimate domains must not be rejected by guesswork.
    expect(parseApiBaseUrl('https://api.budd.app', 'production').issue).toBeNull();
    expect(parseApiBaseUrl('https://staging-api.budd.app', 'staging').issue).toBeNull();
  });
});

describe('validateEnvironmentConfig', () => {
  it('accepts a well-formed production config', () => {
    const result = validateEnvironmentConfig(config(), 'https://api.budd.app');

    expect(result.isValid).toBe(true);
    expect(blockingIssues(result)).toHaveLength(0);
  });

  it('blocks mocks in production', () => {
    const result = validateEnvironmentConfig(
      config({ enableMocks: true }),
      'https://api.budd.app',
    );

    // Shipping the in-memory backend would let a release fabricate orders.
    expect(result.isValid).toBe(false);
    expect(blockingIssues(result).map((issue) => issue.code)).toContain(
      'mocks_enabled_in_production',
    );
  });

  it('allows mocks in development', () => {
    const result = validateEnvironmentConfig(
      config({ environment: 'development', enableMocks: true }),
      'http://localhost:3000',
    );

    expect(result.isValid).toBe(true);
  });

  it('rejects a non-numeric timeout', () => {
    const result = validateEnvironmentConfig(
      config({ apiTimeoutMs: Number.NaN }),
      'https://api.budd.app',
    );

    expect(blockingIssues(result).map((issue) => issue.code)).toContain('api_timeout_invalid');
  });

  it('rejects a non-positive timeout', () => {
    const result = validateEnvironmentConfig(config({ apiTimeoutMs: 0 }), 'https://api.budd.app');

    expect(result.isValid).toBe(false);
  });

  it('never echoes the offending value in a message', () => {
    const secretish = 'https://user:hunter2@api.budd.app';
    const result = validateEnvironmentConfig(config(), secretish);

    // Config errors routinely land in CI logs.
    for (const issue of result.issues) {
      expect(issue.message).not.toContain('hunter2');
      expect(issue.message).not.toContain(secretish);
    }
  });

  it('reports several blocking issues at once', () => {
    const result = validateEnvironmentConfig(
      config({ enableMocks: true, apiTimeoutMs: -1 }),
      'http://localhost:3000',
    );

    expect(blockingIssues(result).length).toBeGreaterThanOrEqual(3);
  });
});

describe('resolved environment module', () => {
  it('exposes no fallback API host', () => {
    // The B-01 defect in one assertion: a missing URL must stay null rather than
    // silently becoming a placeholder host.
    const { environment } = require('../environment');

    if (!process.env.EXPO_PUBLIC_API_URL) {
      expect(environment.apiBaseUrl).toBeNull();
    }
  });

  it('is frozen, so nothing can mutate configuration at runtime', () => {
    const { environment } = require('../environment');
    expect(Object.isFrozen(environment)).toBe(true);
  });

  it('reports the backend mode consistently with the config', () => {
    const { environment, resolveBackendMode } = require('../environment');
    const mode = resolveBackendMode();

    if (environment.enableMocks) expect(mode).toBe('dev');
    else if (environment.apiBaseUrl) expect(mode).toBe('http');
    else expect(mode).toBe('unavailable');
  });
});
