import axios from 'axios';
import { Platform } from 'react-native';

// Base URLs based on environment
const PRODUCTION_API_URL = 'https://reports.3p-logistics.co.uk/api/v1';
const DEVELOPMENT_API_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:3000/api/v1' // Android emulator
  : 'http://localhost:3000/api/v1'; // iOS simulator

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Create axios instance with configuration
const api = axios.create({
  baseURL: isProduction ? PRODUCTION_API_URL : DEVELOPMENT_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    // Hardcoded Authorization header
    Authorization: 'Basic d2FyZWhvdXNlQWRtaW46M1BMJldIRChBUEkp',
  },
});

// Error handling and request/response interceptors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;
    // Handle 401 Unauthorized errors
    if (response && response.status === 401) {
      console.error('Unauthorized access - check your credentials');
    }
    return Promise.reject(error);
  }
);

export default api;
