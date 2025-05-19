import Auth0, { Credentials, UserInfo } from 'react-native-auth0';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { 
  auth0Config, 
  DEFAULT_SCOPES,
  REFRESH_TOKEN_SCOPES,
  REDIRECT_URI
} from './auth0';
import { setAuthToken } from '../api/apiConfig';

// Register the redirect URI for web browser (only on native platforms)
if (Platform.OS !== 'web') {
  try {
    WebBrowser.maybeCompleteAuthSession();
  } catch (error) {
    console.warn('Failed to initialize WebBrowser:', error);
  }
}

// Create Auth0 client instance
let auth0: Auth0;
try {
  auth0 = new Auth0({
    domain: auth0Config.domain,
    clientId: auth0Config.clientId,
  });
} catch (error) {
  console.error('Failed to initialize Auth0 SDK:', error);
  // We'll create a fallback implementation later
}

// Keys for storing auth state
const AUTH_KEYS = {
  CREDENTIALS: '3pl_auth_credentials',
  USER_PROFILE: '3pl_auth_user_profile',
};

// Default timeout for API calls (15 seconds)
const API_TIMEOUT = 15000;

/**
 * Helper function to generate a mock token for development
 */
const generateMockToken = (payload: any): string => {
  // Create the three parts of a JWT
  const header = { alg: 'HS256', typ: 'JWT' };
  
  // Use a safe version of btoa that works in all environments
  const safeBase64Encode = (str: string): string => {
    try {
      // First try native btoa
      return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    } catch (e) {
      // Fallback for environments where btoa might not be available
      // Create a base64 string without external dependencies
      const base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let result = '';
      
      // Convert string to UTF-8 array
      const utf8 = [];
      for (let i = 0; i < str.length; i++) {
        let charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
          utf8.push(0xc0 | (charcode >> 6), 
                    0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
          utf8.push(0xe0 | (charcode >> 12), 
                    0x80 | ((charcode>>6) & 0x3f), 
                    0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
          i++;
          charcode = ((charcode & 0x3ff)<<10) | (str.charCodeAt(i) & 0x3ff);
          utf8.push(0xf0 | (charcode >>18), 
                    0x80 | ((charcode>>12) & 0x3f), 
                    0x80 | ((charcode>>6) & 0x3f), 
                    0x80 | (charcode & 0x3f));
        }
      }
      
      // Convert UTF-8 array to base64
      let i = 0;
      const bytes = utf8;
      
      while (i < bytes.length) {
        const a = i < bytes.length ? bytes[i++] : 0;
        const b = i < bytes.length ? bytes[i++] : 0;
        const c = i < bytes.length ? bytes[i++] : 0;
        
        const triplet = (a << 16) | (b << 8) | c;
        
        result += base64chars[(triplet >> 18) & 0x3F];
        result += base64chars[(triplet >> 12) & 0x3F];
        result += i > bytes.length + 1 ? '=' : base64chars[(triplet >> 6) & 0x3F];
        result += i > bytes.length ? '=' : base64chars[triplet & 0x3F];
      }
      
      // Make it URL safe
      return result
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }
  };
  
  const headerString = safeBase64Encode(JSON.stringify(header));
  const payloadString = safeBase64Encode(JSON.stringify(payload));
  const signature = 'MOCK_SIGNATURE_FOR_DEVELOPMENT';
  
  // Combine the parts with periods
  return `${headerString}.${payloadString}.${signature}`;
};

/**
 * Helper function to save credentials securely
 */
const saveCredentials = async (credentials: Credentials): Promise<void> => {
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
 * Helper function to get platform-specific redirect URI
 */
const getRedirectUri = (): string => {
  if (Platform.OS === 'ios') {
    return REDIRECT_URI.IOS;
  } else if (Platform.OS === 'android') {
    return REDIRECT_URI.ANDROID;
  } else {
    return REDIRECT_URI.WEB;
  }
};

/**
 * Auth0 service for handling authentication
 */
export const auth0Service = {
  /**
   * Login with Auth0 browser flow (recommended approach)
   */
  login: async (): Promise<{ user: UserInfo; credentials: Credentials }> => {
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
        const mockCredentials: Credentials = {
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
            aud: auth0Config.clientId,
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
      const redirectUri = getRedirectUri();
      console.log(`Logging in with redirect URI: ${redirectUri}`);
      
      // Use Auth0's authorize method (this opens the Auth0 login page in a browser)
      const credentials = await auth0.webAuth.authorize({
        scope: REFRESH_TOKEN_SCOPES, // Include offline_access for refresh tokens
        audience: auth0Config.audience,
        redirectUrl: redirectUri,
      });
      
      console.log('Auth0 login successful, getting user profile');
      
      // Get user information with the access token
      const user = await auth0.auth.userInfo({ token: credentials.accessToken });
      
      // Save credentials and user profile
      await saveCredentials(credentials);
      await saveUserProfile(user);
      
      // Set the access token for API calls
      await setAuthToken(credentials.accessToken);
      
      return { user, credentials };
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
        await auth0.webAuth.clearSession({ federated: true });
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
  getCredentials: async (): Promise<Credentials | null> => {
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
      await saveUserProfile(user);
      
      return user;
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
        } as UserInfo;
      }
      
      return null;
    }
  },
  
  /**
   * Refresh the access token
   */
  refreshToken: async (refreshToken: string): Promise<Credentials> => {
    try {
      // For web development, return mock credentials
      if (__DEV__ && Platform.OS === 'web') {
        console.log('Using mock implementation for token refresh');
        
        const expireTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours
        const mockCredentials: Credentials = {
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
            aud: auth0Config.clientId,
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
      
      // Save refreshed credentials
      await saveCredentials(credentials);
      
      // Update API token
      await setAuthToken(credentials.accessToken);
      
      return credentials;
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