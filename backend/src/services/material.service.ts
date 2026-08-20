import { PrismaClient } from '@prisma/client';
import type { LearningMaterial } from '@prisma/client';
import cloudinary from '../config/cloudinary.js';
import type { CreateMaterialInput, UpdateMaterialInput } from '../types/index.js';
import streamifier from 'streamifier';

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
    const result = await this.uploadToCloudinary(data.file);
    fileUrl = result.secure_url;
    fileSize = data.file.size;
  } else if (data.externalUrl) {
    fileUrl = data.externalUrl;
  }

  // ✅ Ensure order is a number
  const order = typeof data.order === 'string' ? parseInt(data.order, 10) : data.order;

  if (isNaN(order)) {
    throw new Error('Order must be a valid number');
  }

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

  // Upload to Cloudinary
  private async uploadToCloudinary(file: UploadFile): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'skillconnect',
          resource_type: 'auto',
          allowed_formats: ['mp4', 'webm', 'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'ppt', 'pptx', 'doc', 'docx'],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
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
    return prisma.learningMaterial.delete({
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
}