import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Hashes a plaintext password using scrypt with a random salt.
 * Output format: scrypt$saltHex$hashHex
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (!storedHash || !storedHash.startsWith('scrypt$')) {
      return false;
    }
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;

    const salt = parts[1];
    const originalHashHex = parts[2];
    const originalHashBuffer = Buffer.from(originalHashHex, 'hex');

    const derivedKeyBuffer = scryptSync(password, salt, 64);

    if (originalHashBuffer.length !== derivedKeyBuffer.length) {
      return false;
    }

    return timingSafeEqual(originalHashBuffer, derivedKeyBuffer);
  } catch (_e) {
    return false;
  }
}
