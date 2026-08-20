import api from './client';

export interface LoginData {
  email: string;
  password?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
  role?: string;
}

// Add to existing authService object
export const authService = {
  login: (data: LoginData) => api.post('/auth/login', data),
  register: (data: RegisterData) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  
  // NEW: Update user profile
  updateProfile: (data: { name: string }) => api.put('/auth/profile', data),
  
  // NEW: Update profile details
  updateProfileDetails: (data: { bio: string; skills: string[]; experience: string }) => 
    api.put('/auth/profile/details', data),
};