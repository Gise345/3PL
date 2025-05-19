import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import auth0Service from '../../api/auth0Service';
import { UserInfo } from '../../types/auth0Types';

// Interface for the user in our Redux store
interface User {
  email: string;
  name?: string;
  picture?: string;
  apiKey?: string; // For backward compatibility
  sub?: string;
  [key: string]: any; // For other Auth0 user properties
}

// Auth state interface
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  accessToken: string | null;
}

// Initial state with development mode fallback
const initialState: AuthState = {
  user: __DEV__ ? { email: 'test@3p-logistics.co.uk', apiKey: 'test-key' } : null,
  isLoading: false,
  error: null,
  isAuthenticated: __DEV__ ? true : false,
  accessToken: null,
};

// Helper function to convert Auth0User to our User type
const mapAuth0User = (auth0User: UserInfo, accessToken: string): User => {
  return {
    email: auth0User.email || '',
    name: auth0User.name,
    picture: auth0User.picture,
    sub: auth0User.sub,
    nickname: auth0User.nickname,
    emailVerified: auth0User.email_verified,
    updatedAt: auth0User.updated_at,
    // For backward compatibility with existing code
    apiKey: accessToken,
    // Include any other properties from Auth0User
    ...auth0User,
  };
};

// Async thunks for authentication
export const login = createAsyncThunk(
  'auth/login',
  async (_, { rejectWithValue }) => {
    try {
      // Login with Auth0 (browser flow)
      const { user, credentials } = await auth0Service.login();
      
      return {
        accessToken: credentials.accessToken,
        user: mapAuth0User(user, credentials.accessToken),
      };
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Authentication failed'
      );
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout', 
  async () => {
    await auth0Service.logout();
    return null;
  }
);

export const checkAuthState = createAsyncThunk(
  'auth/checkState', 
  async (_, { rejectWithValue }) => {
    try {
      // Get user state from Auth0 service
      const userState = await auth0Service.getUserState();
      
      if (!userState) {
        return null;
      }
      
      return {
        accessToken: userState.accessToken,
        user: mapAuth0User(userState.user, userState.accessToken),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check authentication state');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
      })
      
      // Check auth state
      .addCase(checkAuthState.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = !!action.payload;
        if (action.payload) {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
        }
      })
      .addCase(checkAuthState.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;