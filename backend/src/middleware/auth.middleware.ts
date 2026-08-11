import type { Request, Response, NextFunction } from 'express';
import { UserStatus } from '@prisma/client';
import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/database.js';

export interface AuthRequest extends Request {
  user?: any;
}

export const isAuthenticated = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    if (user.status === UserStatus.SUSPENDED) {
      res.status(403).json({ error: 'Account suspended' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};