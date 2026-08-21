import api from './client';

// ============================================================
// PROFILE APIs
// ============================================================

export const profileService = {
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

  getMyProfile: () => api.get('/profiles/me'),

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

  getPublicProfile: (userId: string) => api.get(`/profiles/public/${userId}`),
};

// ============================================================
// QUALIFICATION APIs
// ============================================================

export const qualificationService = {
  createQualification: (data: {
    profileId: string;
    title: string;
    institution: string;
    year: number;
    description?: string;
  }) => api.post('/qualifications', data),

  getQualifications: () => api.get('/qualifications'),

  getQualification: (id: string) => api.get(`/qualifications/${id}`),

  updateQualification: (id: string, data: {
    title?: string;
    institution?: string;
    year?: number;
    description?: string;
  }) => api.put(`/qualifications/${id}`, data),

  deleteQualification: (id: string) => api.delete(`/qualifications/${id}`),
};

// ============================================================
// COURSE APIs
// ============================================================

export const courseService = {
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

  getMyCourses: () => {
    console.log('📤 Fetching courses...');
    return api.get('/courses');
  },

  getCourse: (id: string) => {
    console.log(`📤 Fetching course: ${id}`);
    return api.get(`/courses/${id}`);
  },

  updateCourse: (id: string, data: any) => {
    console.log(`📤 Updating course ${id}:`, data);
    return api.put(`/courses/${id}`, data);
  },

  submitCourse: (id: string) => {
    console.log(`📤 Submitting course: ${id}`);
    return api.post(`/courses/${id}/submit`);
  },

  deleteCourse: (id: string) => {
    console.log(`🗑️ Deleting course: ${id}`);
    return api.delete(`/courses/${id}`);
  },
};

// ============================================================
// MODULE APIs
// ============================================================

export const moduleService = {
  createModule: (data: {
  courseId: string;
  title: string;
  description?: string;
  order: number;
}) => {
  // ✅ Log the data being sent
  console.log('📤 createModule called with:', JSON.stringify(data, null, 2));
  
  // ✅ Ensure order is a number and not undefined/null
  if (
    data.order === undefined ||
    data.order === null ||
    typeof data.order !== 'number' ||
    !Number.isFinite(data.order) ||
    !Number.isInteger(data.order) ||
    data.order < 1
  ) {
    console.error('❌ Order is invalid:', data.order);
    return Promise.reject(new Error('Order must be a valid number'));
  }
  
  return api.post('/modules', data);
},
  getModules: (courseId: string) => {
    console.log(`📤 getModules called for course: ${courseId}`);
    return api.get(`/modules/course/${courseId}`);
  },

  getModule: (id: string) => {
    console.log(`📤 getModule called for: ${id}`);
    return api.get(`/modules/${id}`);
  },

  updateModule: (id: string, data: {
    title?: string;
    description?: string;
    order?: number;
  }) => {
    console.log(`📤 updateModule called for: ${id}`, data);
    return api.put(`/modules/${id}`, data);
  },

  deleteModule: (id: string) => {
    console.log(`🗑️ deleteModule called for: ${id}`);
    return api.delete(`/modules/${id}`);
  },

  reorderModules: (courseId: string, moduleIds: string[]) => {
    console.log(`📤 reorderModules called for course: ${courseId}`, moduleIds);
    return api.put(`/modules/${courseId}/reorder`, { moduleIds });
  },
};

// ============================================================
// LESSON APIs
// ============================================================

export const lessonService = {
  createLesson: (data: {
    moduleId: string;
    title: string;
    description?: string;
    content?: string;
    order: number;
    isRequired?: boolean;
    estimatedMinutes?: number;
  }) => api.post('/lessons', data),

  getLessons: (moduleId: string) => api.get(`/lessons/module/${moduleId}`),

  getLesson: (id: string) => api.get(`/lessons/${id}`),

  updateLesson: (id: string, data: {
    title?: string;
    description?: string;
    content?: string;
    order?: number;
    isRequired?: boolean;
    estimatedMinutes?: number;
  }) => api.put(`/lessons/${id}`, data),

  deleteLesson: (id: string) => api.delete(`/lessons/${id}`),

  reorderLessons: (moduleId: string, lessonIds: string[]) =>
    api.put(`/lessons/${moduleId}/reorder`, { lessonIds }),
};

// ============================================================
// MATERIAL APIs
// ============================================================

export const materialService = {
  uploadMaterial: (formData: FormData) => api.post('/materials', formData),

  getMaterials: (lessonId: string) => api.get(`/materials/lesson/${lessonId}`),

  getMaterial: (id: string) => api.get(`/materials/${id}`),

  updateMaterial: (id: string, data: {
    title?: string;
    description?: string;
    order?: number;
    duration?: number;
  }) => api.put(`/materials/${id}`, data),

  deleteMaterial: (id: string) => api.delete(`/materials/${id}`),
};

// ============================================================
// PROGRESS APIs (Skill Sharer View)
// ============================================================

export const progressService = {
  getLearnersProgress: (courseId: string) =>
    api.get(`/progress/course/${courseId}/learners`),

  getLearnerProgress: (courseId: string, learnerId: string) =>
    api.get(`/progress/course/${courseId}/learner/${learnerId}`),

  getCourseAnalytics: (courseId: string) =>
    api.get(`/progress/course/${courseId}/analytics`),
};

// ============================================================
// RECOMMENDATION APIs
// ============================================================

export const recommendationService = {
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

  getMyRecommendations: () => api.get('/recommendations/me'),

  getLearnerRecommendations: (learnerId: string) =>
    api.get(`/recommendations/learner/${learnerId}`),

  updateRecommendation: (id: string, data: {
    message?: string;
    skillDemonstrated?: string;
    strengths?: string;
    qualityOfAssignments?: string;
    participation?: string;
    isPublic?: boolean;
  }) => api.put(`/recommendations/${id}`, data),

  deleteRecommendation: (id: string) => api.delete(`/recommendations/${id}`),
};

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