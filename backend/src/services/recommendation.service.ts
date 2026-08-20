import { PrismaClient } from '@prisma/client';
import type { LearnerRecommendation } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateRecommendationInput {
  skillDemonstrated?: string;
  strengths?: string;
  qualityOfAssignments?: string;
  participation?: string;
  message: string;
  isPublic?: boolean;
}

interface UpdateRecommendationInput extends Partial<CreateRecommendationInput> {}

export class RecommendationService {
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

    // Verify learner is enrolled
    const enrollment = await prisma.enrollment.findFirst({
      where: { courseId, learnerId, status: 'ACTIVE' },
    });

    if (!enrollment) {
      throw new Error('Learner is not enrolled in this course');
    }

    return prisma.learnerRecommendation.create({
      data: {
        instructorId,
        learnerId,
        courseId,
        skillDemonstrated: data.skillDemonstrated ?? null,
        strengths: data.strengths ?? null,
        qualityOfAssignments: data.qualityOfAssignments ?? null,
        participation: data.participation ?? null,
        message: data.message,
        isPublic: data.isPublic ?? true,
      },
    });
  }

  // Get all recommendations for a learner
  async getRecommendationsForLearner(learnerId: string): Promise<LearnerRecommendation[]> {
    return prisma.learnerRecommendation.findMany({
      where: { learnerId, isPublic: true },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            verifiedBadge: true,
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
  }

  // Update recommendation
  async updateRecommendation(
    id: string,
    instructorId: string,
    data: UpdateRecommendationInput
  ): Promise<LearnerRecommendation> {
    return prisma.learnerRecommendation.update({
      where: {
        id,
        instructorId,
      },
      data: {
        ...(data.skillDemonstrated !== undefined && {
          skillDemonstrated: data.skillDemonstrated,
        }),
        ...(data.strengths !== undefined && { strengths: data.strengths }),
        ...(data.qualityOfAssignments !== undefined && {
          qualityOfAssignments: data.qualityOfAssignments,
        }),
        ...(data.participation !== undefined && { participation: data.participation }),
        ...(data.message !== undefined && { message: data.message }),
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