import bcrypt from 'bcryptjs';
import { BCRYPT_CONFIG } from '../config/auth.js';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_CONFIG.saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};