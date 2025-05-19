import axios from 'axios';
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

// Set auth token for API calls
export const setAuthToken = async (token: string | null): Promise<void> => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    await AsyncStorage.setItem('auth_token', token);
  } else {
    // Revert to default Basic Auth when logged out
    api.defaults.headers.common['Authorization'] = 'Basic d2FyZWhvdXNlQWRtaW46M1BMJldIRChBUEkp';
    await AsyncStorage.removeItem('auth_token');
  }
};

// Initialize token from storage on app startup
export const initializeAuthToken = async (): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error initializing auth token:', error);
  }
};

export default api;