import type { Request, Response } from 'express';
import { ProfileService } from '../services/profile.service.js';
import type { ApiResponse } from '../types/index.js';
import { validationResult } from 'express-validator';

const profileService = new ProfileService();

export class ProfileController {
  // Create a profile
  async createProfile(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        } as ApiResponse<null>);
      }

      const userId = (req as any).user?.id;
      if (typeof userId !== 'string') {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        } as ApiResponse<null>);
      }
      const data = req.body;

      // Check if profile already exists
      const exists = await profileService.profileExists(userId);
      if (exists) {
        return res.status(409).json({
          success: false,
          error: 'Profile already exists',
        } as ApiResponse<null>);
      }

      const profile = await profileService.createProfile(userId, data);
      return res.status(201).json({
        success: true,
        data: profile,
        message: 'Profile created successfully',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error creating profile:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Get my profile
  async getMyProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (typeof userId !== 'string') {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        } as ApiResponse<null>);
      }
      const profile = await profileService.getProfileByUserId(userId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found',
        } as ApiResponse<null>);
      }

      return res.status(200).json({
        success: true,
        data: profile,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting profile:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Update profile
  async updateProfile(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        } as ApiResponse<null>);
      }

      const userId = (req as any).user?.id;
      if (typeof userId !== 'string') {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        } as ApiResponse<null>);
      }
      const data = req.body;

      const profile = await profileService.updateProfile(userId, data);
      return res.status(200).json({
        success: true,
        data: profile,
        message: 'Profile updated successfully',
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>);
    }
  }

  // Get public profile (for viewing by others)
  async getPublicProfile(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      if (typeof userId !== 'string' || userId.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid userId parameter',
        } as ApiResponse<null>);
      }
      const profile = await profileService.getPublicProfile(userId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found',
        } as ApiResponse<null>);
      }

      return res.status(200).json({
        success: true,
        data: profile,
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Error getting public profile:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>);
    }
  }
}