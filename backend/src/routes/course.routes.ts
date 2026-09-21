import { Router } from 'express';
import { CourseController } from '../controllers/course.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { validateCreateCourse, validateUpdateCourse } from '../validators/course.validator.js';
import { uploadSingle } from '../middleware/upload.middleware.js';
import { uploadFile } from '../services/upload.service.js';

const router = Router();
const courseController = new CourseController();

// All course routes require authentication
router.use(isAuthenticated);

// Upload course thumbnail
router.post('/upload', uploadSingle('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }
    const result = await uploadFile(req.file, 'course-thumbnails');
    res.status(200).json({ success: true, url: result.url });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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