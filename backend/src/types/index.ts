// ============================================================
// SKIL-1: Skill Sharer & Course Management Types
// ============================================================

// Profile Types
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
export interface CreateQualificationInput {
  title: string;
  institution: string;
  year: number;
  description?: string;
}

export interface UpdateQualificationInput extends Partial<CreateQualificationInput> {
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

// Course Types
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

export interface UpdateCourseInput extends Partial<CreateCourseInput> {
  status?: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'SUSPENDED' | 'ARCHIVED';
}

// Module Types
export interface CreateModuleInput {
  title: string;
  description?: string;
  order: number;
}

export interface UpdateModuleInput extends Partial<CreateModuleInput> {}

// Lesson Types
export interface CreateLessonInput {
  title: string;
  description?: string;
  content?: string;
  order: number;
  isRequired?: boolean;
  estimatedMinutes?: number;
}

export interface UpdateLessonInput extends Partial<CreateLessonInput> {}

// Learning Material Types
export interface CreateMaterialInput {
  title: string;
  type: 'VIDEO' | 'PDF' | 'SLIDE' | 'EXTERNAL' | 'IMAGE';
  fileUrl?: string;
  externalUrl?: string;
  description?: string;
  order: number;
  fileSize?: number;
  duration?: number;
}

export interface UpdateMaterialInput extends Partial<CreateMaterialInput> {}

// ============================================================
// API Response Types
// ============================================================

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