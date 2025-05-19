import { useCallback, useState } from 'react';
import Auth0 from 'react-native-auth0';
import { AUTH0_DOMAIN, AUTH0_CLIENT_ID } from '../utils/auth0';
import { setAuthToken } from '../api/apiConfig';
import { useAppDispatch } from './useRedux';
import { logout } from '../store/slices/authSlice';

// Initialize Auth0
const auth0 = new Auth0({
  domain: AUTH0_DOMAIN,
  clientId: AUTH0_CLIENT_ID,
});

export const useAuth0 = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  // Login with Auth0
  const loginWithAuth0 = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Start Auth0 login
      const credentials = await auth0.webAuth.authorize({
        scope: 'openid profile email',
        audience: 'https://warehouse-api',
      });
      
      // Set the ID token as our auth token
      if (credentials.idToken) {
        await setAuthToken(credentials.idToken);
        
        // Get user info if needed
        // const userInfo = await auth0.auth.userInfo({ token: credentials.accessToken });
        
        // Return the credentials
        return credentials;
      } else {
        throw new Error('No ID token received from Auth0');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout from Auth0
  const logoutFromAuth0 = useCallback(async () => {
    setLoading(true);
    
    try {
      await auth0.webAuth.clearSession();
      await setAuthToken(null);
      dispatch(logout());
    } catch (err: any) {
      setError(err.message || 'An error occurred during logout');
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  return {
    loginWithAuth0,
    logoutFromAuth0,
    loading,
    error,
  };
};