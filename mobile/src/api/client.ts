import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - Add token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (!error.response) {
      return Promise.reject({
        success: false,
        error: 'Network error - please check your connection',
      });
    }

    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('token');
      } catch (err) {
        console.error('Error clearing token:', err);
      }
    }

    return Promise.reject({
      success: false,
      status: error.response?.status,
      error: error.response?.data?.error || error.message || 'An error occurred',
    });
  }
);

// ✅ DEFAULT EXPORT - This is the key fix
export default api;

// Also export as named export for consistency
export { api };