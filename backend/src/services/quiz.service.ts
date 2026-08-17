import prisma from '../config/database.js';
import { QuizPlatform } from '@prisma/client';

export interface CreateQuizLinkData {
  courseId: string;
  title: string;
  instructions?: string;
  platform?: QuizPlatform;
  url: string;
  dueDate?: Date;
  passingScore?: number;
  requireForCompletion?: boolean;
}

export interface UpdateQuizLinkData {
  title?: string;
  instructions?: string;
  platform?: QuizPlatform;
  url?: string;
  dueDate?: Date;
  passingScore?: number;
  requireForCompletion?: boolean;
}

export interface CompleteQuizData {
  score?: number;
  passed?: boolean;
}

/**
 * Ensures the user has permissions to modify course content.
 * Admin or course creator are allowed.
 */
const verifyCourseOwnership = async (instructorId: string, courseId: string) => {
  const user = await prisma.user.findUnique({ where: { id: instructorId } });
  if (!user) throw new Error('User not found');

  if (user.role === 'ADMIN') return true;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error('Course not found');
  if (course.creatorId !== instructorId) {
    throw new Error('You do not have permission to modify this course');
  }

  return true;
};

// -------------------------------------------------------------
// INSTRUCTOR OPERATIONS
// -------------------------------------------------------------

export const createQuizLink = async (instructorId: string, data: CreateQuizLinkData) => {
  await verifyCourseOwnership(instructorId, data.courseId);

  return prisma.quizLink.create({
    data: {
      instructorId,
      courseId: data.courseId,
      title: data.title,
      instructions: data.instructions ?? null,
      platform: data.platform || QuizPlatform.GOOGLE_FORMS,
      url: data.url,
      dueDate: data.dueDate ?? null,
      passingScore: data.passingScore ?? null,
      requireForCompletion: data.requireForCompletion ?? false,
    },
  });
};

export const updateQuizLink = async (instructorId: string, quizId: string, data: UpdateQuizLinkData) => {
  const quiz = await prisma.quizLink.findUnique({ where: { id: quizId } });
  if (!quiz) throw new Error('Quiz link not found');

  await verifyCourseOwnership(instructorId, quiz.courseId);

  return prisma.quizLink.update({
    where: { id: quizId },
    data,
  });
};

export const deleteQuizLink = async (instructorId: string, quizId: string) => {
  const quiz = await prisma.quizLink.findUnique({ where: { id: quizId } });
  if (!quiz) throw new Error('Quiz link not found');

  await verifyCourseOwnership(instructorId, quiz.courseId);

  return prisma.quizLink.delete({
    where: { id: quizId },
  });
};

export const getQuizCompletions = async (instructorId: string, quizId: string) => {
  const quiz = await prisma.quizLink.findUnique({ where: { id: quizId } });
  if (!quiz) throw new Error('Quiz link not found');

  await verifyCourseOwnership(instructorId, quiz.courseId);

  return prisma.quizCompletion.findMany({
    where: { quizId },
    include: {
      learner: {
        select: { id: true, name: true, email: true, profilePicture: true },
      },
    },
    orderBy: { completedAt: 'desc' },
  });
};

// -------------------------------------------------------------
// LEARNER / SHARED OPERATIONS
// -------------------------------------------------------------

export const getCourseQuizzes = async (courseId: string) => {
  return prisma.quizLink.findMany({
    where: { courseId },
    orderBy: { createdAt: 'asc' },
  });
};

export const getQuizLink = async (quizId: string) => {
  const quiz = await prisma.quizLink.findUnique({ where: { id: quizId } });
  if (!quiz) throw new Error('Quiz link not found');
  return quiz;
};

export const recordQuizCompletion = async (learnerId: string, quizId: string, data: CompleteQuizData) => {
  const quiz = await prisma.quizLink.findUnique({ where: { id: quizId } });
  if (!quiz) throw new Error('Quiz link not found');

  // Verify learner is enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_learnerId: { courseId: quiz.courseId, learnerId } },
  });

  if (!enrollment) {
    throw new Error('You must be enrolled in this course to complete its quizzes');
  }

  // Determine pass status if passing score is set
  let passedStatus = data.passed;
  if (passedStatus === undefined && quiz.passingScore !== null && data.score !== undefined) {
    passedStatus = data.score >= quiz.passingScore;
  }

  // Upsert completion record
  const completion = await prisma.quizCompletion.upsert({
    where: {
      quizId_learnerId: { quizId, learnerId },
    },
    update: {
      score: data.score ?? null,
      passed: passedStatus ?? null,
      status: 'COMPLETED',
      completedAt: new Date(),
    },
    create: {
      quizId,
      learnerId,
      score: data.score ?? null,
      passed: passedStatus ?? null,
      status: 'COMPLETED',
    },
  });

  // Update overall completion stats for the quiz
  const totalCompletions = await prisma.quizCompletion.count({ where: { quizId } });
  const allScores = await prisma.quizCompletion.findMany({
    where: { quizId, score: { not: null } },
    select: { score: true },
  });
  
  let averageScore = null;
  if (allScores.length > 0) {
    const sum = allScores.reduce((acc, curr) => acc + (curr.score || 0), 0);
    averageScore = sum / allScores.length;
  }

  await prisma.quizLink.update({
    where: { id: quizId },
    data: {
      completionCount: totalCompletions,
      averageScore,
    },
  });

  return completion;
};
