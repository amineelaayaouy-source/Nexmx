/**
 * Centralized JWT secret resolution.
 *
 * SECURITY: There is no hardcoded/default fallback secret. If JWT_SECRET is
 * not set in the environment, this throws instead of silently signing or
 * verifying tokens with a guessable value. Callers must catch the error and
 * fail closed (deny access / refuse to issue tokens).
 */

let cachedSecret: Uint8Array | null = null;

export function getJwtSecret(): Uint8Array {
  if (cachedSecret) {
    return cachedSecret;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim().length === 0) {
    throw new Error(
      'JWT_SECRET environment variable is not set. Refusing to sign or verify tokens without a configured secret.'
    );
  }

  cachedSecret = new TextEncoder().encode(secret);
  return cachedSecret;
}
