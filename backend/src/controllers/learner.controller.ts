import type { Request, Response } from 'express';
import {
  getPublishedCourses,
  getCourseDetails,
  getCategories,
  enrollInCourse,
  cancelEnrollment,
  getMyLearning,
  getLessonContent,
  markLessonComplete,
  getCourseProgress,
} from '../services/learner.service.js';
import { logger } from '../utils/logger.js';

// -------------------------------------------------------------
// COURSE DISCOVERY
// -------------------------------------------------------------

export const listCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, categoryId, difficulty, deliveryMethod, page, limit } = req.query;
    const result = await getPublishedCourses({
      search: search as string,
      categoryId: categoryId as string,
      difficulty: difficulty as string,
      deliveryMethod: deliveryMethod as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
    });
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error in listCourses controller:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getCourseById = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const learnerId = req.user?.id;
    const result = await getCourseDetails(id, learnerId);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error in getCourseById controller:', error);
    res.status(404).json({ error: error.message });
  }
};

export const listCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await getCategories();
    res.status(200).json(categories);
  } catch (error: any) {
    logger.error('Error in listCategories controller:', error);
    res.status(500).json({ error: error.message });
  }
};

// -------------------------------------------------------------
// ENROLLMENT
// -------------------------------------------------------------

export const enroll = async (req: any, res: Response): Promise<void> => {
  try {
    const learnerId = req.user.id;
    const { courseId } = req.body;

    if (!courseId) {
      res.status(400).json({ error: 'courseId is required' });
      return;
    }

    const result = await enrollInCourse(learnerId, courseId);
    res.status(201).json({
      message: 'Successfully enrolled in course',
      enrollment: result,
    });
  } catch (error: any) {
    logger.error('Error in enroll controller:', error);
    res.status(400).json({ error: error.message });
  }
};

export const cancel = async (req: any, res: Response): Promise<void> => {
  try {
    const learnerId = req.user.id;
    const { courseId } = req.params;

    const result = await cancelEnrollment(learnerId, courseId);
    res.status(200).json({
      message: 'Enrollment cancelled successfully',
      enrollment: result,
    });
  } catch (error: any) {
    logger.error('Error in cancel enrollment controller:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getMyLearningDashboard = async (req: any, res: Response): Promise<void> => {
  try {
    const learnerId = req.user.id;
    const result = await getMyLearning(learnerId);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error in getMyLearningDashboard controller:', error);
    res.status(500).json({ error: error.message });
  }
};

// -------------------------------------------------------------
// LEARNING & PROGRESS TRACKING
// -------------------------------------------------------------

export const getLesson = async (req: any, res: Response): Promise<void> => {
  try {
    const learnerId = req.user.id;
    const { lessonId } = req.params;

    const result = await getLessonContent(learnerId, lessonId);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error in getLesson controller:', error);
    res.status(403).json({ error: error.message });
  }
};

export const completeLesson = async (req: any, res: Response): Promise<void> => {
  try {
    const learnerId = req.user.id;
    const { courseId, lessonId } = req.body;

    if (!courseId || !lessonId) {
      res.status(400).json({ error: 'courseId and lessonId are required' });
      return;
    }

    const result = await markLessonComplete(learnerId, courseId, lessonId);
    res.status(200).json({
      message: 'Lesson marked as completed',
      progress: result,
    });
  } catch (error: any) {
    logger.error('Error in completeLesson controller:', error);
    res.status(400).json({ error: error.message });
  }
};

export const fetchProgress = async (req: any, res: Response): Promise<void> => {
  try {
    const learnerId = req.user.id;
    const { courseId } = req.params;

    const result = await getCourseProgress(learnerId, courseId);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error in fetchProgress controller:', error);
    res.status(404).json({ error: error.message });
  }
};
