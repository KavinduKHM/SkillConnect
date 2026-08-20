import { body } from 'express-validator';

export const validateCreateRecommendation = [
  body('learnerId').notEmpty().withMessage('learnerId is required').isUUID(),
  body('courseId').notEmpty().withMessage('courseId is required').isUUID(),
  body('message').notEmpty().withMessage('Message is required').isString().trim(),
  body('skillDemonstrated').optional().isString().trim(),
  body('strengths').optional().isString().trim(),
  body('qualityOfAssignments').optional().isString().trim(),
  body('participation').optional().isString().trim(),
  body('isPublic').optional().isBoolean(),
];

export const validateUpdateRecommendation = [
  body('message').optional().isString().trim(),
  body('skillDemonstrated').optional().isString().trim(),
  body('strengths').optional().isString().trim(),
  body('qualityOfAssignments').optional().isString().trim(),
  body('participation').optional().isString().trim(),
  body('isPublic').optional().isBoolean(),
];