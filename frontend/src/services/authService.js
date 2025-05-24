import axios from 'axios';
import { getCookie, deleteCookie } from '../components/utils/cookies';

export const api = axios.create();

api.interceptors.request.use(config => {
  const token = getCookie('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      deleteCookie('token');
    }
    return Promise.reject(error);
  }
);

export const signUp = (data) => api.post('/api/auth/sign-up', data);
export const activate = (email) => api.post('/api/auth/activate', { email });
export const verifyEmail = (data) => api.post('/api/auth/verify', data);
export const signIn = (credentials) => api.post('/api/auth/sign-in', credentials);


//mock api endpoints for future maybe
// export const resetPassword = (data) => api.post('/api/auth/reset-password', data);
// export const resetPasswordConfirm = (data) => api.post('/api/auth/reset-password-confirm', data);
// export const changePassword = (data) => api.post('/api/auth/change-password', data);