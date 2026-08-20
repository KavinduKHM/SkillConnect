import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { logger } from '../utils/logger.js';

export interface UploadResult {
  url: string;
  publicId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storage: 'cloudinary' | 'local';
}

const LOCAL_UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

/**
 * Uploads a single file buffer to Cloudinary or falls back to local disk storage
 */
export const uploadFile = async (
  file: Express.Multer.File,
  folder: string = 'assignments'
): Promise<UploadResult> => {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  const fileExt = path.extname(file.originalname).toLowerCase();
  const baseName = path.basename(file.originalname, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const uniqueFileName = `${baseName}_${uniqueSuffix}${fileExt}`;

  // 1. If Cloudinary is configured, stream buffer to Cloudinary
  if (isCloudinaryConfigured()) {
    try {
      const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `skillconnect/${folder}`,
            public_id: `${baseName}_${uniqueSuffix}`,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error || !result) {
              logger.error('Cloudinary upload stream error:', error);
              return reject(new Error(error?.message || 'Cloudinary upload failed'));
            }

            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              fileName: file.originalname,
              fileType: file.mimetype,
              fileSize: file.size,
              storage: 'cloudinary',
            });
          }
        );

        uploadStream.end(file.buffer);
      });

      return await uploadPromise;
    } catch (err: any) {
      logger.warn('Cloudinary upload failed, attempting fallback to local storage:', err.message);
    }
  }

  // 2. Fallback: Save file to local disk
  try {
    const targetFolder = path.join(LOCAL_UPLOADS_DIR, folder);
    await fs.promises.mkdir(targetFolder, { recursive: true });

    const filePath = path.join(targetFolder, uniqueFileName);
    await fs.promises.writeFile(filePath, file.buffer);

    const relativeUrl = `/uploads/${folder}/${uniqueFileName}`;

    logger.info(`File saved locally at ${filePath}`);

    return {
      url: relativeUrl,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      storage: 'local',
    };
  } catch (err: any) {
    logger.error('Local file storage error:', err);
    throw new Error(`Failed to save file locally: ${err.message}`);
  }
};

/**
 * Uploads multiple files sequentially
 */
export const uploadMultipleFiles = async (
  files: Express.Multer.File[],
  folder: string = 'assignments'
): Promise<UploadResult[]> => {
  if (!files || files.length === 0) {
    return [];
  }

  const results: UploadResult[] = [];
  for (const file of files) {
    const result = await uploadFile(file, folder);
    results.push(result);
  }

  return results;
};

/**
 * Deletes a file from either Cloudinary or local storage
 */
export const deleteUploadedFile = async (
  identifier: string,
  storage: 'cloudinary' | 'local' = 'local'
): Promise<void> => {
  try {
    if (storage === 'cloudinary' && isCloudinaryConfigured()) {
      await cloudinary.uploader.destroy(identifier);
      logger.info(`Deleted file from Cloudinary: ${identifier}`);
    } else if (storage === 'local' || identifier.startsWith('/uploads/')) {
      const cleanPath = identifier.startsWith('/') ? identifier.slice(1) : identifier;
      const fullPath = path.resolve(process.cwd(), cleanPath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        logger.info(`Deleted local file: ${fullPath}`);
      }
    }
  } catch (err: any) {
    logger.error(`Error deleting file (${identifier}):`, err);
  }
};
