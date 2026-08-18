import { body } from 'express-validator';

export const validateCreateQualification = [
  body('title').notEmpty().withMessage('Title is required').isString().trim(),
  body('institution').notEmpty().withMessage('Institution is required').isString().trim(),
  body('year').notEmpty().withMessage('Year is required').isInt({ min: 1900, max: new Date().getFullYear() }),
  body('description').optional().isString().trim(),
];

export const validateUpdateQualification = [
  body('title').optional().isString().trim(),
  body('institution').optional().isString().trim(),
  body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() }),
  body('description').optional().isString().trim(),
];