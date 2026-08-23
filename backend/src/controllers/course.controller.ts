import type { Request, Response } from 'express';
import { CourseService } from '../services/course.service.js';
import type { ApiResponse } from '../types/index.js';
import { validationResult } from 'express-validator';

const courseService = new CourseService();

export class CourseController {
  // Create a course draft
  async createCourse(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        } as ApiResponse<null>);
      }

      const creatorId = (req as any).user.id;
      const creator = (req as any).user;

      if (creator.role === 'SKILL_SHARER' && !creator.verifiedBadge) {
        return res.status(403).json({
          success: false,
          error: 'Course creation is restricted. You must set up your skills and receive admin verification first.',
        } as ApiResponse<null>);
      }

      const data = req.body;

      const course = await courseService.createCourse(creatorId, data);

      return res.status(201).json({
        success: true,
        data: course,
        message: 'Course created successfully',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error creating course:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Get all my courses
  async getMyCourses(req: Request, res: Response) {
    try {
      const creatorId = (req as any).user.id;
      const courses = await courseService.getCoursesByCreatorId(creatorId);

      return res.status(200).json({
        success: true,
        data: courses,
      });
    } catch (error) {
      console.error('Error getting courses:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Get a single course
  async getCourse(req: Request, res: Response) {
    try {
      const creatorId = (req as any).user.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Course ID is required',
        } as ApiResponse<null>);
      }

      const course = await courseService.getCourseById(id, creatorId);

      if (!course) {
        return res.status(404).json({
          success: false,
          error: 'Course not found',
        } as ApiResponse<null>);
      }

      return res.status(200).json({
        success: true,
        data: course,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting course:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Update course
  async updateCourse(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        } as ApiResponse<null>);
      }

      const creatorId = (req as any).user.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Course ID is required',
        } as ApiResponse<null>);
      }

      const data = req.body;

      const course = await courseService.updateCourse(id, creatorId, data);

      return res.status(200).json({
        success: true,
        data: course,
        message: 'Course updated successfully',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error updating course:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Submit course for approval
  async submitCourse(req: Request, res: Response) {
    try {
      const creatorId = (req as any).user.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Course ID is required',
        } as ApiResponse<null>);
      }

      const course = await courseService.submitCourse(id, creatorId);

      return res.status(200).json({
        success: true,
        data: course,
        message: 'Course submitted for approval successfully',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error submitting course:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // ✅ FIXED: Delete course (draft only)
  async deleteCourse(req: Request, res: Response) {
    try {
      const creatorId = (req as any).user.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Course ID is required',
        } as ApiResponse<null>);
      }

      // ✅ First check if the course exists and is a draft
      const course = await courseService.getCourseById(id, creatorId);
      
      if (!course) {
        return res.status(404).json({
          success: false,
          error: 'Course not found',
        } as ApiResponse<null>);
      }

      if (course.status !== 'DRAFT') {
        return res.status(400).json({
          success: false,
          error: `Only draft courses can be deleted. Current status: ${course.status}`,
        } as ApiResponse<null>);
      }

      await courseService.deleteCourse(id, creatorId);

      return res.status(200).json({
        success: true,
        message: 'Course deleted successfully',
      } as ApiResponse<null>);
    } catch (error) {
      console.error('Error deleting course:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>);
    }
  }
}