import { Router } from 'express';
import { QualificationController } from '../controllers/qualification.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { validateCreateQualification, validateUpdateQualification } from '../validators/qualification.validator.js';

const router = Router();
const qualificationController = new QualificationController();

// All qualification routes require authentication
router.use(isAuthenticated);

// Create qualification
router.post('/', validateCreateQualification, qualificationController.createQualification);

// Get all qualifications
router.get('/', qualificationController.getQualifications);

// Get single qualification
router.get('/:id', qualificationController.getQualification);

// Update qualification
router.put('/:id', validateUpdateQualification, qualificationController.updateQualification);

// Delete qualification
router.delete('/:id', qualificationController.deleteQualification);

export default router;