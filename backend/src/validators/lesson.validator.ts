import { body } from 'express-validator';

export const validateCreateLesson = [
  body('moduleId').notEmpty().withMessage('moduleId is required').isUUID(),
  body('title').notEmpty().withMessage('Title is required').isString().trim(),
  body('description').optional().isString().trim(),
  body('content').optional().isString().trim(),
  body('order').notEmpty().withMessage('Order is required').isInt({ min: 1 }),
  body('isRequired').optional().isBoolean(),
  body('estimatedMinutes').optional().isInt({ min: 1 }),
];

export const validateUpdateLesson = [
  body('title').optional().isString().trim(),
  body('description').optional().isString().trim(),
  body('content').optional().isString().trim(),
  body('order').optional().isInt({ min: 1 }),
  body('isRequired').optional().isBoolean(),
  body('estimatedMinutes').optional().isInt({ min: 1 }),
];