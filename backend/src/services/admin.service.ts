import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';
import { CourseStatus, QualificationStatus, Role, UserStatus } from '@prisma/client';

// ============================================================
// USER MANAGEMENT (Add these if not already present)
// ============================================================

export const getAllUsers = async (filters: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { search, role, status, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (status) {
    where.status = status;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        verifiedBadge: true,
        profilePicture: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            courses: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      qualifications: {
        include: {
          documents: true,
          reviews: true,
        },
      },
      courses: {
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          title: true,
          enrolledCount: true,
          rating: true,
          createdAt: true,
        },
      },
      adminActions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export const suspendUser = async (userId: string, reason: string, adminId: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'SUSPENDED',
      suspendedReason: reason,
      suspendedAt: new Date(),
    },
  });

  await prisma.adminAction.create({
    data: {
      adminId,
      actionType: 'SUSPEND',
      entityType: 'USER',
      entityId: userId,
      description: `Suspended user ${user.email}: ${reason}`,
    },
  });

  logger.info(`User suspended: ${user.email} by admin ${adminId}`);

  return user;
};

export const restoreUser = async (userId: string, adminId: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'ACTIVE',
      suspendedReason: null,
      suspendedAt: null,
    },
  });

  await prisma.adminAction.create({
    data: {
      adminId,
      actionType: 'UPDATE',
      entityType: 'USER',
      entityId: userId,
      description: `Restored user ${user.email}`,
    },
  });

  logger.info(`User restored: ${user.email} by admin ${adminId}`);

  return user;
};

export const changeUserRole = async (userId: string, role: string, adminId: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
  });

  await prisma.adminAction.create({
    data: {
      adminId,
      actionType: 'UPDATE',
      entityType: 'USER',
      entityId: userId,
      description: `Changed role of ${user.email} to ${role}`,
    },
  });

  logger.info(`Role changed: ${user.email} to ${role} by admin ${adminId}`);

  return user;
};

// ============================================================
// BADGE MANAGEMENT
// ============================================================

export const assignBadge = async (userId: string, adminId: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { verifiedBadge: true },
  });

  await prisma.adminAction.create({
    data: {
      adminId,
      actionType: 'BADGE',
      entityType: 'USER',
      entityId: userId,
      description: `Assigned verified badge to ${user.email}`,
    },
  });

  logger.info(`Badge assigned: ${user.email} by admin ${adminId}`);

  return user;
};

export const removeBadge = async (userId: string, adminId: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { verifiedBadge: false },
  });

  await prisma.adminAction.create({
    data: {
      adminId,
      actionType: 'BADGE',
      entityType: 'USER',
      entityId: userId,
      description: `Removed verified badge from ${user.email}`,
    },
  });

  logger.info(`Badge removed: ${user.email} by admin ${adminId}`);

  return user;
};

export const getVerifiedSharers = async () => {
  return prisma.user.findMany({
    where: {
      role: Role.SKILL_SHARER,
      verifiedBadge: true,
      status: UserStatus.ACTIVE,
    },
    include: {
      profile: true,
      _count: {
        select: {
          courses: {
            where: { status: CourseStatus.PUBLISHED },
          },
        },
      },
    },
  });
};

// ============================================================
// QUALIFICATION VERIFICATION
// ============================================================

export const getPendingQualifications = async () => {
  return prisma.qualification.findMany({
    where: {
      status: 'PENDING_VERIFICATION',
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      profile: true,
      documents: true,
    },
    orderBy: { createdAt: 'asc' },
  });
};

export const verifyQualification = async (qualificationId: string, adminId: string) => {
  const qualification = await prisma.qualification.update({
    where: { id: qualificationId },
    data: {
      status: 'VERIFIED',
      verifiedAt: new Date(),
      verifiedBy: adminId,
    },
  });

  // Auto-assign verified badge to user
  await prisma.user.update({
    where: { id: qualification.userId },
    data: { verifiedBadge: true },
  });

  await prisma.qualificationReview.create({
    data: {
      qualificationId,
      adminId,
      status: 'VERIFIED',
      comments: 'Qualification verified',
    },
  });

  await prisma.adminAction.create({
    data: {
      adminId,
      actionType: 'VERIFY',
      entityType: 'QUALIFICATION',
      entityId: qualificationId,
      description: `Verified qualification: ${qualification.title}`,
    },
  });

  logger.info(`Qualification verified: ${qualification.title} by admin ${adminId}`);

  return qualification;
};

export const rejectQualification = async (qualificationId: string, reason: string, adminId: string) => {
  const qualification = await prisma.qualification.update({
    where: { id: qualificationId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
    },
  });

  await prisma.qualificationReview.create({
    data: {
      qualificationId,
      adminId,
      status: 'REJECTED',
      comments: reason,
    },
  });

  await prisma.adminAction.create({
    data: {
      adminId,
      actionType: 'REJECT',
      entityType: 'QUALIFICATION',
      entityId: qualificationId,
      description: `Rejected qualification: ${qualification.title}. Reason: ${reason}`,
    },
  });

  logger.info(`Qualification rejected: ${qualification.title} by admin ${adminId}`);

  return qualification;
};

// ============================================================
// COURSE APPROVAL
// ============================================================

export const getPendingCourses = async () => {
  return prisma.course.findMany({
    where: {
      status: CourseStatus.SUBMITTED,
    },
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
          verifiedBadge: true,
        },
      },
      category: true,
    },
    orderBy: { createdAt: 'asc' },
  });
};

export const approveCourse = async (courseId: string, adminId: string) => {
  const course = await prisma.course.update({
    where: { id: courseId },
    data: {
      status: CourseStatus.APPROVED,
    },
  });

  await prisma.courseApproval.create({
    data: {
      courseId,
      adminId,
      status: CourseStatus.APPROVED,
      comments: 'Course approved',
    },
  });

  // Publish the course
  await prisma.course.update({
    where: { id: courseId },
    data: { status: CourseStatus.PUBLISHED },
  });

  await prisma.adminAction.create({
    data: {
      adminId,
      actionType: 'APPROVE',
      entityType: 'COURSE',
      entityId: courseId,
      description: `Approved course: ${course.title}`,
    },
  });

  logger.info(`Course approved: ${course.title} by admin ${adminId}`);

  return course;
};

export const rejectCourse = async (courseId: string, reason: string, adminId: string) => {
  const course = await prisma.course.update({
    where: { id: courseId },
    data: { status: CourseStatus.REJECTED },
  });

  await prisma.courseApproval.create({
    data: {
      courseId,
      adminId,
      status: CourseStatus.REJECTED,
      comments: reason,
    },
  });

  await prisma.adminAction.create({
    data: {
      adminId,
      actionType: 'REJECT',
      entityType: 'COURSE',
      entityId: courseId,
      description: `Rejected course: ${course.title}. Reason: ${reason}`,
    },
  });

  logger.info(`Course rejected: ${course.title} by admin ${adminId}`);

  return course;
};

// ============================================================
// CATEGORY MANAGEMENT
// ============================================================

export const createCategory = async (data: {
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
}, adminId: string) => {
  const categoryData = {
    name: data.name,
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.icon !== undefined ? { icon: data.icon } : {}),
    ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
  };

  const category = await prisma.category.create({
    data: categoryData,
  });

  await prisma.adminAction.create({
    data: {
      adminId,
      actionType: 'CREATE',
      entityType: 'CATEGORY',
      entityId: category.id,
      description: `Created category: ${data.name}`,
    },
  });

  logger.info(`Category created: ${data.name} by admin ${adminId}`);

  return category;
};

export const updateCategory = async (id: string, data: {
  name?: string;
  description?: string;
  icon?: string;
  parentId?: string;
}, adminId: string) => {
  const categoryData = {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.icon !== undefined ? { icon: data.icon } : {}),
    ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
  };

  const category = await prisma.category.update({
    where: { id },
    data: categoryData,
  });

  await prisma.adminAction.create({
    data: {
      adminId,
      actionType: 'UPDATE',
      entityType: 'CATEGORY',
      entityId: id,
      description: `Updated category: ${data.name || category.name}`,
    },
  });

  logger.info(`Category updated: ${data.name || category.name} by admin ${adminId}`);

  return category;
};

export const deleteCategory = async (id: string, adminId: string) => {
  // Graceful pre-checks to return clean, helpful error messages:
  // 1. Check if category is used by courses
  const courseCount = await prisma.course.count({
    where: { categoryId: id },
  });
  if (courseCount > 0) {
    throw new Error(`Cannot delete category because it has ${courseCount} associated courses. Please reassign those courses first.`);
  }

  // 2. Check if category is a parent to other categories (subcategories)
  const childCount = await prisma.category.count({
    where: { parentId: id },
  });
  if (childCount > 0) {
    throw new Error(`Cannot delete category because it has ${childCount} subcategories. Please reassign or delete them first.`);
  }

  // 3. Check if category is used by skills
  const skillCount = await prisma.skill.count({
    where: { categoryId: id },
  });
  if (skillCount > 0) {
    throw new Error(`Cannot delete category because it is linked to ${skillCount} skills. Please reassign those skills first.`);
  }

  const category = await prisma.category.delete({
    where: { id },
  });

  await prisma.adminAction.create({
    data: {
      adminId,
      actionType: 'DELETE',
      entityType: 'CATEGORY',
      entityId: id,
      description: `Deleted category: ${category.name}`,
    },
  });

  logger.info(`Category deleted: ${category.name} by admin ${adminId}`);

  return category;
};

export const getAllCategories = async () => {
  return prisma.category.findMany({
    include: {
      children: true,
      _count: {
        select: { courses: true },
      },
    },
    orderBy: { name: 'asc' },
  });
};

// ============================================================
// SKILL MANAGEMENT
// ============================================================

export const createSkill = async (data: {
  name: string;
  description?: string;
  categoryId?: string;
  aliases?: string[];
}, adminId: string) => {
  const skillData = {
    name: data.name,
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
    ...(data.aliases !== undefined ? { aliases: data.aliases } : {}),
  };

  const skill = await prisma.skill.create({
    data: skillData,
  });

  await prisma.adminAction.create({
    data: {
      adminId,
      actionType: 'CREATE',
      entityType: 'SKILL',
      entityId: skill.id,
      description: `Created skill: ${data.name}`,
    },
  });

  logger.info(`Skill created: ${data.name} by admin ${adminId}`);

  return skill;
};

export const updateSkill = async (id: string, data: {
  name?: string;
  description?: string;
  categoryId?: string;
  aliases?: string[];
}, adminId: string) => {
  const skillData = {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
    ...(data.aliases !== undefined ? { aliases: data.aliases } : {}),
  };

  const skill = await prisma.skill.update({
    where: { id },
    data: skillData,
  });

  await prisma.adminAction.create({
    data: {
      adminId,
      actionType: 'UPDATE',
      entityType: 'SKILL',
      entityId: id,
      description: `Updated skill: ${data.name || skill.name}`,
    },
  });

  logger.info(`Skill updated: ${data.name || skill.name} by admin ${adminId}`);

  return skill;
};

export const deleteSkill = async (id: string, adminId: string) => {
  const skill = await prisma.skill.delete({
    where: { id },
  });

  await prisma.adminAction.create({
    data: {
      adminId,
      actionType: 'DELETE',
      entityType: 'SKILL',
      entityId: id,
      description: `Deleted skill: ${skill.name}`,
    },
  });

  logger.info(`Skill deleted: ${skill.name} by admin ${adminId}`);

  return skill;
};

export const getAllSkills = async () => {
  return prisma.skill.findMany({
    include: {
      category: true,
    },
    orderBy: { name: 'asc' },
  });
};