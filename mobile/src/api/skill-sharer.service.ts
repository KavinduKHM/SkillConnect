import api from './client';
const apiClient = api;

import {
  Profile,
  CreateProfileInput,
  UpdateProfileInput,
  Qualification,
  CreateQualificationInput,
  UpdateQualificationInput,
  Course,
  CreateCourseInput,
  UpdateCourseInput,
  ApiResponse,
} from '../types';

// ============================================================
// PROFILE APIs (Service version)
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
// QUALIFICATION APIs (Service version)
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
// COURSE APIs (Service version)
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
// MODULE APIs (Service version)
// ============================================================

export const moduleService = {
  createModule: (data: {
    courseId: string;
    title: string;
    description?: string;
    order: number;
  }) => {
    console.log('📤 createModule called with:', JSON.stringify(data, null, 2));
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
// LESSON APIs (Service version)
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
// MATERIAL APIs (Service version)
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
// PROGRESS APIs (Service version)
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
// RECOMMENDATION APIs (Service version)
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

// ============================================================
// Profile APIs (Api version)
// ============================================================

export const profileApi = {
  createProfile: (data: CreateProfileInput): Promise<ApiResponse<Profile>> => {
    return apiClient.post('/profiles', data);
  },

  getMyProfile: (): Promise<ApiResponse<Profile>> => {
    return apiClient.get('/profiles/me');
  },

  updateProfile: (data: UpdateProfileInput): Promise<ApiResponse<Profile>> => {
    return apiClient.put('/profiles/me', data);
  },

  getPublicProfile: (userId: string): Promise<ApiResponse<Profile>> => {
    return apiClient.get(`/profiles/public/${userId}`);
  },
};

// ============================================================
// Qualification APIs (Api version)
// ============================================================

export const qualificationApi = {
  createQualification: (
    profileId: string,
    data: CreateQualificationInput
  ): Promise<ApiResponse<Qualification>> => {
    return apiClient.post('/qualifications', { ...data, profileId });
  },

  getQualifications: (): Promise<ApiResponse<Qualification[]>> => {
    return apiClient.get('/qualifications');
  },

  getQualification: (id: string): Promise<ApiResponse<Qualification>> => {
    return apiClient.get(`/qualifications/${id}`);
  },

  updateQualification: (
    id: string,
    data: UpdateQualificationInput
  ): Promise<ApiResponse<Qualification>> => {
    return apiClient.put(`/qualifications/${id}`, data);
  },

  deleteQualification: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/qualifications/${id}`);
  },
};

// ============================================================
// Course APIs (Api version)
// ============================================================

export const courseApi = {
  createCourse: (data: CreateCourseInput): Promise<ApiResponse<Course>> => {
    return apiClient.post('/courses', data);
  },

  getMyCourses: (): Promise<ApiResponse<Course[]>> => {
    return apiClient.get('/courses');
  },

  getCourse: (id: string): Promise<ApiResponse<Course>> => {
    return apiClient.get(`/courses/${id}`);
  },

  updateCourse: (
    id: string,
    data: UpdateCourseInput
  ): Promise<ApiResponse<Course>> => {
    return apiClient.put(`/courses/${id}`, data);
  },

  submitCourse: (id: string): Promise<ApiResponse<Course>> => {
    return apiClient.post(`/courses/${id}/submit`);
  },

  deleteCourse: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/courses/${id}`);
  },
};

// ============================================================
// Quiz / Assessment APIs (Api version)
// ============================================================

export const quizApi = {
  createQuizLink: (data: any): Promise<ApiResponse<any>> => {
    return apiClient.post('/assessments/quizzes', data);
  },
  
  updateQuizLink: (id: string, data: any): Promise<ApiResponse<any>> => {
    return apiClient.put(`/assessments/quizzes/${id}`, data);
  },

  deleteQuizLink: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/assessments/quizzes/${id}`);
  },

  getCourseQuizzes: (courseId: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get(`/assessments/quizzes/course/${courseId}`);
  }
};

// ============================================================
// Assignment APIs (Api version)
// ============================================================

export const assignmentApi = {
  createAssignment: (data: any): Promise<ApiResponse<any>> => {
    return apiClient.post('/assignments', data);
  },
  
  updateAssignment: (id: string, data: any): Promise<ApiResponse<any>> => {
    return apiClient.put(`/assignments/${id}`, data);
  },

  deleteAssignment: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/assignments/${id}`);
  },

  getCourseAssignments: (courseId: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get(`/assignments/course/${courseId}`);
  },

  getAssignmentSubmissions: (id: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get(`/assignments/${id}/submissions`);
  },

  gradeSubmission: (submissionId: string, data: { grade: number; feedback?: string; feedbackAttachments?: string[] }): Promise<ApiResponse<any>> => {
    return apiClient.post(`/assignments/submissions/${submissionId}/grade`, data);
  }
};

// ============================================================
// Certificate / Completion APIs (Api version)
// ============================================================

export const certificateApi = {
  getCourseCompletionRequests: (courseId: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get(`/certificates/course/${courseId}/requests`);
  },
  approveCompletionRequest: (requestId: string): Promise<ApiResponse<any>> => {
    return apiClient.post(`/certificates/requests/${requestId}/approve`);
  },
  rejectCompletionRequest: (requestId: string, reason: string): Promise<ApiResponse<any>> => {
    return apiClient.post(`/certificates/requests/${requestId}/reject`, { reason });
  }
};

// ============================================================
// Recommendation APIs (Skill Sharer -> Learner) (Api version)
// ============================================================

export const recommendationApi = {
  create: (data: { learnerId: string; courseId: string; title: string; content: string; isPublic?: boolean }): Promise<ApiResponse<any>> => {
    return apiClient.post('/recommendations', data);
  },

  getMyCourseLearners: (courseId: string): Promise<ApiResponse<any>> => {
    return apiClient.get(`/recommendations/course/${courseId}/learners`);
  },

  update: (id: string, data: { title?: string; content?: string; isPublic?: boolean }): Promise<ApiResponse<any>> => {
    return apiClient.put(`/recommendations/${id}`, data);
  },

  delete: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/recommendations/${id}`);
  },
};

// Default export combining services
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
