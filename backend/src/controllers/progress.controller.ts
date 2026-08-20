import type { Request, Response } from 'express';
import { ProgressService } from '../services/progress.service.js';
import type { ApiResponse } from '../types/index.js';

const progressService = new ProgressService();

export class ProgressController {
  // Get learner progress for a course (Skill Sharer view)
  async getCourseProgress(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { courseId } = req.params;

      const progress = await progressService.getCourseProgressForInstructor(courseId, userId);

      return res.status(200).json({
        success: true,
        data: progress,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting course progress:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Get all learners' progress for a course (Skill Sharer view)
  async getLearnersProgress(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { courseId } = req.params;

      const learners = await progressService.getLearnersProgressForCourse(courseId, userId);

      return res.status(200).json({
        success: true,
        data: learners,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting learners progress:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Get a specific learner's progress (Skill Sharer view)
  async getLearnerProgress(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { courseId, learnerId } = req.params;

      const progress = await progressService.getLearnerProgressForCourse(courseId, learnerId, userId);

      if (!progress) {
        return res.status(404).json({
          success: false,
          error: 'Progress not found for this learner',
        } as ApiResponse<null>);
      }

      return res.status(200).json({
        success: true,
        data: progress,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting learner progress:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Get course analytics (Skill Sharer view)
  async getCourseAnalytics(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { courseId } = req.params;

      const analytics = await progressService.getCourseAnalytics(courseId, userId);

      return res.status(200).json({
        success: true,
        data: analytics,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting course analytics:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Mark lesson as completed (Learner)
  async markLessonComplete(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { lessonId } = req.params;

      const progress = await progressService.markLessonComplete(userId, lessonId);

      return res.status(200).json({
        success: true,
        data: progress,
        message: 'Lesson marked as complete',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }
}