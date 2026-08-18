import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import profileRoutes from './routes/profile.routes.js';
import qualificationRoutes from './routes/qualification.routes.js';
import courseRoutes from './routes/course.routes.js';
import learnerRoutes from './routes/learner.routes.js';
import assessmentRoutes from './routes/assessment.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import certificateRoutes from './routes/certificate.routes.js';
import recognitionRoutes from './routes/recognition.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8081',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static uploads directory (for local file storage)
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SkillConnect API is running',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/qualification', qualificationRoutes);
app.use('/api/course', courseRoutes);
app.use('/api/learner', learnerRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/recognition', recognitionRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`👑 Admin: http://localhost:${PORT}/api/admin`);
  console.log(`📚 SKIL-1 Routes: /api/profiles, /api/qualifications, /api/courses`);
  console.log(`📚 Learner: http://localhost:${PORT}/api/learner`);
});

export default app;