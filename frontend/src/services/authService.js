import axios from 'axios';

// Создаем инстанс axios без baseURL, чтобы использовать proxy
const api = axios.create();

export const signUp = (data) => api.post('api/auth/sign-up', data);
export const activate = (email) => api.post('api/auth/activate', { email });
export const verifyEmail = (data) => api.post('api/auth/verify', data);
export const signIn = (credentials) => api.post('api/auth/sign-in', credentials);