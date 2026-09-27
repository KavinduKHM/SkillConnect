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

      const userId = (req as any).user.id as string;
      const { lessonId, type, title, description, order, externalUrl } = req.body as {
        lessonId?: string;
        type?: string;
        title?: string;
        description?: string;
        order?: number;
        externalUrl?: string;
      };
      const file = req.file;

      if (!lessonId) {
        return res.status(400).json({
          success: false,
          error: 'Lesson ID is required',
        } as ApiResponse<null>);
      }

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

      const materialPayload = {
        title: title as string,
        type: type as 'VIDEO' | 'PDF' | 'SLIDE' | 'EXTERNAL' | 'IMAGE',
        ...(description !== undefined ? { description } : {}),
        order: Number(order ?? 0),
        ...(file ? { file } : {}),
        ...(externalUrl ? { externalUrl } : {}),
      };

      const material = await materialService.createMaterial(
        userId,
        lessonId,
        materialPayload
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
        error: error instanceof Error ? error.message : (error as any)?.message || (error as any)?.error || JSON.stringify(error),
      } as ApiResponse<null>);
    }
  }

  // Get all materials for a lesson
  async getMaterials(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id as string;
      const lessonId = req.params.lessonId as string;

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
      const userId = (req as any).user.id as string;
      const id = req.params.id as string;

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

      const userId = (req as any).user.id as string;
      const id = req.params.id as string;
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
      const userId = (req as any).user.id as string;
      const id = req.params.id as string;

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