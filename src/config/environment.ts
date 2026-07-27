import { validatePhoneNumber } from './support';
import type {
  AppEnvironment,
  BackendMode,
  EnvironmentConfig,
  EnvironmentValidationResult,
} from './environment.types';
import {
  blockingIssues,
  normaliseBaseUrl,
  parseApiBaseUrl,
  validateEnvironmentConfig,
} from './environment.validation';

/**
 * Central access point for environment configuration.
 *
 * Only `EXPO_PUBLIC_*` variables are readable at runtime, and everything read
 * here is inlined into the JS bundle — never put a secret in this file or in
 * `.env`. Anything privileged belongs behind the API.
 *
 * Two things changed with B-01. There is no longer a fallback API host: a missing
 * URL stays `null` and is reported, because substituting a placeholder made a
 * misconfigured build indistinguishable from a working one. And the target
 * environment is explicit rather than inferred from `__DEV__`, so a staging build
 * is not treated as production.
 */

const DEFAULT_TIMEOUT_MS = 15_000;

function readEnvironmentName(): AppEnvironment {
  const raw = process.env.EXPO_PUBLIC_APP_ENV?.trim().toLowerCase();

  if (raw === 'production' || raw === 'staging' || raw === 'development') return raw;

  // Unset: a dev bundle is development, anything else is treated as production —
  // failing towards the strictest rules rather than the loosest.
  return __DEV__ ? 'development' : 'production';
}

function readTimeout(): number {
  const raw = process.env.EXPO_PUBLIC_API_TIMEOUT?.trim();
  if (!raw) return DEFAULT_TIMEOUT_MS;

  const parsed = Number(raw);
  // Non-numeric input is surfaced as an issue by the validator rather than
  // silently reverting to the default.
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || null;
const environmentName = readEnvironmentName();

/** Mocks are additionally gated by `__DEV__`, so a production bundle cannot reach them. */
const mocksRequested = process.env.EXPO_PUBLIC_ENABLE_DEV_BACKEND === 'true';

/** Same gate as the mock backend: opt-in, and impossible to reach in production. */
const mockMapRequested = process.env.EXPO_PUBLIC_USE_MOCK_MAP === 'true';

const { url: parsedApiUrl } = parseApiBaseUrl(rawApiUrl, environmentName);
const phone = validatePhoneNumber(process.env.EXPO_PUBLIC_WHATSAPP_SUPPORT_NUMBER);

export const environment: EnvironmentConfig = Object.freeze({
  environment: environmentName,
  // Only a URL that passed validation is exposed; anything else is `null`, so no
  // caller can accidentally request against a rejected value.
  apiBaseUrl: parsedApiUrl ? normaliseBaseUrl(parsedApiUrl.toString()) : null,
  apiTimeoutMs: readTimeout(),
  enableMocks: __DEV__ && mocksRequested,
  useMockMap: __DEV__ && mockMapRequested,
  whatsappSupportNumber: phone.valid ? phone.number : null,
});

/** Convenience flags derived from the frozen config. */
export const isProduction = environment.environment === 'production';
export const isDevelopment = environment.environment === 'development';

/**
 * Validates the resolved configuration.
 *
 * Returns a result instead of throwing so the bootstrap can render an error
 * screen. Throwing at module scope produced a blank crash with no way to retry.
 */
export function validateEnvironment(): EnvironmentValidationResult {
  const result = validateEnvironmentConfig(environment, rawApiUrl);

  // Reported separately: the number is optional, so a bad one degrades the
  // support entry point rather than blocking startup.
  if (!phone.valid && phone.reason !== 'empty') {
    return {
      isValid: result.isValid,
      issues: [
        ...result.issues,
        {
          code: 'whatsapp_number_invalid',
          severity: 'warning',
          message:
            'EXPO_PUBLIC_WHATSAPP_SUPPORT_NUMBER é inválida ou é um placeholder conhecido. ' +
            'O atendimento pelo WhatsApp fica desabilitado.',
        },
      ],
    };
  }

  return result;
}

/** True when the configuration is unusable and the app must not proceed. */
export function hasBlockingEnvironmentIssues(): boolean {
  return blockingIssues(validateEnvironment()).length > 0;
}

/**
 * Which implementation backs the critical flows.
 *
 * `unavailable` is a first-class outcome: with no configured API and no mocks,
 * server-dependent features report that honestly rather than failing oddly.
 */
export function resolveBackendMode(): BackendMode {
  if (environment.enableMocks) return 'dev';
  if (environment.apiBaseUrl) return 'http';
  return 'unavailable';
}

export type {
  AppEnvironment,
  BackendMode,
  EnvironmentConfig,
  EnvironmentValidationResult,
} from './environment.types';
