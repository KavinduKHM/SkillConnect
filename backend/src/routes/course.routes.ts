import { Router } from 'express';
import { CourseController } from '../controllers/course.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { validateCreateCourse, validateUpdateCourse } from '../validators/course.validator.js';

const router = Router();
const courseController = new CourseController();

// All course routes require authentication
router.use(isAuthenticated);

// Create course draft
router.post('/', validateCreateCourse, courseController.createCourse);

// Get all my courses
router.get('/', courseController.getMyCourses);

// Get single course
router.get('/:id', courseController.getCourse);

// Update course
router.put('/:id', validateUpdateCourse, courseController.updateCourse);

// Submit course for approval
router.post('/:id/submit', courseController.submitCourse);

// Delete course (draft only)
router.delete('/:id', courseController.deleteCourse);

export default router;