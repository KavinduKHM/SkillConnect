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
