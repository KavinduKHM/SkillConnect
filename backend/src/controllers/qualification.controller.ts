import type { Request, Response } from 'express';
import { QualificationService } from '../services/qualification.service.js';
import type { ApiResponse } from '../types/index.js';
import { validationResult } from 'express-validator';

const qualificationService = new QualificationService();

export class QualificationController {
  // Create a qualification
  async createQualification(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        } as ApiResponse<null>);
      }

      const userId = (req as any).user.id;
      const { profileId, ...data } = req.body;

      const qualification = await qualificationService.createQualification(
        userId,
        profileId,
        data
      );

      return res.status(201).json({
        success: true,
        data: qualification,
        message: 'Qualification created successfully',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error creating qualification:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Get all qualifications
  async getQualifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const qualifications = await qualificationService.getQualificationsByUserId(userId);

      return res.status(200).json({
        success: true,
        data: qualifications,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting qualifications:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Get a single qualification
  async getQualification(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Qualification id is required',
        } as ApiResponse<null>);
      }

      const qualification = await qualificationService.getQualificationById(id, userId);

      if (!qualification) {
        return res.status(404).json({
          success: false,
          error: 'Qualification not found',
        } as ApiResponse<null>);
      }

      return res.status(200).json({
        success: true,
        data: qualification,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting qualification:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Update qualification
  async updateQualification(req: Request, res: Response) {
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

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Qualification id is required',
        } as ApiResponse<null>);
      }

      const data = req.body;

      const qualification = await qualificationService.updateQualification(id, userId, data);

      return res.status(200).json({
        success: true,
        data: qualification,
        message: 'Qualification updated successfully',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error updating qualification:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Delete qualification
  async deleteQualification(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Qualification id is required',
        } as ApiResponse<null>);
      }

      await qualificationService.deleteQualification(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Qualification deleted successfully',
      } as ApiResponse<null>);
    } catch (error) {
      console.error('Error deleting qualification:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>);
    }
  }
}