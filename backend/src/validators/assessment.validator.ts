import { body, param } from 'express-validator';
import { QuizPlatform } from '@prisma/client';

// -------------------------------------------------------------
// QUIZ LINK VALIDATORS
// -------------------------------------------------------------

export const createQuizValidator = [
  body('courseId').isUUID().withMessage('Valid courseId is required'),
  body('title').trim().notEmpty().withMessage('Quiz title is required'),
  body('instructions').optional().trim(),
  body('platform')
    .optional()
    .isIn(Object.values(QuizPlatform))
    .withMessage(`Platform must be one of: ${Object.values(QuizPlatform).join(', ')}`),
  body('url').isURL({ require_protocol: true }).withMessage('A valid URL including protocol (http/https) is required'),
  body('dueDate').optional().isISO8601().toDate().withMessage('Valid due date is required'),
  body('passingScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Passing score must be between 0 and 100'),
  body('requireForCompletion').optional().isBoolean(),
];

export const updateQuizValidator = [
  param('id').isUUID().withMessage('Valid quiz ID is required'),
  body('title').optional().trim().notEmpty().withMessage('Quiz title cannot be empty'),
  body('instructions').optional().trim(),
  body('platform').optional().isIn(Object.values(QuizPlatform)),
  body('url').optional().isURL({ require_protocol: true }),
  body('dueDate').optional().isISO8601().toDate(),
  body('passingScore').optional().isFloat({ min: 0, max: 100 }),
  body('requireForCompletion').optional().isBoolean(),
];

export const completeQuizValidator = [
  param('id').isUUID().withMessage('Valid quiz ID is required'),
  body('score').optional().isFloat({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('passed').optional().isBoolean().withMessage('Passed must be a boolean'),
];
