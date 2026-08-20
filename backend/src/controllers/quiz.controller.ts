import type { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import * as quizService from '../services/quiz.service.js';

// -------------------------------------------------------------
// INSTRUCTOR CONTROLLERS
// -------------------------------------------------------------

export const createQuizLink = async (req: any, res: Response): Promise<void> => {
  try {
    const instructorId = req.user.id;
    const data = req.body;
    const quiz = await quizService.createQuizLink(instructorId, data);
    res.status(201).json({ success: true, quiz });
  } catch (error: any) {
    logger.error('Error in createQuizLink controller:', error);
    res.status(error.message.includes('permission') ? 403 : 400).json({ error: error.message });
  }
};

export const updateQuizLink = async (req: any, res: Response): Promise<void> => {
  try {
    const instructorId = req.user.id;
    const id = req.params.id as string;
    const data = req.body;
    const quiz = await quizService.updateQuizLink(instructorId, id, data);
    res.status(200).json({ success: true, quiz });
  } catch (error: any) {
    logger.error('Error in updateQuizLink controller:', error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteQuizLink = async (req: any, res: Response): Promise<void> => {
  try {
    const instructorId = req.user.id;
    const id = req.params.id as string;
    await quizService.deleteQuizLink(instructorId, id);
    res.status(200).json({ success: true, message: 'Quiz link deleted successfully' });
  } catch (error: any) {
    logger.error('Error in deleteQuizLink controller:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getQuizCompletions = async (req: any, res: Response): Promise<void> => {
  try {
    const instructorId = req.user.id;
    const id = req.params.id as string;
    const completions = await quizService.getQuizCompletions(instructorId, id);
    res.status(200).json({ success: true, completions });
  } catch (error: any) {
    logger.error('Error in getQuizCompletions controller:', error);
    res.status(400).json({ error: error.message });
  }
};

// -------------------------------------------------------------
// SHARED / LEARNER CONTROLLERS
// -------------------------------------------------------------

export const getCourseQuizzes = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId as string;
    const quizzes = await quizService.getCourseQuizzes(courseId);
    res.status(200).json({ success: true, quizzes });
  } catch (error: any) {
    logger.error('Error in getCourseQuizzes controller:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getSingleQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const quiz = await quizService.getQuizLink(id);
    res.status(200).json({ success: true, quiz });
  } catch (error: any) {
    logger.error('Error in getSingleQuiz controller:', error);
    res.status(404).json({ error: error.message });
  }
};

export const completeQuiz = async (req: any, res: Response): Promise<void> => {
  try {
    const learnerId = req.user.id;
    const id = req.params.id as string;
    const data = req.body;
    const completion = await quizService.recordQuizCompletion(learnerId, id, data);
    res.status(200).json({ success: true, completion });
  } catch (error: any) {
    logger.error('Error in completeQuiz controller:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getMyQuizzes = async (req: any, res: Response): Promise<void> => {
  try {
    const learnerId = req.user.id;
    const quizzes = await quizService.getMyQuizzes(learnerId);
    res.status(200).json({ success: true, quizzes });
  } catch (error: any) {
    logger.error('Error in getMyQuizzes controller:', error);
    res.status(500).json({ error: error.message });
  }
};
