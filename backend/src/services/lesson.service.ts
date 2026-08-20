import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { CourseLesson } from '@prisma/client';
import type { CreateLessonInput, UpdateLessonInput } from '../types/index.js';

const prisma = new PrismaClient();

export class LessonService {
  // Create lesson
  async createLesson(
    userId: string,
    moduleId: string,
    data: CreateLessonInput
  ): Promise<CourseLesson> {
    // Verify user owns the module's course
    const module = await prisma.courseModule.findFirst({
      where: {
        id: moduleId,
        course: {
          creatorId: userId,
        },
      },
    });

    if (!module) {
      throw new Error('Module not found or you do not own its course');
    }

    return prisma.courseLesson.create({
      data: {
        moduleId,
        title: data.title,
        description: data.description ?? null,
        content: data.content ?? null,
        order: data.order,
        isRequired: data.isRequired ?? true,
        estimatedMinutes: data.estimatedMinutes ?? null,
      },
    });
  }

  // Get all lessons for a module
  async getLessonsByModuleId(moduleId: string, userId: string): Promise<CourseLesson[]> {
    return prisma.courseLesson.findMany({
      where: {
        moduleId,
        module: {
          course: {
            creatorId: userId,
          },
        },
      },
      include: {
        materials: true,
      },
      orderBy: { order: 'asc' },
    });
  }

  // Get single lesson
  async getLessonById(id: string, userId: string): Promise<CourseLesson | null> {
    return prisma.courseLesson.findFirst({
      where: {
        id,
        module: {
          course: {
            creatorId: userId,
          },
        },
      },
      include: {
        materials: true,
      },
    });
  }

  // Update lesson
  async updateLesson(id: string, userId: string, data: UpdateLessonInput): Promise<CourseLesson> {
    const updateData: Prisma.CourseLessonUpdateInput = {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
      ...(data.isRequired !== undefined ? { isRequired: data.isRequired } : {}),
      ...(data.estimatedMinutes !== undefined ? { estimatedMinutes: data.estimatedMinutes } : {}),
    };

    return prisma.courseLesson.update({
      where: {
        id,
        module: {
          course: {
            creatorId: userId,
          },
        },
      },
      data: updateData,
    });
  }

  // Delete lesson
  async deleteLesson(id: string, userId: string): Promise<CourseLesson> {
    return prisma.courseLesson.delete({
      where: {
        id,
        module: {
          course: {
            creatorId: userId,
          },
        },
      },
    });
  }

  // Reorder lessons
  async reorderLessons(moduleId: string, userId: string, lessonIds: string[]): Promise<CourseLesson[]> {
    // Verify user owns the module's course
    const module = await prisma.courseModule.findFirst({
      where: {
        id: moduleId,
        course: {
          creatorId: userId,
        },
      },
    });

    if (!module) {
      throw new Error('Module not found or you do not own its course');
    }

    // Update order for each lesson
    const updates = lessonIds.map((id, index) =>
      prisma.courseLesson.update({
        where: { id },
        data: { order: index + 1 },
      })
    );

    await Promise.all(updates);

    return prisma.courseLesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
    });
  }
}