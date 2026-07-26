/**
 * Idempotency keys for money-moving requests.
 *
 * The key is generated once per *attempt* and reused across every retry of that
 * attempt — that is what makes a timeout-then-retry safe. Generating a fresh key
 * on retry would defeat the entire mechanism.
 *
 * This only correlates retries; uniqueness is enforced by the server. A device
 * cannot guarantee "charge once" on its own, and pretending otherwise is how
 * duplicate orders happen.
 */

let counter = 0;

/** Random hex, using the platform CSPRNG when one is available. */
function randomHex(bytes: number): string {
  const buffer = new Uint8Array(bytes);

  const cryptoRef = globalThis.crypto;
  if (cryptoRef?.getRandomValues) {
    cryptoRef.getRandomValues(buffer);
  } else {
    // Keys are correlation ids, not secrets, so a non-cryptographic fallback is
    // acceptable when the engine exposes no CSPRNG.
    for (let index = 0; index < buffer.length; index += 1) {
      buffer[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates a key for one attempt.
 *
 * `scope` groups keys by operation so they are readable in a server log, e.g.
 * `order-1a2b…`. The counter breaks ties if two keys are requested inside the
 * same millisecond.
 */
export function createIdempotencyKey(scope: string): string {
  counter = (counter + 1) % 1_000_000;
  return `${scope}-${Date.now().toString(36)}-${counter.toString(36)}-${randomHex(8)}`;
}
