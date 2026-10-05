// JOBWORKERS Password Service
// PBKDF2-HMAC-SHA-256 password hashing with legacy SHA-256 migration support

// PBKDF2 parameters
const PBKDF2_ITERATIONS = 600000;
const PBKDF2_SALT_LENGTH = 16; // bytes
const PBKDF2_KEY_LENGTH = 32; // 256 bits
const PBKDF2_ALGORITHM = 'PBKDF2';
const PBKDF2_PRF = 'SHA-256';

// Legacy format identifier
const LEGACY_SHA256_PREFIX = ''; // Old format has no prefix, just hex

// PBKDF2 format: pbkdf2_sha256$iterations$salt_base64$hash_base64
const PBKDF2_FORMAT_PREFIX = 'pbkdf2_sha256';

export class PasswordService {
  /**
   * Hash a password using PBKDF2-HMAC-SHA-256
   * Returns format: pbkdf2_sha256$600000$SALT_B64$HASH_B64
   */
  async hashPassword(password: string): Promise<string> {
    // Generate random salt
    const salt = new Uint8Array(PBKDF2_SALT_LENGTH);
    crypto.getRandomValues(salt);

    // Encode password
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    // Import password as PBKDF2 key
    const key = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    // Derive bits
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: PBKDF2_PRF,
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
      },
      key,
      PBKDF2_KEY_LENGTH * 8 // bits
    );

    const derivedBytes = new Uint8Array(derivedBits);

    // Encode salt and hash to base64
    const saltB64 = this.bytesToBase64(salt);
    const hashB64 = this.bytesToBase64(derivedBytes);

    // Return formatted hash
    return `${PBKDF2_FORMAT_PREFIX}$${PBKDF2_ITERATIONS}$${saltB64}$${hashB64}`;
  }

  /**
   * Verify a password against a stored hash
   * Handles both PBKDF2 and legacy SHA-256 formats
   * If legacy SHA-256 hash is valid, returns a tuple indicating rehash is needed
   */
  async verifyPassword(
    password: string,
    storedHash: string
  ): Promise<{ valid: boolean; needsRehash: boolean }> {
    // Check if this is a PBKDF2 hash
    if (storedHash.startsWith(`${PBKDF2_FORMAT_PREFIX}$`)) {
      return {
        valid: await this.verifyPbkdf2(password, storedHash),
        needsRehash: false,
      };
    }

    // Otherwise treat as legacy SHA-256
    return {
      valid: await this.verifyLegacySha256(password, storedHash),
      needsRehash: true, // Legacy format needs rehashing
    };
  }

  /**
   * Verify PBKDF2 hash
   */
  private async verifyPbkdf2(password: string, storedHash: string): Promise<boolean> {
    try {
      const parts = storedHash.split('$');
      if (parts.length !== 4 || parts[0] !== PBKDF2_FORMAT_PREFIX) {
        return false;
      }

      const iterations = parseInt(parts[1], 10);
      if (isNaN(iterations) || iterations < 1) {
        return false;
      }

      const saltB64 = parts[2];
      const hashB64 = parts[3];

      // Decode salt and stored hash
      let salt: Uint8Array;
      let storedDerivedHash: Uint8Array;
      try {
        salt = this.base64ToBytes(saltB64);
        storedDerivedHash = this.base64ToBytes(hashB64);
      } catch (e) {
        return false;
      }

      // Derive hash from supplied password
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);

      const key = await crypto.subtle.importKey(
        'raw',
        passwordData,
        'PBKDF2',
        false,
        ['deriveBits']
      );

      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          hash: PBKDF2_PRF,
          salt: salt,
          iterations: iterations,
        },
        key,
        PBKDF2_KEY_LENGTH * 8
      );

      const derivedBytes = new Uint8Array(derivedBits);

      // Constant-time comparison
      return this.constantTimeCompare(derivedBytes, storedDerivedHash);
    } catch (error) {
      console.error('PBKDF2 verification error:', error);
      return false;
    }
  }

  /**
   * Verify legacy SHA-256 hash (for migration only)
   */
  private async verifyLegacySha256(password: string, storedHash: string): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return this.constantTimeCompare(
        new TextEncoder().encode(computedHash),
        new TextEncoder().encode(storedHash)
      );
    } catch (error) {
      console.error('Legacy SHA-256 verification error:', error);
      return false;
    }
  }

  /**
   * Constant-time byte array comparison
   */
  private constantTimeCompare(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a[i] ^ b[i];
    }

    return diff === 0;
  }

  /**
   * Convert Uint8Array to base64
   */
  private bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 to Uint8Array
   */
  private base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
