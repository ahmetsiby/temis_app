import crypto from 'crypto';

export function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(String(value))
    .digest('hex');
}

export function randomToken(size = 32) {
  return crypto.randomBytes(size).toString('hex');
}