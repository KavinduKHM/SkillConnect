import { PrismaClient} from '@prisma/client';
import type { Course, Prisma } from '@prisma/client';
import type { CreateCourseInput, UpdateCourseInput } from '../types/index.js';

const prisma = new PrismaClient();

export class CourseService {
  // Create a course draft
  async createCourse(creatorId: string, data: CreateCourseInput): Promise<Course> {
    return prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        difficulty: data.difficulty,
        duration: data.duration ?? null,
        estimatedHours: data.estimatedHours ?? null,
        language: data.language ?? 'English',
        deliveryMethod: data.deliveryMethod ?? 'SELF_PACED',
        prerequisites: data.prerequisites ?? null,
        learningOutcomes: data.learningOutcomes ?? [],
        thumbnail: data.thumbnail ?? null,
        status: 'DRAFT',
        creatorId,
      },
    });
  }

  // Get all courses for a creator
  async getCoursesByCreatorId(creatorId: string): Promise<Course[]> {
    return prisma.course.findMany({
      where: { creatorId },
      include: {
        category: true,
        modules: {
          include: {
            lessons: {
              include: {
                materials: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get a single course
  async getCourseById(id: string, creatorId: string): Promise<Course | null> {
    return prisma.course.findFirst({
      where: {
        id,
        creatorId,
      },
      include: {
        category: true,
        modules: {
          include: {
            lessons: {
              include: {
                materials: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  // Update course
  async updateCourse(id: string, creatorId: string, data: UpdateCourseInput): Promise<Course> {
     const updateData: Prisma.CourseUpdateInput = {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
    ...(data.language !== undefined && { language: data.language }),
    ...(data.deliveryMethod !== undefined && { deliveryMethod: data.deliveryMethod }),
    ...(data.prerequisites !== undefined && { prerequisites: data.prerequisites }),
    ...(data.learningOutcomes !== undefined && { learningOutcomes: data.learningOutcomes }),
    ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
    ...(data.status !== undefined && { status: data.status }),

    // nullable fields: only set when provided
    ...(data.duration !== undefined && { duration: data.duration ?? null }),
    ...(data.estimatedHours !== undefined && { estimatedHours: data.estimatedHours ?? null }),

    // use relation field instead of categoryId scalar in checked update input
    ...(data.categoryId !== undefined && {
      category: { connect: { id: data.categoryId } },
    }),
  };

  return prisma.course.update({
    where: { id, creatorId },
    data: updateData,
  });
  }

  // Submit course for approval
  async submitCourse(id: string, creatorId: string): Promise<Course> {
    return prisma.course.update({
      where: {
        id,
        creatorId,
      },
      data: {
        status: 'SUBMITTED',
      },
    });
  }

  // Delete draft or rejected course (cleaning up non-cascade relations)
  async deleteCourse(id: string, creatorId: string): Promise<Course> {
    // Check if course is a draft or rejected
    const course = await prisma.course.findFirst({
      where: {
        id,
        creatorId,
        status: { in: ['DRAFT', 'REJECTED'] },
      },
    });

    if (!course) {
      throw new Error('Only draft or rejected courses can be deleted');
    }

    // Clean up any remaining records that don't cascade delete on DB level
    await prisma.$transaction([
      prisma.learningHistory.deleteMany({ where: { courseId: id } }),
      prisma.learnerRecommendation.deleteMany({ where: { courseId: id } }),
      prisma.report.deleteMany({ where: { courseId: id } }),
      prisma.certificate.deleteMany({ where: { courseId: id } }),
      prisma.course.delete({
        where: {
          id,
          creatorId,
        },
      }),
    ]);

    return course;
  }
}