import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';

export interface CourseFilterQuery {
  search?: string;
  categoryId?: string;
  difficulty?: string;
  deliveryMethod?: string;
  page?: number;
  limit?: number;
}

// -------------------------------------------------------------
// 1. COURSE DISCOVERY
// -------------------------------------------------------------

export const getPublishedCourses = async (query: CourseFilterQuery) => {
  const { search, categoryId, difficulty, deliveryMethod, page = 1, limit = 10 } = query;
  const skip = (page - 1) * limit;

  const whereCondition: any = {
    status: 'PUBLISHED',
  };

  if (search) {
    whereCondition.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (categoryId) {
    whereCondition.categoryId = categoryId;
  }

  if (difficulty) {
    whereCondition.difficulty = difficulty as any;
  }

  if (deliveryMethod) {
    whereCondition.deliveryMethod = deliveryMethod as any;
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where: whereCondition,
      include: {
        category: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, email: true, verifiedBadge: true } },
        _count: { select: { modules: true, enrollments: true } },
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.course.count({ where: whereCondition }),
  ]);

  return {
    courses,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCourseDetails = async (courseId: string, learnerId?: string) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      category: true,
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          verifiedBadge: true,
          profile: true,
        },
      },
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              description: true,
              order: true,
              isRequired: true,
              estimatedMinutes: true,
              materials: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  order: true,
                  duration: true,
                },
              },
            },
          },
        },
      },
      courseReviews: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          learner: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!course) {
    throw new Error('Course not found');
  }

  let userEnrollment = null;
  if (learnerId) {
    userEnrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_learnerId: {
          courseId,
          learnerId,
        },
      },
      include: {
        courseProgress: true,
      },
    });
  }

  return {
    course,
    userEnrollment,
  };
};

export const getCategories = async () => {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { courses: true } },
    },
  });
};

// -------------------------------------------------------------
// 2. ENROLLMENT MANAGEMENT
// -------------------------------------------------------------

export const enrollInCourse = async (learnerId: string, courseId: string) => {
  // Check if course exists and is published
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: {
          lessons: true,
        },
      },
    },
  });

  if (!course) {
    throw new Error('Course not found');
  }

  if (course.status !== 'PUBLISHED') {
    throw new Error('Cannot enroll in unpublished course');
  }

  // Check if already enrolled
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_learnerId: {
        courseId,
        learnerId,
      },
    },
  });

  if (existingEnrollment) {
    if (existingEnrollment.status === 'CANCELLED') {
      // Re-activate enrollment
      const updated = await prisma.enrollment.update({
        where: { id: existingEnrollment.id },
        data: { status: 'ACTIVE', cancelledAt: null },
      });
      return updated;
    }
    throw new Error('Learner is already enrolled in this course');
  }

  // Calculate total lessons
  const totalLessons = course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);

  // Create enrollment & progress tracking
  const enrollment = await prisma.enrollment.create({
    data: {
      courseId,
      learnerId,
      status: 'ACTIVE',
      courseProgress: {
        create: {
          courseId,
          learnerId,
          totalLessons,
          completedLessons: 0,
          progressPercentage: 0.0,
        },
      },
    },
    include: {
      courseProgress: true,
    },
  });

  // Increment course enrolledCount
  await prisma.course.update({
    where: { id: courseId },
    data: { enrolledCount: { increment: 1 } },
  });

  logger.info(`Learner ${learnerId} successfully enrolled in course ${courseId}`);
  return enrollment;
};

export const cancelEnrollment = async (learnerId: string, courseId: string) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_learnerId: { courseId, learnerId },
    },
  });

  if (!enrollment) {
    throw new Error('Enrollment record not found');
  }

  const updated = await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });

  return updated;
};

export const getMyLearning = async (learnerId: string) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { learnerId, status: { in: ['ACTIVE', 'COMPLETED'] } },
    include: {
      course: {
        include: {
          category: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          modules: {
            select: { id: true, lessons: { select: { id: true } } },
          },
        },
      },
      courseProgress: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  const inProgress = enrollments.filter((e) => e.progressPercentage < 100);
  const completed = enrollments.filter((e) => e.progressPercentage >= 100);

  return {
    totalEnrolled: enrollments.length,
    inProgress,
    completed,
  };
};

// -------------------------------------------------------------
// 3. LEARNING & PROGRESS TRACKING
// -------------------------------------------------------------

export const getLessonContent = async (learnerId: string, lessonId: string) => {
  const lesson = await prisma.courseLesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: true,
        },
      },
      materials: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!lesson) {
    throw new Error('Lesson not found');
  }

  // Verify learner is enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_learnerId: {
        courseId: lesson.module.courseId,
        learnerId,
      },
    },
  });

  if (!enrollment || enrollment.status === 'CANCELLED') {
    throw new Error('Access denied: Learner is not enrolled in this course');
  }

  // Log learning history
  await prisma.learningHistory.create({
    data: {
      learnerId,
      courseId: lesson.module.courseId,
      enrollmentId: enrollment.id,
      activityType: 'VIEWED_LESSON',
      description: `Viewed lesson: ${lesson.title}`,
      metadata: { lessonId, lessonTitle: lesson.title },
    },
  });

  return {
    lesson,
    courseId: lesson.module.courseId,
  };
};

export const markLessonComplete = async (
  learnerId: string,
  courseId: string,
  lessonId: string
) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_learnerId: { courseId, learnerId },
    },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: true,
            },
          },
        },
      },
    },
  });

  if (!enrollment || enrollment.status === 'CANCELLED') {
    throw new Error('Enrollment not found or cancelled');
  }

  // Upsert LessonProgress
  await prisma.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId,
      },
    },
    update: {
      completed: true,
      completedAt: new Date(),
    },
    create: {
      enrollmentId: enrollment.id,
      lessonId,
      completed: true,
      completedAt: new Date(),
    },
  });

  // Calculate overall progress
  const allLessons = enrollment.course.modules.flatMap((m) => m.lessons);
  const totalLessonsCount = allLessons.length;

  const completedLessonsCount = await prisma.lessonProgress.count({
    where: {
      enrollmentId: enrollment.id,
      completed: true,
    },
  });

  const progressPercentage =
    totalLessonsCount > 0 ? (completedLessonsCount / totalLessonsCount) * 100 : 100;

  const isFullyCompleted = progressPercentage >= 100;

  // Update Enrollment progress
  const updatedEnrollment = await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      progressPercentage,
      status: isFullyCompleted ? 'COMPLETED' : 'ACTIVE',
      completedAt: isFullyCompleted ? new Date() : null,
    },
  });

  // Update CourseProgress
  await prisma.courseProgress.upsert({
    where: { enrollmentId: enrollment.id },
    update: {
      totalLessons: totalLessonsCount,
      completedLessons: completedLessonsCount,
      progressPercentage,
      lastAccessedAt: new Date(),
    },
    create: {
      enrollmentId: enrollment.id,
      courseId,
      learnerId,
      totalLessons: totalLessonsCount,
      completedLessons: completedLessonsCount,
      progressPercentage,
      lastAccessedAt: new Date(),
    },
  });

  // Log Learning History
  await prisma.learningHistory.create({
    data: {
      learnerId,
      courseId,
      enrollmentId: enrollment.id,
      activityType: 'COMPLETED_LESSON',
      description: `Completed lesson ${lessonId} with progress ${Math.round(progressPercentage)}%`,
      metadata: { lessonId, progressPercentage },
    },
  });

  return {
    enrollment: updatedEnrollment,
    completedLessons: completedLessonsCount,
    totalLessons: totalLessonsCount,
    progressPercentage: Math.round(progressPercentage * 100) / 100,
    isFullyCompleted,
  };
};

export const getCourseProgress = async (learnerId: string, courseId: string) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_learnerId: { courseId, learnerId },
    },
    include: {
      courseProgress: true,
      lessonProgress: {
        include: {
          lesson: {
            select: { id: true, title: true, moduleId: true },
          },
        },
      },
    },
  });

  if (!enrollment) {
    throw new Error('Enrollment not found for this course');
  }

  return enrollment;
};
