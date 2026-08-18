import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { validateCreateProfile, validateUpdateProfile } from '../validators/profile.validator.js';

const router = Router();
const profileController = new ProfileController();

// All profile routes require authentication
router.use(isAuthenticated);

// Create profile
router.post('/', validateCreateProfile, profileController.createProfile);

// Get my profile
router.get('/me', profileController.getMyProfile);

// Update profile
router.put('/me', validateUpdateProfile, profileController.updateProfile);

// Get public profile (any user)
router.get('/public/:userId', profileController.getPublicProfile);

export default router;