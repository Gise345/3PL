import Auth0 from 'react-native-auth0';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { 
  AUTH0_DOMAIN, 
  AUTH0_CLIENT_ID,
  AUTH0_CALLBACK_URL,
  DEFAULT_SCOPES,
  REFRESH_TOKEN_SCOPES,
  auth0Config,
} from './auth0';
import { UserInfo, Auth0Credentials } from '../types/auth0Types';
import { setAuthToken } from '../api/apiConfig';

// Create Auth0 client instance
const auth0 = new Auth0({
  domain: AUTH0_DOMAIN,
  clientId: AUTH0_CLIENT_ID,
});

// Keys for storing auth state
const AUTH_KEYS = {
  CREDENTIALS: '3pl_auth_credentials',
  USER_PROFILE: '3pl_auth_user_profile',
};

/**
 * Generate a mock token for development and testing
 */
const generateMockToken = (payload: any): string => {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  // Base64 encode a string in a way that works in all environments
  const safeBase64Encode = (str: string): string => {
    let output = '';
    const enc = new TextEncoder();
    const bytes = enc.encode(str);
    const len = bytes.length;
    let c1, c2, c3;
    
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    
    for (let i = 0; i < len; i += 3) {
      c1 = bytes[i] & 0xff;
      c2 = i + 1 < len ? bytes[i + 1] & 0xff : 0;
      c3 = i + 2 < len ? bytes[i + 2] & 0xff : 0;
      
      output += base64Chars.charAt(c1 >> 2);
      output += base64Chars.charAt(((c1 & 3) << 4) | (c2 >> 4));
      output += i + 1 < len ? base64Chars.charAt(((c2 & 15) << 2) | (c3 >> 6)) : '=';
      output += i + 2 < len ? base64Chars.charAt(c3 & 63) : '=';
    }
    
    // Make URL safe
    return output
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };
  
  const headerString = safeBase64Encode(JSON.stringify(header));
  const payloadString = safeBase64Encode(JSON.stringify(payload));
  const signature = 'MOCK_SIGNATURE_FOR_DEVELOPMENT';
  
  return `${headerString}.${payloadString}.${signature}`;
};

/**
 * Helper function to save credentials securely
 */
const saveCredentials = async (credentials: Auth0Credentials): Promise<void> => {
  try {
    const credentialsString = JSON.stringify(credentials);
    
    if (Platform.OS === 'web') {
      // Use localStorage on web
      localStorage.setItem(AUTH_KEYS.CREDENTIALS, credentialsString);
    } else {
      // Use SecureStore on native platforms
      await SecureStore.setItemAsync(AUTH_KEYS.CREDENTIALS, credentialsString);
    }
  } catch (error) {
    console.error('Error saving credentials:', error);
    throw error;
  }
};

/**
 * Helper function to save user profile
 */
const saveUserProfile = async (user: UserInfo): Promise<void> => {
  try {
    const userString = JSON.stringify(user);
    
    if (Platform.OS === 'web') {
      // Use localStorage on web
      localStorage.setItem(AUTH_KEYS.USER_PROFILE, userString);
    } else {
      // Use SecureStore on native platforms
      await SecureStore.setItemAsync(AUTH_KEYS.USER_PROFILE, userString);
    }
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

/**
 * Auth0 service for handling authentication
 */
export const auth0Service = {
  /**
   * Login with Auth0
   */
  login: async (): Promise<{ user: UserInfo; credentials: Auth0Credentials }> => {
    try {
      // For web platform in development, use mock implementation
      if (__DEV__ && Platform.OS === 'web') {
        console.log('Using mock implementation for web login');
        
        // Create a mock user object
        const mockUser: UserInfo = {
          email: 'user@3p-logistics.co.uk',
          name: 'Test User',
          sub: 'auth0|123456789',
          nickname: 'user',
          picture: 'https://ui-avatars.com/api/?name=Test+User',
          updated_at: new Date().toISOString(),
          email_verified: true,
        };
        
        // Create mock credentials
        const expireTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours
        const mockCredentials: Auth0Credentials = {
          accessToken: generateMockToken({
            sub: mockUser.sub,
            email: mockUser.email,
            name: mockUser.name,
            exp: expireTime,
          }),
          idToken: generateMockToken({
            sub: mockUser.sub,
            email: mockUser.email,
            name: mockUser.name,
            exp: expireTime,
            aud: AUTH0_CLIENT_ID,
          }),
          expiresIn: 86400,
          tokenType: 'Bearer',
          refreshToken: 'mock-refresh-token',
          scope: DEFAULT_SCOPES,
          expiresAt: expireTime,
        };
        
        // Save user and credentials
        await saveUserProfile(mockUser);
        await saveCredentials(mockCredentials);
        
        // Set the API token for subsequent requests
        await setAuthToken(mockCredentials.accessToken);
        
        return { user: mockUser, credentials: mockCredentials };
      }
      
      // Use Auth0 SDK for native platforms
      const redirectUrl = Platform.OS === 'ios' 
        ? AUTH0_CALLBACK_URL.IOS 
        : AUTH0_CALLBACK_URL.ANDROID;
      
      console.log(`Logging in with redirect URI: ${redirectUrl}`);
      
      // Use Auth0's authorize method (this opens the Auth0 login page in a browser)
      const credentials = await auth0.webAuth.authorize({
        scope: REFRESH_TOKEN_SCOPES, // Include offline_access for refresh tokens
        audience: auth0Config.audience,
        redirectUrl,
      });
      
      console.log('Auth0 login successful, getting user profile');
      
      // Get user information with the access token
      const user = await auth0.auth.userInfo({ token: credentials.accessToken });
      
      // Save credentials and user profile
      await saveCredentials({
        accessToken: credentials.accessToken,
        idToken: credentials.idToken,
        refreshToken: credentials.refreshToken,
        expiresIn: credentials.expiresIn,
        expiresAt: credentials.expiresAt,
        tokenType: credentials.tokenType,
        scope: credentials.scope,
      });
      await saveUserProfile(user as UserInfo);
      
      // Set the access token for API calls
      await setAuthToken(credentials.accessToken);
      
      return { user: user as UserInfo, credentials: credentials as Auth0Credentials };
    } catch (error) {
      console.error('Auth0 login error:', error);
      throw error;
    }
  },
  
  /**
   * Log out from Auth0
   */
  logout: async (): Promise<void> => {
    try {
      // For web platform, just clear local storage
      if (Platform.OS === 'web') {
        localStorage.removeItem(AUTH_KEYS.CREDENTIALS);
        localStorage.removeItem(AUTH_KEYS.USER_PROFILE);
        await setAuthToken(null);
        return;
      }
      
      // For native platforms, use Auth0 SDK to clear session
      try {
        await auth0.webAuth.clearSession();
      } catch (clearError) {
        console.warn('Error clearing Auth0 session:', clearError);
        // Continue with local logout even if server logout fails
      }
      
      // Clear stored credentials and user profile
      await SecureStore.deleteItemAsync(AUTH_KEYS.CREDENTIALS);
      await SecureStore.deleteItemAsync(AUTH_KEYS.USER_PROFILE);
      
      // Clear API token
      await setAuthToken(null);
    } catch (error) {
      console.error('Auth0 logout error:', error);
      throw error;
    }
  },
  
  /**
   * Get stored credentials
   */
  getCredentials: async (): Promise<Auth0Credentials | null> => {
    try {
      // Platform-specific storage
      let credentialsString: string | null = null;
      
      if (Platform.OS === 'web') {
        credentialsString = localStorage.getItem(AUTH_KEYS.CREDENTIALS);
      } else {
        credentialsString = await SecureStore.getItemAsync(AUTH_KEYS.CREDENTIALS);
      }
      
      return credentialsString ? JSON.parse(credentialsString) : null;
    } catch (error) {
      console.error('Error retrieving stored credentials:', error);
      return null;
    }
  },
  
  /**
   * Get stored user profile
   */
  getUserProfile: async (): Promise<UserInfo | null> => {
    try {
      // Platform-specific storage
      let userString: string | null = null;
      
      if (Platform.OS === 'web') {
        userString = localStorage.getItem(AUTH_KEYS.USER_PROFILE);
      } else {
        userString = await SecureStore.getItemAsync(AUTH_KEYS.USER_PROFILE);
      }
      
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error retrieving stored user profile:', error);
      return null;
    }
  },
  
  /**
   * Check if the user is authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const credentials = await auth0Service.getCredentials();
      
      if (!credentials?.accessToken) {
        return false;
      }
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      
      if (credentials.expiresAt && credentials.expiresAt < now) {
        // Token is expired, try to refresh if we have a refresh token
        if (credentials.refreshToken) {
          try {
            await auth0Service.refreshToken(credentials.refreshToken);
            return true;
          } catch (refreshError) {
            console.warn('Error refreshing token:', refreshError);
            return false;
          }
        }
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  },
  
  /**
   * Get user information with an access token
   */
  getUserInfo: async (accessToken?: string): Promise<UserInfo | null> => {
    try {
      // First try to get cached user profile
      const cachedUser = await auth0Service.getUserProfile();
      if (cachedUser) {
        return cachedUser;
      }
      
      // For web development, return mock user
      if (__DEV__ && Platform.OS === 'web') {
        const mockUser: UserInfo = {
          email: 'user@3p-logistics.co.uk',
          name: 'Test User',
          sub: 'auth0|123456789',
          nickname: 'user',
          picture: 'https://ui-avatars.com/api/?name=Test+User',
          updated_at: new Date().toISOString(),
          email_verified: true,
        };
        return mockUser;
      }
      
      // If no token provided, try to get it from stored credentials
      let token = accessToken;
      if (!token) {
        const credentials = await auth0Service.getCredentials();
        token = credentials?.accessToken;
      }
      
      if (!token) {
        throw new Error('No access token available');
      }
      
      // Get user info from Auth0
      const user = await auth0.auth.userInfo({ token });
      
      // Cache the user profile
      await saveUserProfile(user as UserInfo);
      
      return user as UserInfo;
    } catch (error) {
      console.error('Error getting user info:', error);
      
      if (__DEV__) {
        // In development, return a fallback user
        return {
          email: 'fallback@3p-logistics.co.uk',
          name: 'Fallback User',
          sub: 'auth0|fallback',
          nickname: 'fallback',
          picture: 'https://ui-avatars.com/api/?name=Fallback+User',
          updated_at: new Date().toISOString(),
          email_verified: true,
        };
      }
      
      return null;
    }
  },
  
  /**
   * Refresh the access token
   */
  refreshToken: async (refreshToken: string): Promise<Auth0Credentials> => {
    try {
      // For web development, return mock credentials
      if (__DEV__ && Platform.OS === 'web') {
        console.log('Using mock implementation for token refresh');
        
        const expireTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours
        const mockCredentials: Auth0Credentials = {
          accessToken: generateMockToken({
            sub: 'auth0|123456789',
            email: 'refreshed@3p-logistics.co.uk',
            name: 'Refreshed User',
            exp: expireTime,
          }),
          idToken: generateMockToken({
            sub: 'auth0|123456789',
            email: 'refreshed@3p-logistics.co.uk',
            name: 'Refreshed User',
            exp: expireTime,
            aud: AUTH0_CLIENT_ID,
          }),
          expiresIn: 86400,
          tokenType: 'Bearer',
          refreshToken: refreshToken, // Keep the same refresh token
          scope: DEFAULT_SCOPES,
          expiresAt: expireTime,
        };
        
        // Save refreshed credentials
        await saveCredentials(mockCredentials);
        
        // Update API token
        await setAuthToken(mockCredentials.accessToken);
        
        return mockCredentials;
      }
      
      // For native platforms, use Auth0 SDK
      const credentials = await auth0.auth.refreshToken({
        refreshToken,
        scope: DEFAULT_SCOPES, // Usually don't need offline_access when refreshing
      });
      
      const auth0Credentials: Auth0Credentials = {
        accessToken: credentials.accessToken,
        idToken: credentials.idToken,
        refreshToken: credentials.refreshToken || refreshToken, // Keep original if not returned
        expiresIn: credentials.expiresIn,
        expiresAt: credentials.expiresAt,
        tokenType: credentials.tokenType,
        scope: credentials.scope,
      };
      
      // Save refreshed credentials
      await saveCredentials(auth0Credentials);
      
      // Update API token
      await setAuthToken(auth0Credentials.accessToken);
      
      return auth0Credentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  },
  
  /**
   * Get user state including credentials and profile
   * Used by the auth slice to initialize the Redux store
   */
  getUserState: async (): Promise<{ user: UserInfo; accessToken: string } | null> => {
    try {
      // Check if we're authenticated
      const isAuthenticated = await auth0Service.isAuthenticated();
      
      if (!isAuthenticated) {
        return null;
      }
      
      // Get user profile and credentials
      const credentials = await auth0Service.getCredentials();
      let user = await auth0Service.getUserProfile();
      
      // If we have credentials but no user profile, try to get it
      if (credentials?.accessToken && !user) {
        user = await auth0Service.getUserInfo(credentials.accessToken);
      }
      
      if (!user || !credentials?.accessToken) {
        return null;
      }
      
      return {
        user,
        accessToken: credentials.accessToken,
      };
    } catch (error) {
      console.error('Error getting user state:', error);
      return null;
    }
  },
};

export default auth0Service;