import type { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { MaterialService } from '../services/material.service.js';
import type { ApiResponse } from '../types/index.js';

const materialService = new MaterialService();

export class MaterialController {
  // Upload material (file or external link)
  async uploadMaterial(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        } as ApiResponse<null>);
      }

      const userId = (req as any).user.id;
      const { lessonId, type, title, description, order, externalUrl } = req.body;
      const file = req.file;

      // Validate: either file or externalUrl must be provided
      if (!file && !externalUrl) {
        return res.status(400).json({
          success: false,
          error: 'Either a file or externalUrl must be provided',
        } as ApiResponse<null>);
      }

      if (file && externalUrl) {
        return res.status(400).json({
          success: false,
          error: 'Cannot provide both file and externalUrl',
        } as ApiResponse<null>);
      }

      const material = await materialService.createMaterial(
        userId,
        lessonId,
        {
          title,
          type,
          description,
          order,
          file,
          externalUrl,
        }
      );

      return res.status(201).json({
        success: true,
        data: material,
        message: 'Material uploaded successfully',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error uploading material:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Get all materials for a lesson
  async getMaterials(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { lessonId } = req.params;

      const materials = await materialService.getMaterialsByLessonId(lessonId, userId);

      return res.status(200).json({
        success: true,
        data: materials,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting materials:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Get single material
  async getMaterial(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const material = await materialService.getMaterialById(id, userId);

      if (!material) {
        return res.status(404).json({
          success: false,
          error: 'Material not found',
        } as ApiResponse<null>);
      }

      return res.status(200).json({
        success: true,
        data: material,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting material:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Update material
  async updateMaterial(req: Request, res: Response) {
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

      const material = await materialService.updateMaterial(id, userId, data);

      return res.status(200).json({
        success: true,
        data: material,
        message: 'Material updated successfully',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error updating material:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Delete material
  async deleteMaterial(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      await materialService.deleteMaterial(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Material deleted successfully',
      } as ApiResponse<null>);
    } catch (error) {
      console.error('Error deleting material:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>);
    }
  }
}