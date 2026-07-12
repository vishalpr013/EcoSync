import api from './api';

const compactParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
);

export const dashboardService = {
  // Dashboards
  getOverviewDashboard: async () => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },
  getEnvironmentalDashboard: async () => {
    const response = await api.get('/dashboard/environmental');
    return response.data;
  },
  getSocialDashboard: async () => {
    const response = await api.get('/dashboard/social');
    return response.data;
  },
  getGovernanceDashboard: async () => {
    const response = await api.get('/dashboard/governance');
    return response.data;
  },
  getDepartmentDashboard: async (departmentId) => {
    const response = await api.get(`/dashboard/department/${departmentId}`);
    return response.data;
  },
  getEmployeeDashboard: async () => {
    const response = await api.get('/dashboard/employee');
    return response.data;
  },
  getRecentActivity: async () => {
    const response = await api.get('/dashboard/recent-activity');
    return response.data;
  },

  // Notifications
  getNotifications: async (params) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },
  markNotificationAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  markAllNotificationsAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
  getUnreadNotificationsCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  // Reports
  getReportOptions: async () => {
    const response = await api.get('/reports/options');
    return response.data;
  },
  getEnvironmentalReport: async (params) => {
    const response = await api.get('/reports/environmental', { params: compactParams(params) });
    return response.data;
  },
  getSocialReport: async (params) => {
    const response = await api.get('/reports/social', { params: compactParams(params) });
    return response.data;
  },
  getGovernanceReport: async (params) => {
    const response = await api.get('/reports/governance', { params: compactParams(params) });
    return response.data;
  },
  getExecutiveSummaryReport: async () => {
    const response = await api.get('/reports/executive-summary');
    return response.data;
  },
  generateCustomReport: async (filters) => {
    const response = await api.post('/reports/custom', { filters });
    return response.data;
  },
  exportReportUrl: (reportId, format) => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    const token = localStorage.getItem('ecosync_token');
    return `${baseURL}/reports/${reportId}/export?format=${format}&token=${token}`; // or download via api client directly
  },
  exportReportBlob: async (reportId, format) => {
    const response = await api.get(`/reports/${reportId}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};
