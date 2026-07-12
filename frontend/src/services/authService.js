import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data) {
      localStorage.setItem('ecosync_token', response.data.access_token);
      localStorage.setItem('ecosync_refresh_token', response.data.refresh_token);
      localStorage.setItem('ecosync_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('ecosync_token');
    localStorage.removeItem('ecosync_refresh_token');
    localStorage.removeItem('ecosync_user');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    if (response.data) {
      localStorage.setItem('ecosync_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};
