import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { isSkillSharer } from '../middleware/roles.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

import {
  createAssignmentValidator,
  submitAssignmentValidator,
  gradeAssignmentValidator,
} from '../validators/assignment.validator.js';

import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  getCourseAssignments,
  getSingleAssignment,
  getLearnerSubmissions,
  submitAssignment,
} from '../controllers/assignment.controller.js';

const router = express.Router();

// ============================================================
// ASSIGNMENT ROUTES
// ============================================================

// Public / Learner routes (requires authentication)
router.use('/', isAuthenticated);

// GET /api/assignments/course/:courseId
router.get('/course/:courseId', getCourseAssignments);

// GET /api/assignments/:id
router.get('/:id', getSingleAssignment);

// GET /api/assignments/:id/my-submissions
router.get('/:id/my-submissions', getLearnerSubmissions);

// POST /api/assignments/:id/submit
router.post('/:id/submit', submitAssignmentValidator, validate, submitAssignment);

// ============================================================
// INSTRUCTOR ROUTES
// ============================================================

// POST /api/assignments
router.post('/', isSkillSharer, createAssignmentValidator, validate, createAssignment);

// PUT /api/assignments/:id
router.put('/:id', isSkillSharer, validate, updateAssignment); // We can add an update validator later

// DELETE /api/assignments/:id
router.delete('/:id', isSkillSharer, deleteAssignment);

// GET /api/assignments/:id/submissions
router.get('/:id/submissions', isSkillSharer, getAssignmentSubmissions);

// POST /api/assignments/submissions/:submissionId/grade
router.post(
  '/submissions/:submissionId/grade',
  isSkillSharer,
  gradeAssignmentValidator,
  validate,
  gradeSubmission
);

export default router;
