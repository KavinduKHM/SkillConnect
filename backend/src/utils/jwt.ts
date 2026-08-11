import jwt, { type SignOptions } from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/auth.js';

export const generateToken = (userId: string): string => {
  const expiresIn = JWT_CONFIG.expiresIn as NonNullable<SignOptions['expiresIn']>;

  const options: SignOptions = {
    expiresIn,
  };

  return jwt.sign({ userId }, JWT_CONFIG.secret, {
    ...options,
  });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_CONFIG.secret);
  } catch (error) {
    return null;
  }
};