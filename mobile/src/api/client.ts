import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // ✅ Add timeout
});

// ✅ Request interceptor - Add token to requests
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
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && typeof data === 'object' && !('data' in data)) {
      // Backward compatibility hack: 
      // Only set data.data if the response object doesn't already have its own .data property
      data.data = data;
    }
    return data;
  },
  async (error) => {
    // ✅ Handle network errors
    if (!error.response) {
      console.error('Network Error - No response from server');
      return Promise.reject({
        success: false,
        error: 'Network error - please check your connection',
      });
    }

    // ✅ Handle 401 Unauthorized
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('token');
        // ✅ Emit event for auth context to handle
        // You can use EventEmitter or a global state
        console.log('Token expired - redirecting to login');
      } catch (err) {
        console.error('Error clearing token:', err);
      }
    }

    // ✅ Return consistent error format
    return Promise.reject({
      success: false,
      status: error.response?.status,
      error: error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || error.message || 'An error occurred',
      data: error.response?.data,
    });
  }
);

export default api;