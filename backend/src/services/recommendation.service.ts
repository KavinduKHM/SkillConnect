import type { LearnerRecommendation } from '@prisma/client';
import prisma from '../config/database.js';

interface CreateRecommendationInput {
  skillDemonstrated?: string;
  title?: string;
  strengths?: string;
  qualityOfAssignments?: string;
  participation?: string;
  message?: string;
  content?: string;
  isPublic?: boolean;
}

interface UpdateRecommendationInput extends Partial<CreateRecommendationInput> {}

export class RecommendationService {
  // Get all completed learners for a specific course
  async getCompletedLearnersForCourse(instructorId: string, courseId: string) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, creatorId: instructorId },
    });

    if (!course) {
      throw new Error('Course not found or you do not own it');
    }

    // 1. Get from enrollments (COMPLETED or 100% progress or ACTIVE enrollments with 100% progress)
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId,
        OR: [
          { status: 'COMPLETED' },
          { progressPercentage: { gte: 100 } },
          { status: 'ACTIVE' },
        ],
      },
      include: {
        learner: { select: { id: true, name: true, email: true, profilePicture: true } },
      },
    });

    // 2. Get from certificates
    const certificates = await prisma.certificate.findMany({
      where: { courseId },
      include: {
        learner: { select: { id: true, name: true, email: true, profilePicture: true } },
      },
    });

    // 3. Get from approved completion requests
    const approvedRequests = await prisma.completionRequest.findMany({
      where: { courseId, status: 'APPROVED' },
      include: {
        learner: { select: { id: true, name: true, email: true, profilePicture: true } },
      },
    });

    const learnerMap = new Map<string, any>();

    for (const en of enrollments) {
      if (en.learner) {
        learnerMap.set(en.learnerId, {
          id: en.id,
          learnerId: en.learnerId,
          learner: en.learner,
          completedAt: en.completedAt || en.updatedAt,
          progressPercentage: en.progressPercentage || (en.status === 'COMPLETED' ? 100 : 0),
          status: en.status,
        });
      }
    }

    for (const cert of certificates) {
      if (cert.learner && !learnerMap.has(cert.learnerId)) {
        learnerMap.set(cert.learnerId, {
          id: cert.id,
          learnerId: cert.learnerId,
          learner: cert.learner,
          completedAt: cert.issueDate,
          progressPercentage: 100,
          status: 'COMPLETED',
        });
      }
    }

    for (const req of approvedRequests) {
      if (req.learner && !learnerMap.has(req.learnerId)) {
        learnerMap.set(req.learnerId, {
          id: req.id,
          learnerId: req.learnerId,
          learner: req.learner,
          completedAt: req.reviewedAt || req.updatedAt,
          progressPercentage: 100,
          status: 'COMPLETED',
        });
      }
    }

    return Array.from(learnerMap.values());
  }

  // Create recommendation
  async createRecommendation(
    instructorId: string,
    learnerId: string,
    courseId: string,
    data: CreateRecommendationInput
  ): Promise<LearnerRecommendation> {
    // Verify instructor owns the course
    const course = await prisma.course.findFirst({
      where: { id: courseId, creatorId: instructorId },
    });

    if (!course) {
      throw new Error('Course not found or you do not own it');
    }

    // Verify learner is enrolled or has completed
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId,
        learnerId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
    });

    const certificate = await prisma.certificate.findFirst({
      where: { courseId, learnerId },
    });

    if (!enrollment && !certificate) {
      throw new Error('Learner is not enrolled in this course');
    }

    const messageText = data.message || data.content || (data.title ? `${data.title}` : 'Recommended learner');
    const skillDemonstratedText = data.skillDemonstrated || data.title || null;

    return prisma.learnerRecommendation.upsert({
      where: {
        instructorId_learnerId_courseId: {
          instructorId,
          learnerId,
          courseId,
        },
      },
      update: {
        skillDemonstrated: skillDemonstratedText,
        strengths: data.strengths ?? null,
        qualityOfAssignments: data.qualityOfAssignments ?? null,
        participation: data.participation ?? null,
        message: messageText,
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
        isEdited: true,
        editedAt: new Date(),
      },
      create: {
        instructorId,
        learnerId,
        courseId,
        skillDemonstrated: skillDemonstratedText,
        strengths: data.strengths ?? null,
        qualityOfAssignments: data.qualityOfAssignments ?? null,
        participation: data.participation ?? null,
        message: messageText,
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
      },
    });
  }

  // Get all recommendations for a learner
  async getRecommendationsForLearner(learnerId: string, onlyPublic: boolean = false): Promise<any[]> {
    const whereCondition: any = { learnerId };
    if (onlyPublic) {
      whereCondition.isPublic = true;
    }

    const recs = await prisma.learnerRecommendation.findMany({
      where: whereCondition,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            verifiedBadge: true,
            profile: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return recs.map((r: any) => ({
      ...r,
      title: r.skillDemonstrated || 'Recommendation',
      content: r.message,
    }));
  }

  // Update recommendation
  async updateRecommendation(
    id: string,
    instructorId: string,
    data: UpdateRecommendationInput
  ): Promise<LearnerRecommendation> {
    const messageText = data.message || data.content;
    const skillText = data.skillDemonstrated || data.title;

    return prisma.learnerRecommendation.update({
      where: {
        id,
        instructorId,
      },
      data: {
        ...(skillText !== undefined && { skillDemonstrated: skillText }),
        ...(data.strengths !== undefined && { strengths: data.strengths }),
        ...(data.qualityOfAssignments !== undefined && {
          qualityOfAssignments: data.qualityOfAssignments,
        }),
        ...(data.participation !== undefined && { participation: data.participation }),
        ...(messageText !== undefined && { message: messageText }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        isEdited: true,
        editedAt: new Date(),
      },
    });
  }

  // Delete recommendation
  async deleteRecommendation(id: string, instructorId: string): Promise<LearnerRecommendation> {
    return prisma.learnerRecommendation.delete({
      where: {
        id,
        instructorId,
      },
    });
  }
}
