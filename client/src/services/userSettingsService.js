import axios from 'axios';

const API_URL = 'https://aaghaaz-tech-server.vercel.app/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Configure axios with auth header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const userSettingsService = {
  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Setup 2FA
  setup2FA: async () => {
    try {
      const response = await api.post('/auth/2fa/setup');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Verify and enable 2FA
  verify2FA: async (token) => {
    try {
      const response = await api.post('/auth/2fa/verify', { code : token });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Disable 2FA
  disable2FA: async (token) => {
    try {
      const response = await api.post('/auth/2fa/disable', { token });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete account
  deleteAccount: async (password) => {
    try {
      const response = await api.delete('/auth/account', { data: { password } });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}; 