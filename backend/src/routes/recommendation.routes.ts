import { type NextFunction, type Request, type Response, Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const validateCreateRecommendation = (_req: Request, _res: Response, next: NextFunction) => next();
const validateUpdateRecommendation = (_req: Request, _res: Response, next: NextFunction) => next();

const isSkillSharer = (req: Request, res: Response, next: NextFunction) => {
  const userRole = (req as any).user?.role;
  if (userRole === 'SKILL_SHARER') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Skill Sharer role required.',
  });
};

const router = Router();
const recommendationController = new RecommendationController();

// All routes require authentication
router.use(isAuthenticated);

// Create recommendation (Skill Sharer only)
router.post(
  '/',
  isSkillSharer,
  validateCreateRecommendation,
  recommendationController.createRecommendation
);

// Get my recommendations
router.get('/me', recommendationController.getMyRecommendations);

// Get recommendations for a specific learner
router.get('/learner/:learnerId', recommendationController.getRecommendationsForLearner);

// Update recommendation (Skill Sharer only)
router.put(
  '/:id',
  isSkillSharer,
  validateUpdateRecommendation,
  recommendationController.updateRecommendation
);

// Delete recommendation (Skill Sharer only)
router.delete('/:id', isSkillSharer, recommendationController.deleteRecommendation);

export default router;