import axios from 'axios';

// Создаем инстанс axios без baseURL, чтобы использовать proxy
export const api = axios.create();

api.interceptors.request.use(config => {
  const token = getCookie('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log('No token found'); 
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
      if (error.response?.status === 401) {
        logout(); 
      }

      return Promise.reject(error);
  }
);

function getCookie(name) {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === name) return value;
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export const logout = () => {
    deleteCookie('token');
    window.location.href = '/login';
};


export const signUp = (data) => api.post('api/auth/sign-up', data);
export const activate = (email) => api.post('api/auth/activate', { email });
export const verifyEmail = (data) => api.post('api/auth/verify', data);
export const signIn = (credentials) => api.post('api/auth/sign-in', credentials);