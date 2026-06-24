import { API_BASE_URL } from '../constants/endpoints';

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const apiRequest = async (url, options = {}) => {
  const isMultipart = options.body instanceof FormData;
  const headers = { ...getHeaders(isMultipart), ...options.headers };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      // Jika token expired (403/401) dan ini bukan rute login, hapus token
      if ((response.status === 401 || response.status === 403) && !url.includes('/auth/login')) {
        localStorage.removeItem('token');
      }
      throw new Error(data.message || 'Terjadi kesalahan pada sistem.');
    }

    return data;
  } catch (error) {
    throw error;
  }
};
