import { body, param } from 'express-validator';
import { SubmissionMethod } from '@prisma/client';

export const createAssignmentValidator = [
  body('courseId').isUUID().withMessage('Valid courseId is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('instructions').optional().trim(),
  body('deadline').isISO8601().toDate().withMessage('Valid deadline is required'),
  body('maxMarks').optional().isInt({ min: 1 }).withMessage('Max marks must be greater than 0'),
  body('maxSubmissions').optional().isInt({ min: 1 }),
  body('allowedFileTypes').optional().isArray(),
  body('maxFileSize').optional().isInt({ min: 1 }),
  body('submissionMethods')
    .optional()
    .isArray()
    .custom((methods: any[]) => {
      const validMethods = Object.values(SubmissionMethod);
      for (const method of methods) {
        if (!validMethods.includes(method)) {
          throw new Error(`Invalid submission method: ${method}`);
        }
      }
      return true;
    }),
  body('requireForCompletion').optional().isBoolean(),
  body('acceptLate').optional().isBoolean(),
  body('latePenalty').optional().isInt({ min: 0, max: 100 }),
  body('lateWindow').optional().isInt({ min: 0 }),
];

export const submitAssignmentValidator = [
  param('id').isUUID().withMessage('Valid assignment ID is required'),
  body('githubLink').optional().isURL().withMessage('Must be a valid URL'),
  body('textSubmission').optional().trim(),
];

export const gradeAssignmentValidator = [
  param('submissionId').isUUID().withMessage('Valid submission ID is required'),
  body('grade').isFloat({ min: 0 }).withMessage('Grade must be 0 or greater'),
  body('feedback').optional().trim(),
  body('feedbackAttachments').optional().isArray(),
];
