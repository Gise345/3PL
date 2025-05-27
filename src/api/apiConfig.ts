import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URLs based on environment - match exactly with Vue app
const PRODUCTION_API_URL = 'https://reports.3p-logistics.co.uk/api/v1';
const DEVELOPMENT_API_URL = __DEV__ ? 'http://10.0.2.2:3000/api/v1' : PRODUCTION_API_URL;

// Create axios instance with configuration
const api = axios.create({
  baseURL: PRODUCTION_API_URL, // Use production URL for now to ensure it works
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
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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

// Export additional useful info
export const API_CONFIG = {
  PRODUCTION_URL: PRODUCTION_API_URL,
  DEVELOPMENT_URL: DEVELOPMENT_API_URL
};

export default api;