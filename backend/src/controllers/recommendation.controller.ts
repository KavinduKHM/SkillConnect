import type { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { RecommendationService } from '../services/recommendation.service.js';
import type { ApiResponse } from '../types/index.js';

const recommendationService = new RecommendationService();

export class RecommendationController {
  // Get all completed learners for a course
  async getCompletedLearnersForCourse(req: Request, res: Response) {
    try {
      const instructorId = (req as any).user.id;
      const { courseId } = req.params;

      if (!courseId) {
        return res.status(400).json({
          success: false,
          error: 'Course ID is required',
        } as ApiResponse<null>);
      }

      const learners = await recommendationService.getCompletedLearnersForCourse(instructorId, courseId);

      return res.status(200).json({
        success: true,
        data: learners,
        learners,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting completed learners:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Create recommendation (Skill Sharer -> Learner)
  async createRecommendation(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        } as ApiResponse<null>);
      }

      const instructorId = (req as any).user.id;
      const { learnerId, courseId, ...data } = req.body;

      const recommendation = await recommendationService.createRecommendation(
        instructorId,
        learnerId,
        courseId,
        data
      );

      return res.status(201).json({
        success: true,
        data: recommendation,
        message: 'Recommendation created successfully',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error creating recommendation:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Get all recommendations for a learner
  async getRecommendationsForLearner(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { learnerId } = req.params;

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          error: 'Learner ID is required',
        } as ApiResponse<null>);
      }

      const onlyPublic = userId !== learnerId && (req as any).user.role !== 'ADMIN';
      const recommendations = await recommendationService.getRecommendationsForLearner(learnerId, onlyPublic);

      return res.status(200).json({
        success: true,
        data: recommendations,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Get my recommendations (for current user)
  async getMyRecommendations(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const recommendations = await recommendationService.getRecommendationsForLearner(userId, false);

      return res.status(200).json({
        success: true,
        data: recommendations,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting my recommendations:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Update recommendation
  async updateRecommendation(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        } as ApiResponse<null>);
      }

      const instructorId = (req as any).user.id;
      const { id } = req.params;
      const data = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Recommendation ID is required',
        } as ApiResponse<null>);
      }

      const recommendation = await recommendationService.updateRecommendation(id, instructorId, data);

      return res.status(200).json({
        success: true,
        data: recommendation,
        message: 'Recommendation updated successfully',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error updating recommendation:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Delete recommendation
  async deleteRecommendation(req: Request, res: Response) {
    try {
      const instructorId = (req as any).user.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Recommendation ID is required',
        } as ApiResponse<null>);
      }

      await recommendationService.deleteRecommendation(id, instructorId);

      return res.status(200).json({
        success: true,
        message: 'Recommendation deleted successfully',
      } as ApiResponse<null>);
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }
}