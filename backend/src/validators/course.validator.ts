import { body } from 'express-validator';

export const validateCreateCourse = [
  body('title').notEmpty().withMessage('Title is required').isString().trim(),
  body('description').notEmpty().withMessage('Description is required').isString().trim(),
  body('categoryId').notEmpty().withMessage('Category is required').isUUID(),
  body('difficulty').optional().isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  body('duration').optional().isString().trim(),
  body('estimatedHours').optional().isInt({ min: 1 }),
  body('language').optional().isString().trim(),
  body('deliveryMethod').optional().isIn(['SELF_PACED', 'SCHEDULED', 'HYBRID']),
  body('prerequisites').optional().isString().trim(),
  body('learningOutcomes').optional().isArray(),
  body('thumbnail').optional().isString(),
];

export const validateUpdateCourse = [
  body('title').optional().isString().trim(),
  body('description').optional().isString().trim(),
  body('categoryId').optional().isUUID(),
  body('difficulty').optional().isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  body('duration').optional().isString().trim(),
  body('estimatedHours').optional().isInt({ min: 1 }),
  body('language').optional().isString().trim(),
  body('deliveryMethod').optional().isIn(['SELF_PACED', 'SCHEDULED', 'HYBRID']),
  body('prerequisites').optional().isString().trim(),
  body('learningOutcomes').optional().isArray(),
  body('thumbnail').optional().isString(),
  body('status').optional().isIn(['DRAFT', 'SUBMITTED']),
];

export const validateSubmitCourse = [
  body('status').isIn(['SUBMITTED']).withMessage('Status must be SUBMITTED'),
];