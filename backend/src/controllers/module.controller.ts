import type { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ModuleService } from '../services/module.service.js';
import type { ApiResponse } from '../types/index.js';

const moduleService = new ModuleService();

export class ModuleController {
  // Create module
  async createModule(req: Request, res: Response) {
    try {
      console.log('📤 Request body:', req.body); // ✅ Debug: Log the entire request body

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', JSON.stringify(errors.array(), null, 2)); // ✅ Debug: Log validation errors
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        } as ApiResponse<null>);
      }

      const userId = (req as any).user.id;
      const { courseId, ...data } = req.body;

      // ✅ Validate courseId
      if (!courseId) {
        return res.status(400).json({
          success: false,
          error: 'courseId is required',
        } as ApiResponse<null>);
      }

      console.log('📤 Creating module with:', { userId, courseId, data }); // ✅ Debug

      const module = await moduleService.createModule(userId, courseId, data);

      return res.status(201).json({
        success: true,
        data: module,
        message: 'Module created successfully',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error creating module:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Get all modules for a course
  async getModules(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { courseId } = req.params;

      if (!courseId) {
        return res.status(400).json({
          success: false,
          error: 'courseId is required',
        } as ApiResponse<null>);
      }

      const modules = await moduleService.getModulesByCourseId(courseId, userId);

      return res.status(200).json({
        success: true,
        data: modules,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting modules:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Get single module
  async getModule(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Module ID is required',
        } as ApiResponse<null>);
      }

      const module = await moduleService.getModuleById(id, userId);

      if (!module) {
        return res.status(404).json({
          success: false,
          error: 'Module not found',
        } as ApiResponse<null>);
      }

      return res.status(200).json({
        success: true,
        data: module,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting module:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Update module
  async updateModule(req: Request, res: Response) {
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

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Module ID is required',
        } as ApiResponse<null>);
      }

      const module = await moduleService.updateModule(id, userId, data);

      return res.status(200).json({
        success: true,
        data: module,
        message: 'Module updated successfully',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error updating module:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Delete module
  async deleteModule(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Module ID is required',
        } as ApiResponse<null>);
      }

      await moduleService.deleteModule(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Module deleted successfully',
      } as ApiResponse<null>);
    } catch (error) {
      console.error('Error deleting module:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Reorder modules
  async reorderModules(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { courseId } = req.params;
      const { moduleIds } = req.body;

      if (!courseId) {
        return res.status(400).json({
          success: false,
          error: 'courseId is required',
        } as ApiResponse<null>);
      }

      if (!moduleIds || !Array.isArray(moduleIds)) {
        return res.status(400).json({
          success: false,
          error: 'moduleIds array is required',
        } as ApiResponse<null>);
      }

      const modules = await moduleService.reorderModules(courseId, userId, moduleIds);

      return res.status(200).json({
        success: true,
        data: modules,
        message: 'Modules reordered successfully',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error reordering modules:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }
}