import { resolveBackendMode } from '@/config/environment';

import type { BackendMode, BackendPort } from './backendTypes';
import { devBackend } from './devBackend';
import { httpBackend } from './httpBackend';
import { unavailableBackend } from './unavailableBackend';

/**
 * Chooses the implementation once, at module load.
 *
 * Resolution order is deliberate: an explicitly enabled dev backend wins, then a
 * configured API, then "unavailable". There is no path where a missing backend
 * degrades into a locally faked result.
 */
export const backendMode: BackendMode = resolveBackendMode();

const IMPLEMENTATIONS: Record<BackendMode, BackendPort> = {
  dev: devBackend,
  http: httpBackend,
  unavailable: unavailableBackend,
};

export const backend: BackendPort = IMPLEMENTATIONS[backendMode];

/** True when the in-memory dev backend is serving requests. */
export const isDevBackendActive = backendMode === 'dev';

export type { BackendMode, BackendPort } from './backendTypes';
export { DEV_CREDENTIALS, devBackendControls } from './devBackend';
