import axios from 'axios';

export const api = axios.create({
  withCredentials: true, 
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      
      const noLogoutEndpoints = [
        '/api/auth/sign-in',
        '/api/auth/sign-up', 
        '/api/auth/verify',
        '/api/auth/activate',
        '/api/auth/authorized',
        '/api/auth/reset/request',
        '/api/auth/reset/confirm'
      ];
      
      const shouldLogout = !noLogoutEndpoints.some(endpoint => url.includes(endpoint));
      
      if (shouldLogout) {
        console.warn('Unauthorized, logging out...');
        window.dispatchEvent(new CustomEvent('auth-error'));
      } else {
        console.log('401 error for auth endpoint:', url);
      }
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


export const requestPasswordReset = (email) => api.post('/api/auth/reset/request', { email });
export const confirmPasswordReset = (data) => api.post('/api/auth/reset/confirm', data);