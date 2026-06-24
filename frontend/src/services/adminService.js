import { ENDPOINTS } from '../constants/endpoints';
import { apiRequest } from './api';

export const adminService = {
  getSearchLogs: async () => {
    return apiRequest(ENDPOINTS.ADMIN.LOGS, {
      method: 'GET'
    });
  }
};
