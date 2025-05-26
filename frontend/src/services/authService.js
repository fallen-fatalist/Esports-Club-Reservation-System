import axios from 'axios';

export const api = axios.create({
  withCredentials: true, 
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized, logging out...');
      window.dispatchEvent(new CustomEvent('auth-error'));
    }
    return Promise.reject(error);
  }
);

export const signUp = (data) => api.post('/api/auth/sign-up', data);
export const activate = (email) => api.post('/api/auth/activate', { email });
export const verifyEmail = (data) => api.post('/api/auth/verify', data);
export const signIn = (credentials) => api.post('/api/auth/sign-in', credentials);
export const checkAuth = () => api.get('/api/auth/authorized');
export const logoutRequest = () => api.post('/api/auth/logout');

//mock api endpoints for future maybe
// export const resetPassword = (data) => api.post('/api/auth/reset-password', data);
// export const resetPasswordConfirm = (data) => api.post('/api/auth/reset-password-confirm', data);
// export const changePassword = (data) => api.post('/api/auth/change-password', data);