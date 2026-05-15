import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import 'dotenv/config';

interface TokenPayload {
  userId: string;
  email?: string;
}

interface tempTokenPayload {
  isTemp: true;
  userId: string;
}

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET not found.');

const options: jwt.SignOptions = {
  expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
};

const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, secret, { expiresIn: '1h' });
};

const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, secret, options);
};

const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded as TokenPayload;
  } catch {
    return null;
  }
};

const generate2FATempToken = (payload: tempTokenPayload) => {
  const secret = process.env.JWT_2FA_SECRET as string;
  if (!secret) throw new Error('JWT_2FA_SECRET not found.');

  const options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_2FA_EXPIRES_IN || '5m') as jwt.SignOptions['expiresIn'],
  };

  return jwt.sign(payload, secret, options);
};

const generate6digitcodes = (): string => {
  return crypto.randomInt(100_000, 1_000_000).toString();
};

const generateMagicToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

const generatePasswordResetToken = (userId: string, currentPasswordHash: string): string => {
  const secret = process.env.JWT_SECRET as string;

  const oneTimeSecret = secret + currentPasswordHash;

  const options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_RESET_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'],
  };

  return jwt.sign({ userId }, oneTimeSecret, options);
};

const verifyPasswordResetToken = (token: string, currentPasswordHash: string): { userId: string } | null => {
  const secret = process.env.JWT_SECRET as string;
  const oneTimeSecret = secret + currentPasswordHash;

  try {
    const decoded = jwt.verify(token, oneTimeSecret);
    return decoded as { userId: string };
  } catch {
    return null;
  }
};

const tokenUtils = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generate2FATempToken,
  generate6digitcodes,
  generateMagicToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
};

export default tokenUtils;
