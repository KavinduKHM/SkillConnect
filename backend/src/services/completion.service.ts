import prisma from '../config/database.js';
import { CompletionRequestStatus } from '@prisma/client';

export const checkCourseRequirements = async (learnerId: string, courseId: string) => {
  // 1. Check enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_learnerId: { courseId, learnerId } },
  });
  if (!enrollment) throw new Error('Learner is not enrolled in this course.');

  // 2. Check total lessons completed
  const totalLessons = await prisma.courseLesson.count({
    where: { module: { courseId } },
  });

  const completedLessons = await prisma.lessonProgress.count({
    where: {
      enrollmentId: enrollment.id,
      completed: true,
      lesson: { module: { courseId } },
    },
  });

  if (totalLessons > 0 && completedLessons < totalLessons) {
    return {
      eligible: false,
      reason: `Incomplete course lessons (${completedLessons}/${totalLessons} completed). Please complete all lessons first.`,
    };
  }

  // 3. Check all course quizzes / assessments
  const allQuizzes = await prisma.quizLink.findMany({
    where: { courseId },
  });

  for (const quiz of allQuizzes) {
    const completion = await prisma.quizCompletion.findUnique({
      where: { quizId_learnerId: { quizId: quiz.id, learnerId } },
    });

    if (!completion) {
      return { eligible: false, reason: `Assessment '${quiz.title}' is not completed yet.` };
    }
    if (quiz.passingScore && !completion.passed) {
      return { eligible: false, reason: `Did not pass assessment '${quiz.title}'. Minimum passing score: ${quiz.passingScore}%.` };
    }
  }

  // 4. Check all course assignments
  const allAssignments = await prisma.assignment.findMany({
    where: { courseId },
  });

  for (const assignment of allAssignments) {
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: assignment.id, learnerId },
      orderBy: { versionNumber: 'desc' },
      take: 1,
    });

    if (submissions.length === 0) {
      return { eligible: false, reason: `Assignment '${assignment.title}' is not submitted yet.` };
    }

    const latestSub = submissions[0]!;
    if (latestSub.status !== 'COMPLETED' && latestSub.status !== 'SUBMITTED') {
      return { eligible: false, reason: `Assignment '${assignment.title}' submission is incomplete.` };
    }
  }

  return { eligible: true, reason: 'All requirements met.' };
};

export const requestCourseCompletion = async (learnerId: string, courseId: string) => {
  // Check if already requested or completed
  const existingReq = await prisma.completionRequest.findFirst({
    where: { courseId, learnerId },
  });

  if (existingReq) {
    if (existingReq.status === 'APPROVED') throw new Error('Course already completed and approved.');
    if (existingReq.status === 'PENDING') throw new Error('Completion request is already pending.');
    if (existingReq.status === 'REJECTED') {
      const eligibility = await checkCourseRequirements(learnerId, courseId);
      if (!eligibility.eligible) {
        throw new Error(`Cannot request completion: ${eligibility.reason}`);
      }

      return prisma.completionRequest.update({
        where: { id: existingReq.id },
        data: {
          status: CompletionRequestStatus.PENDING,
          requestedAt: new Date(),
          rejectionReason: null,
          reviewedAt: null,
        },
      });
    }
  }

  const eligibility = await checkCourseRequirements(learnerId, courseId);
  if (!eligibility.eligible) {
    throw new Error(`Cannot request completion: ${eligibility.reason}`);
  }

  return prisma.completionRequest.create({
    data: {
      courseId,
      learnerId,
      status: CompletionRequestStatus.PENDING,
    },
  });
};

export const getLearnerCompletionRequests = async (learnerId: string) => {
  return prisma.completionRequest.findMany({
    where: { learnerId },
    include: {
      course: { select: { id: true, title: true } },
    },
  });
};

export const getCourseCompletionRequests = async (instructorId: string, courseId: string) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.creatorId !== instructorId) {
    throw new Error('Unauthorized to view requests for this course.');
  }

  return prisma.completionRequest.findMany({
    where: { courseId },
    include: {
      learner: { select: { id: true, name: true, email: true } },
    },
  });
};
