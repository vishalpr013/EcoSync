import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ecosync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration/unauthorized errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If unauthorized (401) and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('ecosync_refresh_token');
        if (refreshToken) {
          // Attempt to refresh token
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          if (res.data?.access_token) {
            localStorage.setItem('ecosync_token', res.data.access_token);
            originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
            return axios(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh token failed or expired -> clear storage and trigger logout in app
        localStorage.removeItem('ecosync_token');
        localStorage.removeItem('ecosync_refresh_token');
        localStorage.removeItem('ecosync_user');
        window.dispatchEvent(new Event('auth_logout'));
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
