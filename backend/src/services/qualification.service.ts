import { PrismaClient, QualificationStatus } from '@prisma/client';
import type { Qualification } from '@prisma/client';
import type { CreateQualificationInput, UpdateQualificationInput } from '../types/index.js';

const prisma = new PrismaClient();

export class QualificationService {
  // Create a qualification
  async createQualification(
    userId: string,
    profileId: string,
    data: CreateQualificationInput
  ): Promise<Qualification> {
    return prisma.qualification.create({
      data: {
        userId,
        profileId,
        title: data.title,
        institution: data.institution,
        year: data.year,
        description: data.description ?? null,
        status: QualificationStatus.PENDING_VERIFICATION,  
      },
    });
  }

  // Get all qualifications for a user
  async getQualificationsByUserId(userId: string): Promise<Qualification[]> {
    return prisma.qualification.findMany({
      where: { userId },
      include: {
        documents: true,
      },
      orderBy: { year: 'desc' },
    });
  }

  // Get a single qualification
  async getQualificationById(id: string, userId: string): Promise<Qualification | null> {
    return prisma.qualification.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        documents: true,
      },
    });
  }

  // Update qualification
  async updateQualification(
    id: string,
    userId: string,
    data: UpdateQualificationInput
  ): Promise<Qualification> {
    // Filter out undefined values to handle exactOptionalPropertyTypes
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.institution !== undefined) updateData.institution = data.institution;
    if (data.year !== undefined) updateData.year = data.year;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;

    return prisma.qualification.update({
      where: {
        id,
        userId,
      },
      data: updateData,
    });
  }

  // Delete qualification
  async deleteQualification(id: string, userId: string): Promise<Qualification> {
    return prisma.qualification.delete({
      where: {
        id,
        userId,
      },
    });
  }
}