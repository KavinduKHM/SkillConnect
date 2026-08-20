import { Router } from 'express';
import { LessonController } from '../controllers/lesson.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = Router();
const lessonController = new LessonController();

// All routes require authentication
router.use(isAuthenticated);

// Create lesson
router.post('/', lessonController.createLesson);

// Reorder lessons
router.put('/:moduleId/reorder', lessonController.reorderLessons);

// Get lessons for a module
router.get('/module/:moduleId', lessonController.getLessons);

// Get single lesson
router.get('/:id', lessonController.getLesson);

// Update lesson
router.put('/:id', lessonController.updateLesson);

// Delete lesson
router.delete('/:id', lessonController.deleteLesson);

export default router;