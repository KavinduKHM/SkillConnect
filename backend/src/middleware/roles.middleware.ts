import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware.js';

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

export const isSkillSharer = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.user.role !== 'SKILL_SHARER' && req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Skill Sharer access required' });
    return;
  }

  next();
};