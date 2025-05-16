import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URLs based on environment
const PRODUCTION_API_URL = 'https://reports.3p-logistics.co.uk/api/v1';
const DEVELOPMENT_API_URL = 'https://reports.3p-logistics.co.uk/api/test/v1/'; // points to test server
//'' // Android emulator http://10.0.2.2:3000/api/v1
 // iOS simulator http://localhost:3000/api/v1  // points to local server

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Create axios instance with configuration
const api = axios.create({
  baseURL: isProduction ? PRODUCTION_API_URL : DEVELOPMENT_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    // Default Authorization header from the original Vue app
    'Authorization': 'Basic d2FyZWhvdXNlQWRtaW46M1BMJldIRChBUEkp',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  },
});

// Function to update auth token
export const setAuthToken = async (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Basic ${token}`;
    await AsyncStorage.setItem('auth_token', token);
  } else {
    // Revert to default Authorization if token is removed
    api.defaults.headers.common['Authorization'] = 'Basic d2FyZWhvdXNlQWRtaW46M1BMJldIRChBUEkp';
    await AsyncStorage.removeItem('auth_token');
  }
};

// Initialize token from storage
export const initializeAuthToken = async () => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    setAuthToken(token);
  }
};

// Error handling and request/response interceptors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;
    
    // Handle 401 Unauthorized errors
    if (response && response.status === 401) {
      // Clear token if unauthorized
      await setAuthToken(null);
      // Can add redirect to login logic here
      await AsyncStorage.setItem('auth_state_changed', 'true');

    }
    
    return Promise.reject(error);
  }
);

export default api;