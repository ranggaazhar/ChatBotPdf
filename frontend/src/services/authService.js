import { ENDPOINTS } from '../constants/endpoints';
import { apiRequest } from './api';

export const authService = {
  login: async (email, password) => {
    return apiRequest(ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  register: async (username, email, password) => {
    return apiRequest(ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
  },
  getMe: async () => {
    return apiRequest(ENDPOINTS.AUTH.ME, {
      method: 'GET'
    });
  }
};
