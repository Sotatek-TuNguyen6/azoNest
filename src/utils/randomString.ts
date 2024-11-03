import { randomBytes } from 'crypto';

export function generateSecureRandomString(length: number): string {
  return randomBytes(length).toString('hex').slice(0, length);
}
