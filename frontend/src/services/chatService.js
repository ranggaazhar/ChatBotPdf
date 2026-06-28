import { ENDPOINTS } from '../constants/endpoints';
import { apiRequest } from './api';

export const chatService = {
  sendMessage: async (threadId, query, model) => {
    return apiRequest(ENDPOINTS.CHAT.BASE, {
      method: 'POST',
      body: JSON.stringify({ threadId, query, model })
    });
  },
  getThreads: async () => {
    return apiRequest(ENDPOINTS.CHAT.THREADS, {
      method: 'GET'
    });
  },
  getThreadMessages: async (threadId) => {
    return apiRequest(ENDPOINTS.CHAT.THREAD_DETAIL(threadId), {
      method: 'GET'
    });
  },
  deleteThread: async (threadId) => {
    return apiRequest(ENDPOINTS.CHAT.THREAD_DETAIL(threadId), {
      method: 'DELETE'
    });
  }
};
