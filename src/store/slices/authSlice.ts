import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../api/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserInfo } from '../../api/authService';

// Interface for the user in Redux store
interface User {
  email: string;
  name?: string;
  apiKey?: string;
  [key: string]: any;
}

// Auth state interface
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  accessToken: string | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  accessToken: null,
};

// Login thunk
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      console.log('Login thunk called with:', { email });
      
      // Call login with direct API
      const credentials = await authService.login(email, password);
      
      // Get stored user info
      const userJson = await AsyncStorage.getItem('auth_user');
      const userInfo = userJson ? JSON.parse(userJson) : { email };
      
      return {
        accessToken: credentials.accessToken,
        user: {
          email: userInfo.email,
          apiKey: credentials.accessToken,
          // Include any other properties from userInfo
          ...userInfo
        },
      };
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Authentication failed'
      );
    }
  }
);

// Logout thunk
export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
  return null;
});

// Check auth state thunk
export const checkAuthState = createAsyncThunk(
  'auth/checkState', 
  async (_, { rejectWithValue }) => {
    try {
      // Get user state from auth service
      const userState = await authService.getUserState();
      
      if (!userState) {
        return null;
      }
      
      return {
        accessToken: userState.accessToken,
        user: userState.user,
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