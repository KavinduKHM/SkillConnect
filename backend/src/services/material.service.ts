import { PrismaClient } from '@prisma/client';
import type { LearningMaterial } from '@prisma/client';
import cloudinary from '../config/cloudinary.js';
import type { CreateMaterialInput, UpdateMaterialInput } from '../types/index.js';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

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
  let order = typeof data.order === 'string' ? parseInt(data.order, 10) : data.order;

  if (isNaN(order)) {
    order = 1;
  }

  // ✅ Prevent unique constraint check failures by auto-resolving collisions
  const existingMaterialCollision = await prisma.learningMaterial.findFirst({
    where: { lessonId, order },
  });

  if (existingMaterialCollision) {
    const agg = await prisma.learningMaterial.aggregate({
      where: { lessonId },
      _max: { order: true },
    });
    order = (agg._max.order ?? 0) + 1;
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
    const tempDir = path.resolve('uploads/tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, `${Date.now()}-${file.originalname}`);
    fs.writeFileSync(tempFilePath, file.buffer);

    try {
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const isVideo = file.mimetype.startsWith('video/') || ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(fileExtension);
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_large(
          tempFilePath,
          {
            folder: 'skillconnect',
            resource_type: isVideo ? 'video' : 'auto',
            chunk_size: 6 * 1024 * 1024, // 6MB chunks
            timeout: 120000, // 120 seconds timeout
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
      });
      return result;
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (err) {
          console.error('Error cleaning up temp upload file:', err);
        }
      }
    }
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