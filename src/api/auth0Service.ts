import api, { setAuthToken } from './apiConfig';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  data: {
    email: string;
    apiKey: string;
  };
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>(
        '/warehouse/systems/door/login', 
        credentials
      );
      
      if (response.data && response.data.data?.apiKey) {
        await setAuthToken(response.data.data.apiKey);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  logout: async (): Promise<void> => {
    await setAuthToken(null);
  },
  
  getCurrentUser: async (): Promise<any> => {
    try {
      // You might need to implement this endpoint on your backend
      // or use the token to get user info
      const token = api.defaults.headers.common['Authorization'];
      if (!token) return null;
      
      return { token };
    } catch (error) {
      throw error;
    }
  }
};