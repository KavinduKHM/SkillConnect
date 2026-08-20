import api from './client';

// ============================================================
// PROFILE APIs
// ============================================================

export const profileService = {
  // Create profile
  createProfile: (data: {
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
  }) => api.post('/profiles', data),

  // Get my profile
  getMyProfile: () => api.get('/profiles/me'),

  // Update profile
  updateProfile: (data: {
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
  }) => api.put('/profiles/me', data),

  // Get public profile
  getPublicProfile: (userId: string) => api.get(`/profiles/public/${userId}`),
};

// ============================================================
// QUALIFICATION APIs
// ============================================================

export const qualificationService = {
  // Create qualification
  createQualification: (data: {
    profileId: string;
    title: string;
    institution: string;
    year: number;
    description?: string;
  }) => api.post('/qualifications', data),

  // Get all qualifications
  getQualifications: () => api.get('/qualifications'),

  // Get single qualification
  getQualification: (id: string) => api.get(`/qualifications/${id}`),

  // Update qualification
  updateQualification: (id: string, data: {
    title?: string;
    institution?: string;
    year?: number;
    description?: string;
  }) => api.put(`/qualifications/${id}`, data),

  // Delete qualification
  deleteQualification: (id: string) => api.delete(`/qualifications/${id}`),
};

// ============================================================
// COURSE APIs
// ============================================================

export const courseService = {
  // Create course draft
  createCourse: (data: {
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
  }) => api.post('/courses', data),

  // Get all my courses
  getMyCourses: () => api.get('/courses'),

  // Get single course
  getCourse: (id: string) => api.get(`/courses/${id}`),

  // Update course
  updateCourse: (id: string, data: {
    title?: string;
    description?: string;
    categoryId?: string;
    difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    duration?: string;
    estimatedHours?: number;
    language?: string;
    deliveryMethod?: 'SELF_PACED' | 'SCHEDULED' | 'HYBRID';
    prerequisites?: string;
    learningOutcomes?: string[];
    thumbnail?: string;
    status?: 'DRAFT' | 'SUBMITTED';
  }) => api.put(`/courses/${id}`, data),

  // Submit course for approval
  submitCourse: (id: string) => api.post(`/courses/${id}/submit`),

  // Delete course (draft only)
  deleteCourse: (id: string) => api.delete(`/courses/${id}`),
};

// ============================================================
// MODULE APIs
// ============================================================

export const moduleService = {
  // Create module
  createModule: (data: {
    courseId: string;
    title: string;
    description?: string;
    order: number;
  }) => api.post('/modules', data),

  // Get modules for a course
  getModules: (courseId: string) => api.get(`/modules/course/${courseId}`),

  // Get single module
  getModule: (id: string) => api.get(`/modules/${id}`),

  // Update module
  updateModule: (id: string, data: {
    title?: string;
    description?: string;
    order?: number;
  }) => api.put(`/modules/${id}`, data),

  // Delete module
  deleteModule: (id: string) => api.delete(`/modules/${id}`),

  // Reorder modules
  reorderModules: (courseId: string, moduleIds: string[]) =>
    api.put(`/modules/${courseId}/reorder`, { moduleIds }),
};

// ============================================================
// LESSON APIs
// ============================================================

export const lessonService = {
  // Create lesson
  createLesson: (data: {
    moduleId: string;
    title: string;
    description?: string;
    content?: string;
    order: number;
    isRequired?: boolean;
    estimatedMinutes?: number;
  }) => api.post('/lessons', data),

  // Get lessons for a module
  getLessons: (moduleId: string) => api.get(`/lessons/module/${moduleId}`),

  // Get single lesson
  getLesson: (id: string) => api.get(`/lessons/${id}`),

  // Update lesson
  updateLesson: (id: string, data: {
    title?: string;
    description?: string;
    content?: string;
    order?: number;
    isRequired?: boolean;
    estimatedMinutes?: number;
  }) => api.put(`/lessons/${id}`, data),

  // Delete lesson
  deleteLesson: (id: string) => api.delete(`/lessons/${id}`),

  // Reorder lessons
  reorderLessons: (moduleId: string, lessonIds: string[]) =>
    api.put(`/lessons/${moduleId}/reorder`, { lessonIds }),
};

// ============================================================
// MATERIAL APIs
// ============================================================

export const materialService = {
  // Upload material (file or external link)
  uploadMaterial: (formData: FormData) =>
    api.post('/materials', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Get materials for a lesson
  getMaterials: (lessonId: string) => api.get(`/materials/lesson/${lessonId}`),

  // Get single material
  getMaterial: (id: string) => api.get(`/materials/${id}`),

  // Update material
  updateMaterial: (id: string, data: {
    title?: string;
    description?: string;
    order?: number;
    duration?: number;
  }) => api.put(`/materials/${id}`, data),

  // Delete material
  deleteMaterial: (id: string) => api.delete(`/materials/${id}`),
};

// ============================================================
// PROGRESS APIs (Skill Sharer View)
// ============================================================

export const progressService = {
  // Get all learners' progress for a course
  getLearnersProgress: (courseId: string) =>
    api.get(`/progress/course/${courseId}/learners`),

  // Get specific learner's progress
  getLearnerProgress: (courseId: string, learnerId: string) =>
    api.get(`/progress/course/${courseId}/learner/${learnerId}`),

  // Get course analytics
  getCourseAnalytics: (courseId: string) =>
    api.get(`/progress/course/${courseId}/analytics`),
};

// ============================================================
// RECOMMENDATION APIs
// ============================================================

export const recommendationService = {
  // Create recommendation
  createRecommendation: (data: {
    learnerId: string;
    courseId: string;
    skillDemonstrated?: string;
    strengths?: string;
    qualityOfAssignments?: string;
    participation?: string;
    message: string;
    isPublic?: boolean;
  }) => api.post('/recommendations', data),

  // Get my recommendations
  getMyRecommendations: () => api.get('/recommendations/me'),

  // Get recommendations for a learner
  getLearnerRecommendations: (learnerId: string) =>
    api.get(`/recommendations/learner/${learnerId}`),

  // Update recommendation
  updateRecommendation: (id: string, data: {
    message?: string;
    skillDemonstrated?: string;
    strengths?: string;
    qualityOfAssignments?: string;
    participation?: string;
    isPublic?: boolean;
  }) => api.put(`/recommendations/${id}`, data),

  // Delete recommendation
  deleteRecommendation: (id: string) => api.delete(`/recommendations/${id}`),
};

// ✅ Default export for convenience
export default {
  profileService,
  qualificationService,
  courseService,
  moduleService,
  lessonService,
  materialService,
  progressService,
  recommendationService,
};