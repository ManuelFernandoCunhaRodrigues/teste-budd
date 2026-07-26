import type {
  AppEnvironment,
  EnvironmentConfig,
  EnvironmentIssue,
  EnvironmentValidationResult,
} from './environment.types';

/**
 * Configuration validation.
 *
 * Kept as pure functions over an explicit config object so the rules can be
 * tested per environment without touching `process.env`.
 */

/**
 * Hosts that are unambiguously stand-ins.
 *
 * An explicit list rather than a heuristic: §3.4 warns against rejecting a
 * legitimate domain by guesswork. `api.budd.app` is deliberately **not** here —
 * it is a plausible production host, and the B-01 defect was that it was applied
 * as a *silent fallback*, not the value itself. Setting it must be a deliberate
 * act.
 */
const PLACEHOLDER_HOSTS = new Set([
  'example.com',
  'www.example.com',
  'api.example.com',
  'example.org',
  'example.net',
  'exemplo.com',
  'api.exemplo.com',
  'test.com',
  'api.test.com',
  'changeme',
  'your-api',
  'your-api.com',
  'api.changeme.com',
]);

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0', '10.0.2.2']);

/** RFC 1918 / link-local ranges, which cannot serve a released app. */
function isPrivateAddress(hostname: string): boolean {
  if (LOCAL_HOSTNAMES.has(hostname)) return true;

  const parts = hostname.split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return false;

  const [a, b] = parts.map((part) => Number.parseInt(part, 10));
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;

  return false;
}

/** Strips trailing slashes so `baseUrl + path` never doubles up. */
export function normaliseBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export interface ParsedApiUrl {
  readonly url: URL | null;
  readonly issue: EnvironmentIssue | null;
}

/** Parses and range-checks the API base URL for a given environment. */
export function parseApiBaseUrl(
  raw: string | null,
  environment: AppEnvironment,
): ParsedApiUrl {
  const isProduction = environment === 'production';

  if (!raw) {
    return {
      url: null,
      issue: {
        code: 'api_url_missing',
        // Only production cannot function without it: development runs against
        // the in-memory backend or reports features as unavailable.
        severity: isProduction ? 'blocking' : 'warning',
        message:
          'EXPO_PUBLIC_API_URL não está definida. Em produção o build é bloqueado; ' +
          'em desenvolvimento os fluxos que dependem do servidor ficam indisponíveis.',
      },
    };
  }

  if (/\s/.test(raw)) {
    return {
      url: null,
      issue: {
        code: 'api_url_invalid',
        severity: 'blocking',
        message: 'EXPO_PUBLIC_API_URL contém espaços.',
      },
    };
  }

  let url: URL;
  try {
    url = new URL(normaliseBaseUrl(raw));
  } catch {
    return {
      url: null,
      issue: {
        code: 'api_url_invalid',
        severity: 'blocking',
        message: 'EXPO_PUBLIC_API_URL não é uma URL válida.',
      },
    };
  }

  if (url.username || url.password) {
    return {
      url: null,
      issue: {
        code: 'api_url_credentials',
        severity: 'blocking',
        // Credentials in a base URL would be inlined into the JS bundle.
        message: 'EXPO_PUBLIC_API_URL contém credenciais embutidas.',
      },
    };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return {
      url: null,
      issue: {
        code: 'api_url_invalid',
        severity: 'blocking',
        message: 'EXPO_PUBLIC_API_URL deve usar http ou https.',
      },
    };
  }

  if (PLACEHOLDER_HOSTS.has(url.hostname.toLowerCase())) {
    return {
      url: null,
      issue: {
        code: 'api_url_placeholder',
        severity: 'blocking',
        message: 'EXPO_PUBLIC_API_URL aponta para um host de exemplo.',
      },
    };
  }

  if (isProduction && url.protocol !== 'https:') {
    return {
      url: null,
      issue: {
        code: 'api_url_insecure',
        severity: 'blocking',
        message: 'Em produção EXPO_PUBLIC_API_URL deve usar https.',
      },
    };
  }

  if (isProduction && isPrivateAddress(url.hostname)) {
    return {
      url: null,
      issue: {
        code: 'api_url_local',
        severity: 'blocking',
        message: 'Em produção EXPO_PUBLIC_API_URL não pode apontar para um endereço local ou privado.',
      },
    };
  }

  return { url, issue: null };
}

/** Validates a fully resolved config. */
export function validateEnvironmentConfig(
  config: EnvironmentConfig,
  rawApiUrl: string | null,
): EnvironmentValidationResult {
  const issues: EnvironmentIssue[] = [];

  const { issue: urlIssue } = parseApiBaseUrl(rawApiUrl, config.environment);
  if (urlIssue) issues.push(urlIssue);

  if (!Number.isFinite(config.apiTimeoutMs) || config.apiTimeoutMs <= 0) {
    issues.push({
      code: 'api_timeout_invalid',
      severity: 'blocking',
      message: 'EXPO_PUBLIC_API_TIMEOUT deve ser um número positivo de milissegundos.',
    });
  }

  if (config.environment === 'production' && config.enableMocks) {
    issues.push({
      code: 'mocks_enabled_in_production',
      severity: 'blocking',
      // Shipping the in-memory backend would let a release fabricate orders and
      // wallet balances.
      message: 'O backend de desenvolvimento não pode estar habilitado em produção.',
    });
  }

  return {
    isValid: issues.every((issue) => issue.severity !== 'blocking'),
    issues,
  };
}

/** The blocking subset, for the bootstrap error screen. */
export function blockingIssues(
  result: EnvironmentValidationResult,
): readonly EnvironmentIssue[] {
  return result.issues.filter((issue) => issue.severity === 'blocking');
}
