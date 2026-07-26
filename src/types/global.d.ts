/// <reference types="expo-router/types" />

declare global {
  /** Injected by Metro; true in development builds. */
  const __DEV__: boolean;

  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL?: string;
      EXPO_PUBLIC_API_TIMEOUT?: string;
    }
  }
}

export {};
