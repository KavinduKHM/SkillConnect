import type { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import * as reviewService from '../services/review.service.js';
import * as recommendationService from '../services/recommendation.service.js';

// -------------------------------------------------------------
// COURSE REVIEWS
// -------------------------------------------------------------

export const createReview = async (req: any, res: Response): Promise<void> => {
  try {
    const learnerId = req.user.id;
    const review = await reviewService.createReview(learnerId, req.body);
    res.status(201).json({ success: true, review });
  } catch (error: any) {
    logger.error('Error in createReview controller:', error);
    res.status(400).json({ error: error.message });
  }
};

export const updateReview = async (req: any, res: Response): Promise<void> => {
  try {
    const learnerId = req.user.id;
    const { id } = req.params;
    const review = await reviewService.updateReview(learnerId, id, req.body);
    res.status(200).json({ success: true, review });
  } catch (error: any) {
    logger.error('Error in updateReview controller:', error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteReview = async (req: any, res: Response): Promise<void> => {
  try {
    const learnerId = req.user.id;
    const { id } = req.params;
    await reviewService.deleteReview(learnerId, id);
    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    logger.error('Error in deleteReview controller:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getCourseReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId as string;
    const reviews = await reviewService.getCourseReviews(courseId);
    res.status(200).json({ success: true, reviews });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// -------------------------------------------------------------
// RECOMMENDATIONS
// -------------------------------------------------------------

export const createRecommendation = async (req: any, res: Response): Promise<void> => {
  try {
    const instructorId = req.user.id;
    const recommendation = await recommendationService.createRecommendation(instructorId, req.body);
    res.status(201).json({ success: true, recommendation });
  } catch (error: any) {
    logger.error('Error in createRecommendation controller:', error);
    res.status(400).json({ error: error.message });
  }
};

export const updateRecommendation = async (req: any, res: Response): Promise<void> => {
  try {
    const instructorId = req.user.id;
    const id = req.params.id as string;
    const recommendation = await recommendationService.updateRecommendation(instructorId, id, req.body);
    res.status(200).json({ success: true, recommendation });
  } catch (error: any) {
    logger.error('Error in updateRecommendation controller:', error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteRecommendation = async (req: any, res: Response): Promise<void> => {
  try {
    const instructorId = req.user.id;
    const id = req.params.id as string;
    await recommendationService.deleteRecommendation(instructorId, id);
    res.status(200).json({ success: true, message: 'Recommendation deleted successfully' });
  } catch (error: any) {
    logger.error('Error in deleteRecommendation controller:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getLearnerRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const learnerId = req.params.learnerId as string;
    const recommendations = await recommendationService.getLearnerRecommendations(learnerId);
    res.status(200).json({ success: true, recommendations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
