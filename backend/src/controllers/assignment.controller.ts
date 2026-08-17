import type { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import * as assignmentService from '../services/assignment.service.js';

// -------------------------------------------------------------
// INSTRUCTOR CONTROLLERS
// -------------------------------------------------------------

export const createAssignment = async (req: any, res: Response): Promise<void> => {
  try {
    const instructorId = req.user.id;
    const data = req.body;
    const assignment = await assignmentService.createAssignment(instructorId, data);
    res.status(201).json({ success: true, assignment });
  } catch (error: any) {
    logger.error('Error in createAssignment controller:', error);
    res.status(error.message.includes('permission') ? 403 : 400).json({ error: error.message });
  }
};

export const updateAssignment = async (req: any, res: Response): Promise<void> => {
  try {
    const instructorId = req.user.id;
    const id = req.params.id as string;
    const data = req.body;
    const assignment = await assignmentService.updateAssignment(instructorId, id, data);
    res.status(200).json({ success: true, assignment });
  } catch (error: any) {
    logger.error('Error in updateAssignment controller:', error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteAssignment = async (req: any, res: Response): Promise<void> => {
  try {
    const instructorId = req.user.id;
    const id = req.params.id as string;
    await assignmentService.deleteAssignment(instructorId, id);
    res.status(200).json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error: any) {
    logger.error('Error in deleteAssignment controller:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getAssignmentSubmissions = async (req: any, res: Response): Promise<void> => {
  try {
    const instructorId = req.user.id;
    const id = req.params.id as string;
    const submissions = await assignmentService.getAssignmentSubmissions(instructorId, id);
    res.status(200).json({ success: true, submissions });
  } catch (error: any) {
    logger.error('Error in getAssignmentSubmissions controller:', error);
    res.status(400).json({ error: error.message });
  }
};

export const gradeSubmission = async (req: any, res: Response): Promise<void> => {
  try {
    const instructorId = req.user.id;
    const submissionId = req.params.submissionId as string;
    const data = req.body; // { grade, feedback, feedbackAttachments }
    const submission = await assignmentService.gradeSubmission(instructorId, submissionId, data);
    res.status(200).json({ success: true, submission });
  } catch (error: any) {
    logger.error('Error in gradeSubmission controller:', error);
    res.status(400).json({ error: error.message });
  }
};

// -------------------------------------------------------------
// LEARNER / SHARED CONTROLLERS
// -------------------------------------------------------------

export const getCourseAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId as string;
    const assignments = await assignmentService.getCourseAssignments(courseId);
    res.status(200).json({ success: true, assignments });
  } catch (error: any) {
    logger.error('Error in getCourseAssignments controller:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getSingleAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const assignment = await assignmentService.getSingleAssignment(id);
    res.status(200).json({ success: true, assignment });
  } catch (error: any) {
    logger.error('Error in getSingleAssignment controller:', error);
    res.status(404).json({ error: error.message });
  }
};

export const getLearnerSubmissions = async (req: any, res: Response): Promise<void> => {
  try {
    const learnerId = req.user.id;
    const id = req.params.id as string;
    const submissions = await assignmentService.getLearnerSubmissions(learnerId, id);
    res.status(200).json({ success: true, submissions });
  } catch (error: any) {
    logger.error('Error in getLearnerSubmissions controller:', error);
    res.status(400).json({ error: error.message });
  }
};

export const submitAssignment = async (req: any, res: Response): Promise<void> => {
  try {
    const learnerId = req.user.id;
    const id = req.params.id as string;
    const data = req.body;
    
    // Check if files were uploaded via multer
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // In a real app with the uploadService, you would call `uploadMultipleFiles` here
      // For now, we'll assume the client is passing file URLs or using text/github
    }

    const submission = await assignmentService.submitAssignment(learnerId, id, data);
    res.status(201).json({ success: true, submission });
  } catch (error: any) {
    logger.error('Error in submitAssignment controller:', error);
    res.status(400).json({ error: error.message });
  }
};
