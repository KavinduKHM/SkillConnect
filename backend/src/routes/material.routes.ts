import { Router } from 'express';
import { MaterialController } from '../controllers/material.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';

const router = Router();
const materialController = new MaterialController();

// All routes require authentication
router.use(isAuthenticated);

// Upload material (file or external link)
router.post(
  '/',
  uploadSingle('file'),
  materialController.uploadMaterial
);

// Get materials for a lesson
router.get('/lesson/:lessonId', materialController.getMaterials);

// Get single material
router.get('/:id', materialController.getMaterial);

// Update material
router.put('/:id', materialController.updateMaterial);

// Delete material
router.delete('/:id', materialController.deleteMaterial);

export default router;