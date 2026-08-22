import { PrismaClient } from '@prisma/client';
import type { CourseModule } from '@prisma/client';
import type { CreateModuleInput, UpdateModuleInput } from '../types/index.js';

const prisma = new PrismaClient();

export class ModuleService {
  // Create module
  async createModule(
    userId: string,
    courseId: string,
    data: CreateModuleInput
  ): Promise<CourseModule> {
    // Verify user owns the course
    const course = await prisma.course.findFirst({
      where: { id: courseId, creatorId: userId },
    });

    if (!course) {
      throw new Error('Course not found or you do not own it');
    }

    return prisma.courseModule.create({
      data: {
        courseId: courseId,
        title: data.title,
        description: data.description ?? null,
        order: data.order,
      },
    });
  }

  // Get all modules for a course
  async getModulesByCourseId(courseId: string, userId: string): Promise<CourseModule[]> {
    // Verify user owns the course
    const course = await prisma.course.findFirst({
      where: { id: courseId, creatorId: userId },
    });

    if (!course) {
      throw new Error('Course not found or you do not own it');
    }

    return prisma.courseModule.findMany({
      where: { courseId },
      include: {
        lessons: {
          include: {
            materials: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  // Get single module
  async getModuleById(id: string, userId: string): Promise<CourseModule | null> {
    return prisma.courseModule.findFirst({
      where: {
        id,
        course: {
          creatorId: userId,
        },
      },
      include: {
        lessons: {
          include: {
            materials: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  // Update module
  async updateModule(id: string, userId: string, data: UpdateModuleInput): Promise<CourseModule> {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.order !== undefined) updateData.order = data.order;

    return prisma.courseModule.update({
      where: {
        id,
        course: {
          creatorId: userId,
        },
      },
      data: updateData,
    });
  }

  // Delete module
  async deleteModule(id: string, userId: string): Promise<CourseModule> {
    return prisma.courseModule.delete({
      where: {
        id,
        course: {
          creatorId: userId,
        },
      },
    });
  }

  // Reorder modules
  async reorderModules(courseId: string, userId: string, moduleIds: string[]): Promise<CourseModule[]> {
    // Verify user owns the course
    const course = await prisma.course.findFirst({
      where: { id: courseId, creatorId: userId },
    });

    if (!course) {
      throw new Error('Course not found or you do not own it');
    }

    // Update order for each module
    const updates = moduleIds.map((id, index) =>
      prisma.courseModule.update({
        where: { id },
        data: { order: index + 1 },
      })
    );

    await Promise.all(updates);

    return prisma.courseModule.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });
  }
}