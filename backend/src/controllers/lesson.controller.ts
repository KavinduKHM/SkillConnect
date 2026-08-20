import type { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { LessonService } from '../services/lesson.service.js';
import type { ApiResponse } from '../types/index.js';

const lessonService = new LessonService();

export class LessonController {
  // Create lesson
  async createLesson(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        } as ApiResponse<null>);
      }

      const userId = (req as any).user.id;
      const { moduleId, ...data } = req.body;

      const lesson = await lessonService.createLesson(userId, moduleId, data);

      return res.status(201).json({
        success: true,
        data: lesson,
        message: 'Lesson created successfully',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error creating lesson:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Get all lessons for a module
  async getLessons(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { moduleId } = req.params;

      const lessons = await lessonService.getLessonsByModuleId(moduleId, userId);

      return res.status(200).json({
        success: true,
        data: lessons,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting lessons:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Get single lesson
  async getLesson(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const lesson = await lessonService.getLessonById(id, userId);

      if (!lesson) {
        return res.status(404).json({
          success: false,
          error: 'Lesson not found',
        } as ApiResponse<null>);
      }

      return res.status(200).json({
        success: true,
        data: lesson,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting lesson:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Update lesson
  async updateLesson(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        } as ApiResponse<null>);
      }

      const userId = (req as any).user.id;
      const { id } = req.params;
      const data = req.body;

      const lesson = await lessonService.updateLesson(id, userId, data);

      return res.status(200).json({
        success: true,
        data: lesson,
        message: 'Lesson updated successfully',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error updating lesson:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Delete lesson
  async deleteLesson(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      await lessonService.deleteLesson(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Lesson deleted successfully',
      } as ApiResponse<null>);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Reorder lessons
  async reorderLessons(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { moduleId } = req.params;
      const { lessonIds } = req.body;

      if (!lessonIds || !Array.isArray(lessonIds)) {
        return res.status(400).json({
          success: false,
          error: 'lessonIds array is required',
        } as ApiResponse<null>);
      }

      const lessons = await lessonService.reorderLessons(moduleId, userId, lessonIds);

      return res.status(200).json({
        success: true,
        data: lessons,
        message: 'Lessons reordered successfully',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error reordering lessons:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }
}