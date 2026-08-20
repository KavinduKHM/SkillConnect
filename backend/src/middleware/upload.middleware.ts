import multer from 'multer';
import path from 'path';
import type { Request, Response, NextFunction } from 'express';

type FileFilterCallback = (error: Error | null, acceptFile?: boolean) => void;

// Allowed file extensions for assignment submissions and feedback
export const ALLOWED_EXTENSIONS = [
  // Documents
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.rtf',
  '.odt',
  // Spreadsheets / Data
  '.csv',
  '.xlsx',
  '.xls',
  '.json',
  // Code / Development
  '.zip',
  '.rar',
  '.7z',
  '.tar',
  '.gz',
  '.py',
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.html',
  '.css',
  '.java',
  '.c',
  '.cpp',
  '.sql',
  // Images
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  // Videos & Audio
  '.mp4',
  '.webm',
  '.mov',
  '.mp3',
  '.wav',
];

// Maximum allowed file size: 10MB (10,485,760 bytes)
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

// Memory storage keeps file in memory buffer for streaming to Cloudinary or writing to disk
const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type '${ext}' is not allowed. Allowed types: PDF, DOC, DOCX, ZIP, Code files, Images, CSV, JSON.`
      )
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: DEFAULT_MAX_FILE_SIZE,
  },
  fileFilter,
});

// Single file upload middleware
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Multiple files upload middleware
export const uploadMultiple = (fieldName: string, maxCount: number) =>
  upload.array(fieldName, maxCount);

/**
 * Middleware for assignment submission files (up to 5 files under 'files' field)
 */
export const uploadAssignmentFiles = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const handler = upload.array('files', 5);

  handler(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({
            error: `File size exceeds the 10MB limit`,
          });
          return;
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          res.status(400).json({
            error: `Too many files uploaded. Maximum is 5 files.`,
          });
          return;
        }
        res.status(400).json({ error: `Upload error: ${err.message}` });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }
    next();
  });
};

/**
 * Middleware for single file upload (configurable field name)
 */
export const uploadSingleFile = (fieldName: string = 'file') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const handler = upload.single(fieldName);

    handler(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
              error: `File size exceeds the 10MB limit`,
            });
            return;
          }
          res.status(400).json({ error: `Upload error: ${err.message}` });
          return;
        }
        res.status(400).json({ error: err.message });
        return;
      }
      next();
    });
  };
};

/**
 * Middleware for instructor feedback attachment files (up to 3 files under 'attachments' field)
 */
export const uploadFeedbackFiles = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const handler = upload.array('attachments', 3);

  handler(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({
            error: `Attachment size exceeds the 10MB limit`,
          });
          return;
        }
        res.status(400).json({ error: `Upload error: ${err.message}` });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }
    next();
  });
};
