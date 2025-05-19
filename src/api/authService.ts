import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './apiConfig';

// Define user and credentials interfaces
export interface UserInfo {
  email: string;
  name?: string;
  apiKey?: string;
  sub?: string;
  [key: string]: any;
}

export interface AuthCredentials {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
}

// Authentication service using direct API
const authService = {
  // Login using direct API call
  login: async (email: string, password: string): Promise<AuthCredentials> => {
    try {
      console.log('Attempting API login with:', { email });
      

    // Ensure email has the domain - same logic as Vue app
    const fullEmail = email.includes('@') ? email : `${email}@3p-logistics.co.uk`;
      
    // Make API request
    const response = await api.post('/warehouse/systems/door/login', {
      email: fullEmail,
      password: password
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      }
    });
      
      if (response.status !== 200) {
        throw new Error('Authentication failed');
      }
      
      console.log('Login successful');
      
      // Extract user data and API key
      const userData = response.data.data;
      
      // Save user data
      await AsyncStorage.setItem('auth_user', JSON.stringify({
        email: userData.email,
        apiKey: userData.apiKey,
        sub: 'api-user',
        updated_at: new Date().toISOString()
      }));
      
      // Create credentials object from response
      const credentials: AuthCredentials = {
        accessToken: userData.apiKey || 'default-token',
        idToken: userData.apiKey || 'default-token',
        expiresIn: 86400, // 24 hours
        tokenType: 'Bearer',
        scope: 'openid profile email'
      };
      
      // Store token
      await AsyncStorage.setItem('auth_token', credentials.accessToken);
      
      return credentials;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Logout
  logout: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('auth_user');
      await AsyncStorage.removeItem('auth_token');
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  // Get user info (from storage)
  getUserInfo: async (): Promise<UserInfo | null> => {
    try {
      const userJson = await AsyncStorage.getItem('auth_user');
      if (!userJson) {
        return null;
      }
      return JSON.parse(userJson) as UserInfo;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  },
  
  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      return !!token;
    } catch (error) {
      return false;
    }
  },
  
  // Get stored user state
  getUserState: async (): Promise<{ user: UserInfo; accessToken: string } | null> => {
    try {
      const userJson = await AsyncStorage.getItem('auth_user');
      const token = await AsyncStorage.getItem('auth_token');
      
      if (!userJson || !token) {
        return null;
      }
      
      return {
        user: JSON.parse(userJson),
        accessToken: token,
      };
    } catch (error) {
      return null;
    }
  }
};

export default authService;