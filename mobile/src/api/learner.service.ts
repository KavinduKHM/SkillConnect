import client from './client';

export interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  deliveryMethod?: string;
  duration?: string;
  thumbnail?: string;
  enrolledCount: number;
  rating?: number;
  category?: { id: string; name: string };
  creator?: { id: string; name: string; verifiedBadge?: boolean };
  modules?: Array<{
    id: string;
    title: string;
    lessons: Array<{
      id: string;
      title: string;
      description?: string;
      estimatedMinutes?: number;
      materials?: Array<{
        id: string;
        title: string;
        type: string;
        duration?: number;
      }>;
    }>;
  }>;
  courseReviews?: Array<any>;
}

export const fetchCourses = async (search?: string, categoryId?: string, difficulty?: string) => {
  const params: any = {};
  if (search) params.search = search;
  if (categoryId && categoryId !== 'All') params.categoryId = categoryId;
  if (difficulty && difficulty !== 'All') params.difficulty = difficulty;

  const response = await client.get('/learner/courses', { params });
  return response.data;
};

export const fetchCourseDetails = async (courseId: string) => {
  const response = await client.get(`/learner/courses/${courseId}`);
  return response.data;
};

export const fetchCategories = async () => {
  const response = await client.get('/learner/categories');
  return response.data;
};

export const enrollCourse = async (courseId: string) => {
  const response = await client.post('/learner/enrollments', { courseId });
  return response.data;
};

export const cancelEnrollment = async (courseId: string) => {
  const response = await client.delete(`/learner/enrollments/${courseId}`);
  return response.data;
};

export const fetchMyLearning = async () => {
  const response = await client.get('/learner/my-learning');
  return response.data;
};

export const fetchLessonContent = async (lessonId: string) => {
  const response = await client.get(`/learner/lessons/${lessonId}`);
  return response.data;
};

export const completeLesson = async (courseId: string, lessonId: string) => {
  const response = await client.post('/learner/progress/complete', { courseId, lessonId });
  return response.data;
};

// ============================================================
// Quiz / Assessment APIs
// ============================================================

export const fetchMyQuizzes = async () => {
  const response: any = await client.get('/assessments/quizzes/me');
  return response;
};

export const completeQuiz = async (quizId: string) => {
  const response: any = await client.post(`/assessments/quizzes/${quizId}/complete`, { passed: true });
  return response;
};

// ============================================================
// Assignment APIs
// ============================================================

export const fetchCourseAssignments = async (courseId: string) => {
  const response: any = await client.get(`/assignments/course/${courseId}`);
  return response;
};

export const fetchSingleAssignment = async (id: string) => {
  const response: any = await client.get(`/assignments/${id}`);
  return response;
};

export const fetchLearnerSubmissions = async (id: string) => {
  const response: any = await client.get(`/assignments/${id}/my-submissions`);
  return response;
};

export const submitAssignmentWork = async (id: string, data: { fileUrls?: string[]; githubLink?: string; textSubmission?: string }) => {
  const response: any = await client.post(`/assignments/${id}/submit`, data);
  return response;
};

export const uploadAssessmentFiles = async (formData: FormData) => {
  const response: any = await client.post('/assessments/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};

export const deleteAssignmentSubmission = async (submissionId: string) => {
  const response: any = await client.delete(`/assignments/submissions/${submissionId}`);
  return response;
};

export const deleteLearnerSubmission = async (assignmentId: string, versionNumber: number) => {
  const response = await client.delete(`/learner/assignments/${assignmentId}/submissions/${versionNumber}`);
  return response.data;
};

// ============================================================
// CERTIFICATES & COMPLETIONS
// ============================================================

export const requestCourseCompletion = async (courseId: string) => {
  const response = await client.post(`/certificates/request/${courseId}`);
  return response.data;
};

export const fetchMyCompletionRequests = async () => {
  const response = await client.get('/certificates/my-requests');
  return response.data;
};

export const fetchMyCertificates = async () => {
  const response = await client.get('/certificates/my-certificates');
  return response.data;
};
