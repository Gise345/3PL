import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import auth0Service from '../../utils/auth0Service';

interface User {
  email: string;
  name?: string;
  picture?: string;
  apiKey?: string; // For backward compatibility
  sub?: string; // Auth0 user ID
}

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

// Async thunks for authentication
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Authenticate with Auth0
      const credentials = await auth0Service.login(email, password);
      
      // Get user information
      const userInfo = await auth0Service.getUserInfo(credentials.accessToken);
      
      return {
        accessToken: credentials.accessToken,
        user: {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          sub: userInfo.sub,
          // For backward compatibility, store the access token as apiKey
          apiKey: credentials.accessToken,
        },
      };
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Authentication failed'
      );
    }
  }
);

export const loginWithBrowser = createAsyncThunk(
  'auth/loginWithBrowser',
  async (_, { rejectWithValue }) => {
    try {
      // Authenticate with Auth0 using browser
      const credentials = await auth0Service.loginWithBrowser();
      
      // Get user information
      const userInfo = await auth0Service.getUserInfo(credentials.accessToken);
      
      return {
        accessToken: credentials.accessToken,
        user: {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          sub: userInfo.sub,
          // For backward compatibility, store the access token as apiKey
          apiKey: credentials.accessToken,
        },
      };
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Authentication failed'
      );
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await auth0Service.logout();
  return null;
});

export const checkAuthState = createAsyncThunk('auth/checkState', async (_, { rejectWithValue }) => {
  try {
    // Check if token is valid and refresh if needed
    const isValid = await auth0Service.ensureValidToken();
    
    if (!isValid) {
      return null;
    }
    
    // Get stored credentials
    const credentials = await auth0Service.getStoredCredentials();
    
    if (!credentials?.accessToken) {
      return null;
    }
    
    // Get user information
    const userInfo = await auth0Service.getUserInfo(credentials.accessToken);
    
    return {
      accessToken: credentials.accessToken,
      user: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        sub: userInfo.sub,
        // For backward compatibility, store the access token as apiKey
        apiKey: credentials.accessToken,
      },
    };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to check authentication state');
  }
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
      
      // Login with browser
      .addCase(loginWithBrowser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithBrowser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(loginWithBrowser.rejected, (state, action) => {
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