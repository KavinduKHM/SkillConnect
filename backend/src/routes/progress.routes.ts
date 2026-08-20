import { Router } from 'express';
import { ProgressController } from '../controllers/progress.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = Router();
const progressController = new ProgressController();

// All routes require authentication
router.use(isAuthenticated);

// Get all learners' progress for a course (Skill Sharer)
router.get('/course/:courseId/learners', progressController.getLearnersProgress);

// Get specific learner's progress (Skill Sharer)
router.get('/course/:courseId/learner/:learnerId', progressController.getLearnerProgress);

// Get course analytics (Skill Sharer)
router.get('/course/:courseId/analytics', progressController.getCourseAnalytics);

// Mark lesson as complete (Learner)
router.post('/lesson/:lessonId/complete', progressController.markLessonComplete);

export default router;