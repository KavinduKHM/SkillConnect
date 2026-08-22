import { body } from 'express-validator';

export const validateCreateModule = [
  body('courseId')
    .notEmpty()
    .withMessage('courseId is required')
    .isUUID()
    .withMessage('courseId must be a valid UUID'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .trim(),
  body('description')
    .optional()
    .isString()
    .trim(),
  body('order')
    .notEmpty()
    .withMessage('Order is required')
    .isInt({ min: 1 })
    .withMessage('Order must be a positive integer'),
];

export const validateUpdateModule = [
  body('title')
    .optional()
    .isString()
    .trim(),
  body('description')
    .optional()
    .isString()
    .trim(),
  body('order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Order must be a positive integer'),
];