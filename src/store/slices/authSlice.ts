import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../api/authService';

interface User {
  email: string;
  apiKey: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// const initialState: AuthState = {
//   user: null,
//   isLoading: false,
//   error: null,
//   isAuthenticated: false,
// };
const initialState: AuthState = {
  user: __DEV__ ? { email: 'test@3p-logistics.co.uk', apiKey: 'test-key' } : null,
  isLoading: false,
  error: null,
  isAuthenticated: __DEV__ ? true : false,
};
// Async thunks for authentication
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.login({ email, password });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Authentication failed'
      );
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
  return null;
});

export const checkAuthState = createAsyncThunk('auth/checkState', async () => {
  const user = await authService.getCurrentUser();
  return user;
});

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
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
      })
      
      // Check auth state
      .addCase(checkAuthState.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
      })
      .addCase(checkAuthState.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;