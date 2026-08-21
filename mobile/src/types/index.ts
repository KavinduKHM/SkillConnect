// ============================================================
// SKIL-1: Skill Sharer & Course Management Types
// ============================================================

// Profile Types
export interface Profile {
  id: string;
  userId: string;
  bio?: string;
  skills: string[];
  experience?: string;
  portfolio: string[];
  location?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
  qualifications?: Qualification[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfileInput {
  bio?: string;
  skills?: string[];
  experience?: string;
  portfolio?: string[];
  location?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
}

export interface UpdateProfileInput extends Partial<CreateProfileInput> {}

// Qualification Types
export interface Qualification {
  id: string;
  userId: string;
  profileId: string;
  title: string;
  institution: string;
  year: number;
  description?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  documents?: QualificationDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateQualificationInput {
  title: string;
  institution: string;
  year: number;
  description?: string;
}

export interface UpdateQualificationInput extends Partial<CreateQualificationInput> {}

export interface QualificationDocument {
  id: string;
  qualificationId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

// Course Types
export interface Course {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  category?: Category;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration?: string;
  estimatedHours?: number;
  language?: string;
  deliveryMethod: 'SELF_PACED' | 'SCHEDULED' | 'HYBRID';
  prerequisites?: string;
  learningOutcomes: string[];
  thumbnail?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'SUSPENDED' | 'ARCHIVED';
  creatorId: string;
  enrolledCount: number;
  rating: number;
  reviewCount: number;
  modules?: CourseModule[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseInput {
  title: string;
  description: string;
  categoryId: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration?: string;
  estimatedHours?: number;
  language?: string;
  deliveryMethod?: 'SELF_PACED' | 'SCHEDULED' | 'HYBRID';
  prerequisites?: string;
  learningOutcomes?: string[];
  thumbnail?: string;
}

export interface UpdateCourseInput extends Partial<CreateCourseInput> {}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  lessons?: CourseLesson[];
}

export interface CourseLesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  content?: string;
  order: number;
  isRequired: boolean;
  estimatedMinutes?: number;
  materials?: LearningMaterial[];
}

export interface LearningMaterial {
  id: string;
  lessonId: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'SLIDE' | 'EXTERNAL' | 'IMAGE';
  fileUrl?: string;
  externalUrl?: string;
  description?: string;
  order: number;
  fileSize?: number;
  duration?: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  courseCount: number;
}

// Assignment Types
export interface Assignment {
  id: string;
  courseId: string;
  instructorId: string;
  title: string;
  instructions?: string;
  deadline: string;
  maxMarks: number;
  maxSubmissions: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  submissionMethods: string[];
  requireForCompletion: boolean;
  acceptLate: boolean;
  latePenalty?: number;
  lateWindow?: number;
  status: string;
  submissionCount: number;
  averageScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  learnerId: string;
  learner?: { id: string; name: string; email: string; profilePicture?: string };
  fileUrls: string[];
  githubLink?: string;
  textSubmission?: string;
  submissionDate: string;
  grade?: number;
  feedback?: string;
  feedbackAttachments: string[];
  status: string;
  versionNumber: number;
  isLate: boolean;
  latePenaltyApplied?: number;
  gradedAt?: string;
  gradedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}