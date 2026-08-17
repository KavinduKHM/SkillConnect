import express from 'express';
import { uploadAssignmentFiles } from '../middleware/upload.middleware.js';
import { uploadMultipleFiles } from '../services/upload.service.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { isSkillSharer } from '../middleware/roles.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

import {
  createQuizValidator,
  updateQuizValidator,
  completeQuizValidator,
} from '../validators/assessment.validator.js';

import {
  createQuizLink,
  updateQuizLink,
  deleteQuizLink,
  getQuizCompletions,
  getCourseQuizzes,
  getSingleQuiz,
  completeQuiz,
} from '../controllers/quiz.controller.js';

const router = express.Router();

// ============================================================
// 1. UPLOAD TESTING (Temporary)
// ============================================================
router.post('/upload-test', uploadAssignmentFiles, async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }
    const uploadResults = await uploadMultipleFiles(files, 'test-uploads');
    res.status(200).json({ success: true, files: uploadResults });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 2. EXTERNAL ASSESSMENTS (QUIZ LINKS)
// ============================================================

// Public / Learner routes (requires authentication)
router.use('/quizzes', isAuthenticated);
router.get('/quizzes/course/:courseId', getCourseQuizzes);
router.get('/quizzes/:id', getSingleQuiz);
router.post('/quizzes/:id/complete', completeQuizValidator, validate, completeQuiz);

// Instructor routes
router.post('/quizzes', isSkillSharer, createQuizValidator, validate, createQuizLink);
router.put('/quizzes/:id', isSkillSharer, updateQuizValidator, validate, updateQuizLink);
router.delete('/quizzes/:id', isSkillSharer, deleteQuizLink);
router.get('/quizzes/:id/completions', isSkillSharer, getQuizCompletions);

export default router;

