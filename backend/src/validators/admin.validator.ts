import { body, param } from 'express-validator';

export const userIdParamValidator = [
  param('id').isUUID().withMessage('Invalid user ID format'),
];

export const suspendUserValidator = [
  param('id').isUUID().withMessage('Invalid user ID format'),
  body('reason').notEmpty().withMessage('Suspension reason is required'),
];

export const changeRoleValidator = [
  param('id').isUUID().withMessage('Invalid user ID format'),
  body('role').isIn(['LEARNER', 'SKILL_SHARER', 'ADMIN']).withMessage('Invalid role'),
];

export const categoryValidator = [
  body('name').notEmpty().withMessage('Category name is required'),
];

export const skillValidator = [
  body('name').notEmpty().withMessage('Skill name is required'),
];