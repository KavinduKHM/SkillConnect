import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/roles.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  userIdParamValidator,
  suspendUserValidator,
  changeRoleValidator,
  categoryValidator,
  skillValidator,
} from '../validators/admin.validator.js';
import {
  // User Management
  getUsers,
  getUser,
  suspend,
  restore,
  changeRole,
  // Badge Management
  assignVerifiedBadge,
  removeVerifiedBadge,
  getVerifiedSharersList,
  // Qualification Verification
  getPendingQuals,
  verifyQual,
  rejectQual,
  // Course Approval
  getPendingCoursesList,
  approveCourse,
  rejectCourse,
  // Category Management
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  // Skill Management
  createSkill,
  updateSkill,
  deleteSkill,
  getSkills,
} from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(isAuthenticated, isAdmin);

// ============================================================
// USER MANAGEMENT ROUTES
// ============================================================

router.get('/users', getUsers);
router.get('/users/:id', userIdParamValidator, validate, getUser);
router.put('/users/:id/suspend', suspendUserValidator, validate, suspend);
router.put('/users/:id/restore', userIdParamValidator, validate, restore);
router.put('/users/:id/role', changeRoleValidator, validate, changeRole);

// ============================================================
// BADGE MANAGEMENT
// ============================================================

router.put('/users/:id/badge/assign', userIdParamValidator, validate, assignVerifiedBadge);
router.put('/users/:id/badge/remove', userIdParamValidator, validate, removeVerifiedBadge);
router.get('/skill-sharers/verified', getVerifiedSharersList);

// ============================================================
// QUALIFICATION VERIFICATION ROUTES
// ============================================================

router.get('/qualifications/pending', getPendingQuals);
router.put('/qualifications/:id/verify', verifyQual);
router.put('/qualifications/:id/reject', rejectQual);

// ============================================================
// COURSE APPROVAL
// ============================================================

router.get('/courses/pending', getPendingCoursesList);
router.put('/courses/:id/approve', approveCourse);
router.put('/courses/:id/reject', rejectCourse);

// ============================================================
// CATEGORY MANAGEMENT
// ============================================================

router.post('/categories', categoryValidator, validate, createCategory);
router.put('/categories/:id', categoryValidator, validate, updateCategory);
router.delete('/categories/:id', deleteCategory);
router.get('/categories', getCategories);

// ============================================================
// SKILL MANAGEMENT
// ============================================================

router.post('/skills', skillValidator, validate, createSkill);
router.put('/skills/:id', skillValidator, validate, updateSkill);
router.delete('/skills/:id', deleteSkill);
router.get('/skills', getSkills);

export default router;