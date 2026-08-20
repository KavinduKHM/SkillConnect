import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProgressService {
  // Get course progress for instructor
  async getCourseProgressForInstructor(courseId: string, instructorId: string) {
    // Verify instructor owns the course
    const course = await prisma.course.findFirst({
      where: { id: courseId, creatorId: instructorId },
    });

    if (!course) {
      throw new Error('Course not found or you do not own it');
    }

    return prisma.courseProgress.findMany({
      where: { courseId },
      include: {
        enrollment: {
          include: {
            learner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  // Get all learners' progress for a course
  async getLearnersProgressForCourse(courseId: string, instructorId: string) {
    // Verify instructor owns the course
    const course = await prisma.course.findFirst({
      where: { id: courseId, creatorId: instructorId },
    });

    if (!course) {
      throw new Error('Course not found or you do not own it');
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId, status: 'ACTIVE' },
      include: {
        learner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        courseProgress: true,
        lessonProgress: {
          include: {
            lesson: true,
          },
        },
      },
    });

    return enrollments.map((enrollment) => ({
      learner: enrollment.learner,
      progress: enrollment.courseProgress,
      completedLessons: enrollment.lessonProgress.filter((lp) => lp.completed).length,
      totalLessons: enrollment.lessonProgress.length,
    }));
  }

  // Get specific learner's progress
  async getLearnerProgressForCourse(courseId: string, learnerId: string, instructorId: string) {
    // Verify instructor owns the course
    const course = await prisma.course.findFirst({
      where: { id: courseId, creatorId: instructorId },
    });

    if (!course) {
      throw new Error('Course not found or you do not own it');
    }

    return prisma.enrollment.findFirst({
      where: { courseId, learnerId },
      include: {
        learner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        courseProgress: true,
        lessonProgress: {
          include: {
            lesson: true,
          },
        },
      },
    });
  }

  // Get course analytics
  async getCourseAnalytics(courseId: string, instructorId: string) {
    // Verify instructor owns the course
    const course = await prisma.course.findFirst({
      where: { id: courseId, creatorId: instructorId },
    });

    if (!course) {
      throw new Error('Course not found or you do not own it');
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
    });

    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter((e) => e.status === 'ACTIVE').length;
    const completedEnrollments = enrollments.filter((e) => e.status === 'COMPLETED').length;

    const courseProgress = await prisma.courseProgress.findMany({
      where: { courseId },
    });

    const averageProgress = courseProgress.length > 0
      ? courseProgress.reduce((sum, p) => sum + p.progressPercentage, 0) / courseProgress.length
      : 0;

    // Get reviews
    const reviews = await prisma.courseReview.findMany({
      where: { courseId },
    });

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return {
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0,
      averageProgress,
      averageRating,
      totalReviews: reviews.length,
    };
  }

  // Mark lesson as complete (Learner)
  async markLessonComplete(learnerId: string, lessonId: string) {
    // Find enrollment for this lesson
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        learnerId,
        course: {
          modules: {
            some: {
              lessons: {
                some: {
                  id: lessonId,
                },
              },
            },
          },
        },
        status: 'ACTIVE',
      },
    });

    if (!enrollment) {
      throw new Error('You are not enrolled in this course or it is not active');
    }

    // Create or update lesson progress
    const lessonProgress = await prisma.lessonProgress.upsert({
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

    // Recalculate course progress
    await this.recalculateCourseProgress(enrollment.id);

    return lessonProgress;
  }

  // Recalculate course progress
  private async recalculateCourseProgress(enrollmentId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
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
        lessonProgress: true,
      },
    });

    if (!enrollment) return;

    const totalLessons = enrollment.course.modules.reduce(
      (sum, module) => sum + module.lessons.length,
      0
    );

    const completedLessons = enrollment.lessonProgress.filter((lp) => lp.completed).length;

    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    await prisma.courseProgress.upsert({
      where: { enrollmentId },
      update: {
        totalLessons,
        completedLessons,
        progressPercentage,
        updatedAt: new Date(),
      },
      create: {
        enrollmentId,
        courseId: enrollment.courseId,
        learnerId: enrollment.learnerId,
        totalLessons,
        completedLessons,
        progressPercentage,
      },
    });

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { progressPercentage },
    });
  }
}