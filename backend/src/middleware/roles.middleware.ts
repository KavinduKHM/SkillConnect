import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware.js';
import prisma from '../config/database.js';

export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }

  next();
};

export const isSkillSharer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.user.role === 'SKILL_SHARER' || req.user.role === 'ADMIN') {
    next();
    return;
  }

  try {
    // If the user has created courses, they are acting as a skill sharer/instructor
    const hasCourse = await prisma.course.findFirst({
      where: { creatorId: req.user.id },
    });

    if (hasCourse) {
      next();
      return;
    }
  } catch (error) {
    // ignore db lookup failure and proceed to forbidden
  }

  res.status(403).json({ error: 'Forbidden: Skill Sharer access required' });
};