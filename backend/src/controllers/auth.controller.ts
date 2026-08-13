import type { Request, Response } from 'express';
import { registerUser, loginUser, getCurrentUser } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;
    const result = await registerUser({ email, password, name, role });
    res.status(201).json(result);
  } catch (error: any) {
    logger.error('Register controller error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Login controller error:', error);
    res.status(401).json({ error: error.message });
  }
};

export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await getCurrentUser(req.user.id);
    res.status(200).json(user);
  } catch (error: any) {
    logger.error('Get me controller error:', error);
    res.status(500).json({ error: error.message });
  }
};