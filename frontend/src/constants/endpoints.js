export const API_BASE_URL = 'http://localhost:5000/api';

export const ENDPOINTS = {
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    ME: `${API_BASE_URL}/auth/me`,
  },
  DOCUMENTS: {
    BASE: `${API_BASE_URL}/documents`,
    DELETE: (id) => `${API_BASE_URL}/documents/${id}`,
  },
  CHAT: {
    BASE: `${API_BASE_URL}/chat`,
    THREADS: `${API_BASE_URL}/chat/threads`,
    THREAD_DETAIL: (id) => `${API_BASE_URL}/chat/threads/${id}`,
  },
  ADMIN: {
    LOGS: `${API_BASE_URL}/admin/logs`,
  }
};
