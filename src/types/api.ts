/** Shapes shared by every API call. */

/** Standard envelope returned by the budd API. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/** Cursor-paginated list payload. */
export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}

/** Normalised error surfaced to the UI by the API client. */
export interface ApiError {
  status: number;
  code: string;
  message: string;
}

/** Async state machine used by data-loading hooks. */
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';
