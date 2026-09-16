import express from 'express';
import { isAuthenticated, optionalAuth } from '../middleware/auth.middleware.js';
import {
  listCourses,
  getCourseById,
  listCategories,
  getSharerProfile,
  enroll,
  cancel,
  getMyLearningDashboard,
  getLesson,
  completeLesson,
  fetchProgress,
} from '../controllers/learner.controller.js';

const router = express.Router();

// -------------------------------------------------------------
// PUBLIC DISCOVERY ROUTES
// -------------------------------------------------------------
router.get('/courses', listCourses);
router.get('/courses/categories', listCategories);
router.get('/categories', listCategories);
router.get('/sharers/:id', optionalAuth, getSharerProfile);
router.get('/courses/:id', optionalAuth, getCourseById);

// -------------------------------------------------------------
// PROTECTED LEARNER ROUTES (Requires Authentication)
// -------------------------------------------------------------
router.use(isAuthenticated);

// Enrollment Management
router.post('/enrollments', enroll);
router.delete('/enrollments/:courseId', cancel);
router.get('/my-learning', getMyLearningDashboard);

// Learning & Progress Tracking
router.get('/lessons/:lessonId', getLesson);
router.post('/progress/complete', completeLesson);
router.get('/progress/:courseId', fetchProgress);

export default router;
