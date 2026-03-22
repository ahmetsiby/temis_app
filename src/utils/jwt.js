import jwt from 'jsonwebtoken';

export function signAccessToken({ userId }) {
  return jwt.sign(
    {
      sub: userId,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
    }
  );
}

export function signRefreshToken({ userId }) {
  const days = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30);

  return jwt.sign(
    {
      sub: userId,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: `${days}d`,
    }
  );
}