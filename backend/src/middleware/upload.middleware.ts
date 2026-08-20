import multer from 'multer';
import path from 'path';
import type { Request } from 'express';

// Configure storage (memory storage for Cloudinary upload)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    // Videos
    'video/mp4',
    'video/webm',
    'video/quicktime',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Audio
    'audio/mpeg',
    'audio/wav',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`) as any, false);
  }
};

// Create multer instance
export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter,
});

// Single file upload middleware
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Multiple files upload middleware
export const uploadMultiple = (fieldName: string, maxCount: number) =>
  upload.array(fieldName, maxCount);