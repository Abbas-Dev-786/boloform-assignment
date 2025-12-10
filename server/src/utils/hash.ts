import crypto from "crypto";

/**
 * Calculate SHA-256 hash of a buffer
 */
export function calculateHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Verify that a buffer matches an expected hash
 */
export function verifyHash(buffer: Buffer, expectedHash: string): boolean {
  const actualHash = calculateHash(buffer);
  return actualHash === expectedHash;
}
