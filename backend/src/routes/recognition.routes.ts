import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { isSkillSharer } from '../middleware/roles.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

import {
  createReviewValidator,
  updateReviewValidator,
  createRecommendationValidator,
  updateRecommendationValidator,
} from '../validators/recognition.validator.js';

import {
  createReview,
  updateReview,
  deleteReview,
  getCourseReviews,
  createRecommendation,
  updateRecommendation,
  deleteRecommendation,
  getLearnerRecommendations,
} from '../controllers/recognition.controller.js';

const router = express.Router();

// ============================================================
// PUBLIC ROUTES
// ============================================================

// GET /api/recognition/reviews/course/:courseId
router.get('/reviews/course/:courseId', getCourseReviews);

// GET /api/recognition/recommendations/learner/:learnerId
router.get('/recommendations/learner/:learnerId', getLearnerRecommendations);

// ============================================================
// LEARNER ROUTES (Course Reviews)
// ============================================================
router.use(isAuthenticated);

// POST /api/recognition/reviews
router.post('/reviews', createReviewValidator, validate, createReview);

// PUT /api/recognition/reviews/:id
router.put('/reviews/:id', updateReviewValidator, validate, updateReview);

// DELETE /api/recognition/reviews/:id
router.delete('/reviews/:id', deleteReview);

// ============================================================
// INSTRUCTOR ROUTES (Learner Recommendations)
// ============================================================

// POST /api/recognition/recommendations
router.post(
  '/recommendations',
  isSkillSharer,
  createRecommendationValidator,
  validate,
  createRecommendation
);

// PUT /api/recognition/recommendations/:id
router.put(
  '/recommendations/:id',
  isSkillSharer,
  updateRecommendationValidator,
  validate,
  updateRecommendation
);

// DELETE /api/recognition/recommendations/:id
router.delete('/recommendations/:id', isSkillSharer, deleteRecommendation);

export default router;
