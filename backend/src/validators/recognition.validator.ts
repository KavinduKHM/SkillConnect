import { body, param } from 'express-validator';

export const createReviewValidator = [
  body('courseId').isUUID().withMessage('Valid courseId is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('review').optional().trim(),
];

export const updateReviewValidator = [
  param('id').isUUID().withMessage('Valid review ID is required'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('review').optional().trim(),
];

export const createRecommendationValidator = [
  body('learnerId').isUUID().withMessage('Valid learnerId is required'),
  body('courseId').isUUID().withMessage('Valid courseId is required'),
  body('message').trim().notEmpty().withMessage('Recommendation message is required'),
  body('skillDemonstrated').optional().trim(),
  body('strengths').optional().trim(),
  body('qualityOfAssignments').optional().trim(),
  body('participation').optional().trim(),
  body('isPublic').optional().isBoolean(),
];

export const updateRecommendationValidator = [
  param('id').isUUID().withMessage('Valid recommendation ID is required'),
  body('message').optional().trim().notEmpty().withMessage('Recommendation message cannot be empty'),
  body('skillDemonstrated').optional().trim(),
  body('strengths').optional().trim(),
  body('qualityOfAssignments').optional().trim(),
  body('participation').optional().trim(),
  body('isPublic').optional().isBoolean(),
];
