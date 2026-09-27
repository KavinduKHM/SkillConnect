import { PrismaClient } from '@prisma/client';
import type { LearningMaterial } from '@prisma/client';
import type { CreateMaterialInput, UpdateMaterialInput } from '../types/index.js';
import { uploadFile } from './upload.service.js';

const prisma = new PrismaClient();

interface UploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

interface CreateMaterialWithFile extends Omit<CreateMaterialInput, 'fileUrl'> {
  file?: UploadFile;
  externalUrl?: string;
}

export class MaterialService {
  // Create material
  // backend/src/services/material.service.ts

async createMaterial(
  userId: string,
  lessonId: string,
  data: CreateMaterialWithFile
): Promise<LearningMaterial> {
  // ... verification code ...

  let fileUrl: string | undefined;
  let fileSize: number | undefined;

  if (data.file) {
    const result = await uploadFile(data.file as Express.Multer.File, 'materials');
    fileUrl = result.url;
    fileSize = result.fileSize;
  } else if (data.externalUrl) {
    fileUrl = data.externalUrl;
  }

  const requestedOrder = typeof data.order === 'string' ? parseInt(data.order, 10) : data.order;
  const lastMaterial = await prisma.learningMaterial.findFirst({
    where: { lessonId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });
  const order = lastMaterial
    ? lastMaterial.order + 1
    : Number.isFinite(requestedOrder) && requestedOrder > 0
      ? requestedOrder
      : 1;

  return prisma.learningMaterial.create({
    data: {
      lessonId,
      title: data.title,
      type: data.type,
      fileUrl: fileUrl ?? null,
      description: data.description ?? null,
      order,  
      fileSize: fileSize ?? null,
      duration: data.duration ?? null,
    },
  });
}

  // Get all materials for a lesson
  async getMaterialsByLessonId(lessonId: string, userId: string): Promise<LearningMaterial[]> {
    return prisma.learningMaterial.findMany({
      where: {
        lessonId,
        lesson: {
          module: {
            course: {
              creatorId: userId,
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  // Get single material
  async getMaterialById(id: string, userId: string): Promise<LearningMaterial | null> {
    return prisma.learningMaterial.findFirst({
      where: {
        id,
        lesson: {
          module: {
            course: {
              creatorId: userId,
            },
          },
        },
      },
    });
  }

  // Update material
  async updateMaterial(id: string, userId: string, data: UpdateMaterialInput): Promise<LearningMaterial> {
    const updateData: {
      title?: string;
      description?: string | null;
      order?: number;
      duration?: number | null;
    } = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.duration !== undefined) updateData.duration = data.duration;

    return prisma.learningMaterial.update({
      where: {
        id,
        lesson: {
          module: {
            course: {
              creatorId: userId,
            },
          },
        },
      },
      data: updateData,
    });
  }

  // Delete material
  async deleteMaterial(id: string, userId: string): Promise<LearningMaterial> {
    const material = await prisma.learningMaterial.findFirst({
      where: {
        id,
        lesson: {
          module: {
            course: {
              creatorId: userId,
            },
          },
        },
      },
    });

    if (!material) {
      throw new Error('Material not found or you do not own its course');
    }

    return prisma.learningMaterial.delete({
      where: { id },
    });
  }
}