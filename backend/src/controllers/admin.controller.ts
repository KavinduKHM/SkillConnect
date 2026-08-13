import type { Request, Response } from 'express';
import type { Role, UserStatus } from '@prisma/client';
import {
  getAllUsers,
  getUserById,
  suspendUser,
  restoreUser,
  changeUserRole,
  assignBadge,
  removeBadge,
  getVerifiedSharers,
  getPendingQualifications,
  verifyQualification,
  rejectQualification,
  getPendingCourses,
  approveCourse as approveCourseService,
  rejectCourse as rejectCourseService,
  createCategory as createCategoryService,
  updateCategory as updateCategoryService,
  deleteCategory as deleteCategoryService,
  getAllCategories,
  createSkill as createSkillService,
  updateSkill as updateSkillService,
  deleteSkill as deleteSkillService,
  getAllSkills,
} from '../services/admin.service.js';
import { logger } from '../utils/logger.js';

// ============================================================
// USER MANAGEMENT
// ============================================================

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, role, status, page, limit } = req.query;
    const result = await getAllUsers({
      ...(search ? { search: search as string } : {}),
      ...(role ? { role: role as Role } : {}),
      ...(status ? { status: status as UserStatus } : {}),
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
    });
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing user id' });
      return;
    }
    const user = await getUserById(id);
    res.status(200).json(user);
  } catch (error: any) {
    logger.error('Get user error:', error);
    res.status(404).json({ error: error.message });
  }
};

export const suspend = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing user id' });
      return;
    }
    const { reason } = req.body;
    const adminId = (req as any).user.id;
    const user = await suspendUser(id, reason, adminId);
    res.status(200).json({ message: 'User suspended', user });
  } catch (error: any) {
    logger.error('Suspend user error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const restore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing user id' });
      return;
    }
    const adminId = (req as any).user.id;
    const user = await restoreUser(id, adminId);
    res.status(200).json({ message: 'User restored', user });
  } catch (error: any) {
    logger.error('Restore user error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const changeRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing user id' });
      return;
    }
    const { role } = req.body;
    const adminId = (req as any).user.id;
    const user = await changeUserRole(id, role, adminId);
    res.status(200).json({ message: 'Role updated', user });
  } catch (error: any) {
    logger.error('Change role error:', error);
    res.status(400).json({ error: error.message });
  }
};

// ============================================================
// BADGE MANAGEMENT
// ============================================================

export const assignVerifiedBadge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing user id' });
      return;
    }
    const adminId = (req as any).user.id;
    const user = await assignBadge(id, adminId);
    res.status(200).json({ message: 'Badge assigned', user });
  } catch (error: any) {
    logger.error('Assign badge error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const removeVerifiedBadge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing user id' });
      return;
    }
    const adminId = (req as any).user.id;
    const user = await removeBadge(id, adminId);
    res.status(200).json({ message: 'Badge removed', user });
  } catch (error: any) {
    logger.error('Remove badge error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getVerifiedSharersList = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await getVerifiedSharers();
    res.status(200).json(users);
  } catch (error: any) {
    logger.error('Get verified sharers error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// QUALIFICATION VERIFICATION
// ============================================================

export const getPendingQuals = async (req: Request, res: Response): Promise<void> => {
  try {
    const qualifications = await getPendingQualifications();
    res.status(200).json(qualifications);
  } catch (error: any) {
    logger.error('Get pending qualifications error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const verifyQual = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing qualification id' });
      return;
    }
    const adminId = (req as any).user.id;
    const qualification = await verifyQualification(id, adminId);
    res.status(200).json({ message: 'Qualification verified', qualification });
  } catch (error: any) {
    logger.error('Verify qualification error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const rejectQual = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing qualification id' });
      return;
    }
    const { reason } = req.body;
    const adminId = (req as any).user.id;
    const qualification = await rejectQualification(id, reason, adminId);
    res.status(200).json({ message: 'Qualification rejected', qualification });
  } catch (error: any) {
    logger.error('Reject qualification error:', error);
    res.status(400).json({ error: error.message });
  }
};

// ============================================================
// COURSE APPROVAL
// ============================================================

export const getPendingCoursesList = async (req: Request, res: Response): Promise<void> => {
  try {
    const courses = await getPendingCourses();
    res.status(200).json(courses);
  } catch (error: any) {
    logger.error('Get pending courses error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const approveCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing course id' });
      return;
    }
    const adminId = (req as any).user.id;
    const course = await approveCourseService(id, adminId);
    res.status(200).json({ message: 'Course approved', course });
  } catch (error: any) {
    logger.error('Approve course error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const rejectCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing course id' });
      return;
    }
    const { reason } = req.body;
    const adminId = (req as any).user.id;
    const course = await rejectCourseService(id, reason, adminId);
    res.status(200).json({ message: 'Course rejected', course });
  } catch (error: any) {
    logger.error('Reject course error:', error);
    res.status(400).json({ error: error.message });
  }
};

// ============================================================
// CATEGORY MANAGEMENT
// ============================================================

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, icon, parentId } = req.body;
    const adminId = (req as any).user.id;
    const category = await createCategoryService({ name, description, icon, parentId }, adminId);
    res.status(201).json(category);
  } catch (error: any) {
    logger.error('Create category error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing category id' });
      return;
    }
    const { name, description, icon, parentId } = req.body;
    const adminId = (req as any).user.id;
    const category = await updateCategoryService(id, { name, description, icon, parentId }, adminId);
    res.status(200).json(category);
  } catch (error: any) {
    logger.error('Update category error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing category id' });
      return;
    }
    const adminId = (req as any).user.id;
    await deleteCategoryService(id, adminId);
    res.status(200).json({ message: 'Category deleted' });
  } catch (error: any) {
    logger.error('Delete category error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await getAllCategories();
    res.status(200).json(categories);
  } catch (error: any) {
    logger.error('Get categories error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// SKILL MANAGEMENT
// ============================================================

export const createSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, categoryId, aliases } = req.body;
    const adminId = (req as any).user.id;
    const skill = await createSkillService({ name, description, categoryId, aliases }, adminId);
    res.status(201).json(skill);
  } catch (error: any) {
    logger.error('Create skill error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const updateSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing skill id' });
      return;
    }
    const { name, description, categoryId, aliases } = req.body;
    const adminId = (req as any).user.id;
    const skill = await updateSkillService(id, { name, description, categoryId, aliases }, adminId);
    res.status(200).json(skill);
  } catch (error: any) {
    logger.error('Update skill error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing skill id' });
      return;
    }
    const adminId = (req as any).user.id;
    await deleteSkillService(id, adminId);
    res.status(200).json({ message: 'Skill deleted' });
  } catch (error: any) {
    logger.error('Delete skill error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const skills = await getAllSkills();
    res.status(200).json(skills);
  } catch (error: any) {
    logger.error('Get skills error:', error);
    res.status(500).json({ error: error.message });
  }
};