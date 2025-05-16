import Auth0, { Credentials, PasswordRealmOptions } from 'react-native-auth0';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { auth0Config, redirectUri } from './auth0';
import { setAuthToken } from '../api/apiConfig';

// Register the redirect URI for web browser
WebBrowser.maybeCompleteAuthSession();

// Create Auth0 client instance
const auth0 = new Auth0({
  domain: auth0Config.domain,
  clientId: auth0Config.clientId,
});

// Key for storing credentials in secure storage
const AUTH_CREDENTIALS_KEY = '3pl_auth_credentials';

// Auth0 service for handling authentication
export const auth0Service = {
  /**
   * Login with username and password (resource owner password flow)
   * This is the equivalent of the existing Vue app login method
   */
  login: async (username: string, password: string): Promise<Credentials> => {
    try {
      // Complete the email address
      const email = username.includes('@') ? username : `${username}@3p-logistics.co.uk`;
      
      // Authenticate with Auth0
      const credentials: Credentials = await auth0.auth.passwordRealm({
        username: email,
        password,
        realm: 'Username-Password-Authentication', // This is the default connection name in Auth0
        audience: auth0Config.audience,
        scope: auth0Config.scope,
      });
      
      // Save credentials securely
      await SecureStore.setItemAsync(
        AUTH_CREDENTIALS_KEY,
        JSON.stringify(credentials)
      );
      
      // Set the API token for subsequent requests
      await setAuthToken(credentials.accessToken);
      
      return credentials;
    } catch (error) {
      console.error('Auth0 login error:', error);
      throw error;
    }
  },
  
  /**
   * Alternative login method using web-based authentication
   * This is useful if you want to use Auth0's Universal Login page
   */
  loginWithBrowser: async (): Promise<Credentials> => {
    try {
      // Start Auth0 login
      const credentials = await auth0.webAuth.authorize({
        redirectUrl: redirectUri,
        audience: auth0Config.audience,
        scope: auth0Config.scope,
      });
      
      // Save credentials securely
      await SecureStore.setItemAsync(
        AUTH_CREDENTIALS_KEY,
        JSON.stringify(credentials)
      );
      
      // Set the API token for subsequent requests
      await setAuthToken(credentials.accessToken);
      
      return credentials;
    } catch (error) {
      console.error('Auth0 web login error:', error);
      throw error;
    }
  },
  
  /**
   * Logout from Auth0
   */
  logout: async (): Promise<void> => {
    try {
      // Clear browser session if using web auth
      if (Platform.OS !== 'web') {
        await auth0.webAuth.clearSession();
      }
      
      // Remove stored credentials
      await SecureStore.deleteItemAsync(AUTH_CREDENTIALS_KEY);
      
      // Clear API token
      await setAuthToken(null);
    } catch (error) {
      console.error('Auth0 logout error:', error);
      throw error;
    }
  },
  
  /**
   * Get user profile information
   */
  getUserInfo: async (accessToken: string): Promise<any> => {
    try {
      return await auth0.auth.userInfo({ token: accessToken });
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  },
  
  /**
   * Get stored credentials
   */
  getStoredCredentials: async (): Promise<Credentials | null> => {
    try {
      const credentialsString = await SecureStore.getItemAsync(AUTH_CREDENTIALS_KEY);
      return credentialsString ? JSON.parse(credentialsString) : null;
    } catch (error) {
      console.error('Error retrieving stored credentials:', error);
      return null;
    }
  },
  
  /**
   * Refresh token when expired
   */
  refreshToken: async (refreshToken: string): Promise<Credentials> => {
    try {
      const credentials = await auth0.auth.refreshToken({
        refreshToken,
        scope: auth0Config.scope,
      });
      
      // Update stored credentials
      await SecureStore.setItemAsync(
        AUTH_CREDENTIALS_KEY,
        JSON.stringify(credentials)
      );
      
      // Update API token
      await setAuthToken(credentials.accessToken);
      
      return credentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  },
  
  /**
   * Check if token is valid and refresh if needed
   */
  ensureValidToken: async (): Promise<boolean> => {
    try {
      const credentials = await auth0Service.getStoredCredentials();
      
      if (!credentials) {
        return false;
      }
      
      // Check if token is expired
      const expirationDate = new Date(credentials.expiresAt * 1000);
      const now = new Date();
      
      // If token expires in less than 10 minutes, refresh it
      if (expirationDate.getTime() - now.getTime() < 10 * 60 * 1000) {
        if (credentials.refreshToken) {
          await auth0Service.refreshToken(credentials.refreshToken);
        } else {
          // No refresh token available, need to re-authenticate
          return false;
        }
      } else {
        // Token is still valid, set it for API calls
        await setAuthToken(credentials.accessToken);
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring valid token:', error);
      return false;
    }
  }
};

export default auth0Service;