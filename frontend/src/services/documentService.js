import { ENDPOINTS } from '../constants/endpoints';
import { apiRequest } from './api';

export const documentService = {
  getAll: async () => {
    return apiRequest(ENDPOINTS.DOCUMENTS.BASE, {
      method: 'GET'
    });
  },
  upload: async (file, title) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    
    return apiRequest(ENDPOINTS.DOCUMENTS.BASE, {
      method: 'POST',
      body: formData
    });
  },
  delete: async (id) => {
    return apiRequest(ENDPOINTS.DOCUMENTS.DELETE(id), {
      method: 'DELETE'
    });
  }
};
