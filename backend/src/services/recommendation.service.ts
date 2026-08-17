import prisma from '../config/database.js';

export const createRecommendation = async (
  instructorId: string,
  data: {
    learnerId: string;
    courseId: string;
    message: string;
    skillDemonstrated?: string;
    strengths?: string;
    qualityOfAssignments?: string;
    participation?: string;
    isPublic?: boolean;
  }
) => {
  const course = await prisma.course.findUnique({ where: { id: data.courseId } });
  if (!course || course.creatorId !== instructorId) {
    throw new Error('You must be the instructor of the course to write a recommendation.');
  }

  // Check if learner completed course
  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_learnerId: { courseId: data.courseId, learnerId: data.learnerId } },
  });

  if (!enrollment || enrollment.status !== 'COMPLETED') {
    throw new Error('The learner must have completed the course to receive a recommendation.');
  }

  const existingRecommendation = await prisma.learnerRecommendation.findUnique({
    where: {
      instructorId_learnerId_courseId: {
        instructorId,
        learnerId: data.learnerId,
        courseId: data.courseId,
      },
    },
  });

  if (existingRecommendation) {
    throw new Error('You have already recommended this learner for this course.');
  }

  return prisma.learnerRecommendation.create({
    data: {
      instructorId,
      learnerId: data.learnerId,
      courseId: data.courseId,
      message: data.message,
      skillDemonstrated: data.skillDemonstrated ?? null,
      strengths: data.strengths ?? null,
      qualityOfAssignments: data.qualityOfAssignments ?? null,
      participation: data.participation ?? null,
      isPublic: data.isPublic ?? true,
    },
  });
};

export const updateRecommendation = async (instructorId: string, recId: string, data: any) => {
  const rec = await prisma.learnerRecommendation.findUnique({ where: { id: recId } });
  if (!rec) throw new Error('Recommendation not found');
  if (rec.instructorId !== instructorId) throw new Error('Unauthorized');

  return prisma.learnerRecommendation.update({
    where: { id: recId },
    data: {
      ...data,
      isEdited: true,
      editedAt: new Date(),
    },
  });
};

export const deleteRecommendation = async (instructorId: string, recId: string) => {
  const rec = await prisma.learnerRecommendation.findUnique({ where: { id: recId } });
  if (!rec) throw new Error('Recommendation not found');
  if (rec.instructorId !== instructorId) throw new Error('Unauthorized');

  await prisma.learnerRecommendation.delete({ where: { id: recId } });
  return true;
};

export const getLearnerRecommendations = async (learnerId: string) => {
  return prisma.learnerRecommendation.findMany({
    where: { learnerId, isPublic: true },
    include: {
      instructor: {
        select: { name: true, profilePicture: true, verifiedBadge: true, profile: { select: { bio: true } } },
      },
      course: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};
