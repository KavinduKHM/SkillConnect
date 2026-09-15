import { Router } from 'express';
import { ModuleController } from '../controllers/module.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { validateCreateModule, validateUpdateModule } from '../validators/module.validator.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();
const moduleController = new ModuleController();

// All routes require authentication
router.use(isAuthenticated);

// Create module
router.post('/', validateCreateModule, validate, moduleController.createModule);

// Reorder modules
router.put('/:courseId/reorder', moduleController.reorderModules);

// Get modules for a course
router.get('/course/:courseId', moduleController.getModules);

// Get single module
router.get('/:id', moduleController.getModule);

// Update module
router.put('/:id', validateUpdateModule, validate, moduleController.updateModule);

// Delete module
router.delete('/:id', moduleController.deleteModule);

export default router;