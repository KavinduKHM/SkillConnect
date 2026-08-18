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
    return apiClient.post('/api/profiles', data);
  },

  // Get my profile
  getMyProfile: (): Promise<ApiResponse<Profile>> => {
    return apiClient.get('/api/profiles/me');
  },

  // Update profile
  updateProfile: (data: UpdateProfileInput): Promise<ApiResponse<Profile>> => {
    return apiClient.put('/api/profiles/me', data);
  },

  // Get public profile
  getPublicProfile: (userId: string): Promise<ApiResponse<Profile>> => {
    return apiClient.get(`/api/profiles/public/${userId}`);
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
    return apiClient.post('/api/qualifications', { ...data, profileId });
  },

  // Get all qualifications
  getQualifications: (): Promise<ApiResponse<Qualification[]>> => {
    return apiClient.get('/api/qualifications');
  },

  // Get single qualification
  getQualification: (id: string): Promise<ApiResponse<Qualification>> => {
    return apiClient.get(`/api/qualifications/${id}`);
  },

  // Update qualification
  updateQualification: (
    id: string,
    data: UpdateQualificationInput
  ): Promise<ApiResponse<Qualification>> => {
    return apiClient.put(`/api/qualifications/${id}`, data);
  },

  // Delete qualification
  deleteQualification: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/api/qualifications/${id}`);
  },
};

// ============================================================
// Course APIs
// ============================================================

export const courseApi = {
  // Create course draft
  createCourse: (data: CreateCourseInput): Promise<ApiResponse<Course>> => {
    return apiClient.post('/api/courses', data);
  },

  // Get all my courses
  getMyCourses: (): Promise<ApiResponse<Course[]>> => {
    return apiClient.get('/api/courses');
  },

  // Get single course
  getCourse: (id: string): Promise<ApiResponse<Course>> => {
    return apiClient.get(`/api/courses/${id}`);
  },

  // Update course
  updateCourse: (
    id: string,
    data: UpdateCourseInput
  ): Promise<ApiResponse<Course>> => {
    return apiClient.put(`/api/courses/${id}`, data);
  },

  // Submit course for approval
  submitCourse: (id: string): Promise<ApiResponse<Course>> => {
    return apiClient.post(`/api/courses/${id}/submit`);
  },

  // Delete course (draft only)
  deleteCourse: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/api/courses/${id}`);
  },
};

// ============================================================
// Quiz / Assessment APIs
// ============================================================

export const quizApi = {
  createQuizLink: (data: any): Promise<ApiResponse<any>> => {
    return apiClient.post('/api/assessments/quizzes', data);
  },
  
  updateQuizLink: (id: string, data: any): Promise<ApiResponse<any>> => {
    return apiClient.put(`/api/assessments/quizzes/${id}`, data);
  },

  deleteQuizLink: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/api/assessments/quizzes/${id}`);
  },

  getCourseQuizzes: (courseId: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get(`/api/assessments/quizzes/course/${courseId}`);
  }
};