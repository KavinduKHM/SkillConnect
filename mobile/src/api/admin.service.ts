import api from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  verifiedBadge: boolean;
  profilePicture: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  _count: { courses: number };
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  children: Category[];
  _count: { courses: number; children: number };
}

export interface Skill {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  category: Category | null;
  aliases: string[];
}

export interface Qualification {
  id: string;
  userId: string;
  title: string;
  institution: string;
  year: number;
  status: string;
  user: { id: string; email: string; name: string };
  documents: { id: string; fileUrl: string; fileName: string }[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  difficulty: string;
  creator: { id: string; email: string; name: string; verifiedBadge: boolean };
  category: Category;
}

export const adminService = {
  // User Management
  getUsers: (params?: { search?: string; role?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  suspendUser: (id: string, reason: string) =>
    api.put(`/admin/users/${id}/suspend`, { reason }),
  restoreUser: (id: string) =>
    api.put(`/admin/users/${id}/restore`),
  changeRole: (id: string, role: string) =>
    api.put(`/admin/users/${id}/role`, { role }),

  // Badge Management
  assignBadge: (id: string) =>
    api.put(`/admin/users/${id}/badge/assign`),
  removeBadge: (id: string) =>
    api.put(`/admin/users/${id}/badge/remove`),

  // Qualification Verification
  getPendingQualifications: () =>
    api.get('/admin/qualifications/pending'),
  verifyQualification: (id: string) =>
    api.put(`/admin/qualifications/${id}/verify`),
  rejectQualification: (id: string, reason: string) =>
    api.put(`/admin/qualifications/${id}/reject`, { reason }),

  // Course Approval
  getPendingCourses: () =>
    api.get('/admin/courses/pending'),
  approveCourse: (id: string) =>
    api.put(`/admin/courses/${id}/approve`),
  rejectCourse: (id: string, reason: string) =>
    api.put(`/admin/courses/${id}/reject`, { reason }),

  // Category Management
  getCategories: () =>
    api.get('/admin/categories'),
  createCategory: (data: { name: string; description?: string; icon?: string; parentId?: string }) =>
    api.post('/admin/categories', data),
  updateCategory: (id: string, data: { name?: string; description?: string; icon?: string; parentId?: string }) =>
    api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) =>
    api.delete(`/admin/categories/${id}`),

  // Skill Management
  getSkills: () =>
    api.get('/admin/skills'),
  createSkill: (data: { name: string; description?: string; categoryId?: string; aliases?: string[] }) =>
    api.post('/admin/skills', data),
  updateSkill: (id: string, data: { name?: string; description?: string; categoryId?: string; aliases?: string[] }) =>
    api.put(`/admin/skills/${id}`, data),
  deleteSkill: (id: string) =>
    api.delete(`/admin/skills/${id}`),
};