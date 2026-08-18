import { body } from 'express-validator';

export const validateCreateProfile = [
  body('bio').optional().isString().trim(),
  body('skills').optional().isArray(),
  body('experience').optional().isString().trim(),
  body('portfolio').optional().isArray(),
  body('location').optional().isString().trim(),
  body('website').optional().isURL().withMessage('Must be a valid URL'),
  body('socialLinks.linkedin').optional().isURL(),
  body('socialLinks.github').optional().isURL(),
  body('socialLinks.twitter').optional().isURL(),
];

export const validateUpdateProfile = [
  body('bio').optional().isString().trim(),
  body('skills').optional().isArray(),
  body('experience').optional().isString().trim(),
  body('portfolio').optional().isArray(),
  body('location').optional().isString().trim(),
  body('website').optional().isURL(),
  body('socialLinks.linkedin').optional().isURL(),
  body('socialLinks.github').optional().isURL(),
  body('socialLinks.twitter').optional().isURL(),
];