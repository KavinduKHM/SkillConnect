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
      if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        // Let browser/native networking set the multipart boundary automatically.
        delete (config.headers as any)?.['Content-Type'];
        delete (config.headers as any)?.['content-type'];
      }

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
  (response) => {
    console.log(`✅ API ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    
    // ✅ Log the actual response data for debugging
    console.log('📥 Response data:', JSON.stringify(response.data, null, 2));
    
    // ✅ If response data has success: false, treat as error
    if (response.data && response.data.success === false) {
      console.error('❌ API returned success: false', response.data);
      return Promise.reject({
        success: false,
        error: response.data.error || response.data.message || 'Request failed',
        message: response.data.error || response.data.message || 'Request failed',
        data: response.data,
      });
    }
    
    // ✅ Wrap the data in a 'data' property to match LoginScreen expectations
    // LoginScreen expects: const { token, user } = response.data;
    // So we need response.data to be { user, token }
    // But axios already has response.data = { user, token }
    // The issue is that LoginScreen does: response.data.data?
    // Let's check: in LoginScreen: const { token, user } = response.data;
    // So response.data should be { user, token }
    // Which it already is! The problem might be elsewhere.
    
    // Actually, looking at the logs, response.data is { user, token }
    // So this should work. But let's keep it as is.
    return response;
  },
  async (error) => {
    if (!error.response) {
      return Promise.reject({
        success: false,
        error: 'Network error - please check your connection',
        message: 'Network error - please check your connection',
      });
    }

    console.error(`❌ API Error ${error.response.status}:`, error.response.data);

    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('token');
      } catch (err) {
        console.error('Error clearing token:', err);
      }
    }

    const errorData = error.response.data;
    
    return Promise.reject({
      success: false,
      status: error.response.status,
      error: errorData?.error || errorData?.message || 'An error occurred',
      message: errorData?.error || errorData?.message || 'An error occurred',
      errors: errorData?.errors || null,
      data: errorData,
    });
  }
);

export default api;