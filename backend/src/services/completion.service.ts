import prisma from '../config/database.js';
import { CompletionRequestStatus } from '@prisma/client';

export const checkCourseRequirements = async (learnerId: string, courseId: string) => {
  // 1. Check enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_learnerId: { courseId, learnerId } },
  });
  if (!enrollment) throw new Error('Learner is not enrolled in this course.');

  // 2. Check required lessons (simplistic check for now: all lessons in progress tracker)
  // In a robust system, we would query LessonProgress and CourseLesson
  
  // 3. Check required quizzes
  const requiredQuizzes = await prisma.quizLink.findMany({
    where: { courseId, requireForCompletion: true },
  });

  for (const quiz of requiredQuizzes) {
    const completion = await prisma.quizCompletion.findUnique({
      where: { quizId_learnerId: { quizId: quiz.id, learnerId } },
    });
    
    if (!completion) {
      return { eligible: false, reason: `Required quiz '${quiz.title}' is not completed.` };
    }
    if (quiz.passingScore && !completion.passed) {
      return { eligible: false, reason: `Did not pass required quiz '${quiz.title}'.` };
    }
  }

  // 4. Check required assignments
  const requiredAssignments = await prisma.assignment.findMany({
    where: { courseId, requireForCompletion: true },
  });

  for (const assignment of requiredAssignments) {
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: assignment.id, learnerId },
      orderBy: { versionNumber: 'desc' },
      take: 1,
    });

    if (submissions.length === 0) {
      return { eligible: false, reason: `Required assignment '${assignment.title}' is not submitted.` };
    }
    
    const latestSub = submissions[0]!;
    if (latestSub.status !== 'COMPLETED') {
      return { eligible: false, reason: `Required assignment '${assignment.title}' is pending grading or not completed.` };
    }
    
    // Check if grading rubric requires a pass, assume a pass is > 0 for now if not strictly defined.
    // Real implementation might compare maxMarks or passing threshold.
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
