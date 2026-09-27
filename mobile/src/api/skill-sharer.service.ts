import apiClient from './client';
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
// Profile APIs
// ============================================================

export const profileApi = {
  // Create a profile
  createProfile: (data: CreateProfileInput): Promise<ApiResponse<Profile>> => {
    return apiClient.post('/profiles', data);
  },

  // Get my profile
  getMyProfile: (): Promise<ApiResponse<Profile>> => {
    return apiClient.get('/profiles/me');
  },

  // Update profile
  updateProfile: (data: UpdateProfileInput): Promise<ApiResponse<Profile>> => {
    return apiClient.put('/profiles/me', data);
  },

  // Get public profile
  getPublicProfile: (userId: string): Promise<ApiResponse<Profile>> => {
    return apiClient.get(`/profiles/public/${userId}`);
  },
};

// ============================================================
// Qualification APIs
// ============================================================

export const qualificationApi = {
  // Create qualification
  createQualification: (
    profileId: string,
    data: CreateQualificationInput
  ): Promise<ApiResponse<Qualification>> => {
    return apiClient.post('/qualifications', { ...data, profileId });
  },

  // Get all qualifications
  getQualifications: (): Promise<ApiResponse<Qualification[]>> => {
    return apiClient.get('/qualifications');
  },

  // Get single qualification
  getQualification: (id: string): Promise<ApiResponse<Qualification>> => {
    return apiClient.get(`/qualifications/${id}`);
  },

  // Update qualification
  updateQualification: (
    id: string,
    data: UpdateQualificationInput
  ): Promise<ApiResponse<Qualification>> => {
    return apiClient.put(`/qualifications/${id}`, data);
  },

  // Delete qualification
  deleteQualification: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/qualifications/${id}`);
  },
};

// ============================================================
// Course APIs
// ============================================================

export const courseApi = {
  // Create course draft
  createCourse: (data: CreateCourseInput): Promise<ApiResponse<Course>> => {
    return apiClient.post('/courses', data);
  },

  // Get all my courses
  getMyCourses: (): Promise<ApiResponse<Course[]>> => {
    return apiClient.get('/courses');
  },

  // Get single course
  getCourse: (id: string): Promise<ApiResponse<Course>> => {
    return apiClient.get(`/courses/${id}`);
  },

  // Update course
  updateCourse: (
    id: string,
    data: UpdateCourseInput
  ): Promise<ApiResponse<Course>> => {
    return apiClient.put(`/courses/${id}`, data);
  },

  // Submit course for approval
  submitCourse: (id: string): Promise<ApiResponse<Course>> => {
    return apiClient.post(`/courses/${id}/submit`);
  },

  // Delete course (draft only)
  deleteCourse: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/courses/${id}`);
  },
};

// ============================================================
// Quiz / Assessment APIs
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
// Assignment APIs
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
// Certificate / Completion APIs
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
// Recommendation APIs (Skill Sharer -> Learner)
// ============================================================

export const recommendationApi = {
  // Create a recommendation for a learner
  create: (data: { learnerId: string; courseId: string; title: string; content: string; isPublic?: boolean }): Promise<ApiResponse<any>> => {
    return apiClient.post('/recommendations', data);
  },

  // Get all learners who completed my courses (to recommend)
  getMyCourseLearners: (courseId: string): Promise<ApiResponse<any>> => {
    return apiClient.get(`/certificates/course/${courseId}/requests`);
  },

  // Update a recommendation
  update: (id: string, data: { title?: string; content?: string; isPublic?: boolean }): Promise<ApiResponse<any>> => {
    return apiClient.put(`/recommendations/${id}`, data);
  },

  // Delete a recommendation
  delete: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/recommendations/${id}`);
  },
};