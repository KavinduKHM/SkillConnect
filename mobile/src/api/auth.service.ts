import api from './client';

export const authService = {
  login: (credentials: any) => {
    return api.post('/auth/login', credentials);
  }
};
