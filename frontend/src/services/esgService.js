import api from './api';

export const esgService = {
  // ──────────────── Environmental ────────────────
  
  // Emission Factors
  getEmissionFactors: async (params) => {
    const response = await api.get('/environmental/emission-factors', { params });
    return response.data;
  },
  createEmissionFactor: async (data) => {
    const response = await api.post('/environmental/emission-factors', data);
    return response.data;
  },
  updateEmissionFactor: async (id, data) => {
    const response = await api.put(`/environmental/emission-factors/${id}`, data);
    return response.data;
  },
  deleteEmissionFactor: async (id) => {
    const response = await api.delete(`/environmental/emission-factors/${id}`);
    return response.data;
  },

  // Carbon Transactions
  getCarbonTransactions: async (params) => {
    const response = await api.get('/environmental/carbon-transactions', { params });
    return response.data;
  },
  createCarbonTransaction: async (data) => {
    const response = await api.post('/environmental/carbon-transactions', data);
    return response.data;
  },
  updateCarbonTransaction: async (id, data) => {
    const response = await api.put(`/environmental/carbon-transactions/${id}`, data);
    return response.data;
  },
  deleteCarbonTransaction: async (id) => {
    const response = await api.delete(`/environmental/carbon-transactions/${id}`);
    return response.data;
  },
  getCarbonSummary: async (params) => {
    const response = await api.get('/environmental/carbon-transactions/summary', { params });
    return response.data;
  },

  // Products & ESG Profiles
  getProducts: async (params) => {
    const response = await api.get('/environmental/products', { params });
    return response.data;
  },
  createProduct: async (data) => {
    const response = await api.post('/environmental/products', data);
    return response.data;
  },
  updateProduct: async (id, data) => {
    const response = await api.put(`/environmental/products/${id}`, data);
    return response.data;
  },
  getProductEsgProfile: async (id) => {
    const response = await api.get(`/environmental/products/${id}/esg-profile`);
    return response.data;
  },
  updateProductEsgProfile: async (id, data) => {
    const response = await api.put(`/environmental/products/${id}/esg-profile`, data);
    return response.data;
  },

  // Environmental Goals
  getEnvironmentalGoals: async (params) => {
    const response = await api.get('/environmental/environmental-goals', { params });
    return response.data;
  },
  createEnvironmentalGoal: async (data) => {
    const response = await api.post('/environmental/environmental-goals', data);
    return response.data;
  },
  updateEnvironmentalGoal: async (id, data) => {
    const response = await api.put(`/environmental/environmental-goals/${id}`, data);
    return response.data;
  },
  recordGoalProgress: async (id, data) => {
    const response = await api.post(`/environmental/environmental-goals/${id}/progress`, data);
    return response.data;
  },

  // ──────────────── Social ────────────────
  
  // CSR Activities
  getCsrActivities: async (params) => {
    const response = await api.get('/social/csr-activities', { params });
    return response.data;
  },
  createCsrActivity: async (data) => {
    const response = await api.post('/social/csr-activities', data);
    return response.data;
  },
  getCsrActivity: async (id) => {
    const response = await api.get(`/social/csr-activities/${id}`);
    return response.data;
  },
  updateCsrActivity: async (id, data) => {
    const response = await api.put(`/social/csr-activities/${id}`, data);
    return response.data;
  },
  cancelCsrActivity: async (id) => {
    const response = await api.delete(`/social/csr-activities/${id}`);
    return response.data;
  },

  // Employee Participation
  getParticipations: async (params) => {
    const response = await api.get('/social/participations', { params });
    return response.data;
  },
  joinCsrActivity: async (data) => {
    const response = await api.post('/social/participations', data);
    return response.data;
  },
  getParticipation: async (id) => {
    const response = await api.get(`/social/participations/${id}`);
    return response.data;
  },
  approveParticipation: async (id, data) => {
    const response = await api.put(`/social/participations/${id}/approve`, data);
    return response.data;
  },
  uploadParticipationEvidence: async (id, data) => {
    const response = await api.post(`/social/participations/${id}/evidence`, data);
    return response.data;
  },
  getMyParticipations: async () => {
    const response = await api.get('/social/participations/my');
    return response.data;
  },

  // Diversity Metrics
  getDiversityMetrics: async (params) => {
    const response = await api.get('/social/diversity-metrics', { params });
    return response.data;
  },
  createDiversityMetric: async (data) => {
    const response = await api.post('/social/diversity-metrics', data);
    return response.data;
  },

  // Trainings
  getTrainings: async (params) => {
    const response = await api.get('/social/trainings', { params });
    return response.data;
  },
  createTraining: async (data) => {
    const response = await api.post('/social/trainings', data);
    return response.data;
  },
  updateTraining: async (id, data) => {
    const response = await api.put(`/social/trainings/${id}`, data);
    return response.data;
  },

  // ──────────────── Governance ────────────────
  
  // Policies
  getPolicies: async (params) => {
    const response = await api.get('/governance/policies', { params });
    return response.data;
  },
  createPolicy: async (data) => {
    const response = await api.post('/governance/policies', data);
    return response.data;
  },
  getPolicy: async (id) => {
    const response = await api.get(`/governance/policies/${id}`);
    return response.data;
  },
  updatePolicy: async (id, data) => {
    const response = await api.put(`/governance/policies/${id}`, data);
    return response.data;
  },
  acknowledgePolicy: async (id, ipAddress) => {
    const response = await api.post(`/governance/policies/${id}/acknowledge`, { ip_address: ipAddress });
    return response.data;
  },
  getPolicyAcknowledgements: async (id, params) => {
    const response = await api.get(`/governance/policies/${id}/acknowledgements`, { params });
    return response.data;
  },

  // Audits
  getAudits: async (params) => {
    const response = await api.get('/governance/audits', { params });
    return response.data;
  },
  createAudit: async (data) => {
    const response = await api.post('/governance/audits', data);
    return response.data;
  },
  getAudit: async (id) => {
    const response = await api.get(`/governance/audits/${id}`);
    return response.data;
  },
  updateAudit: async (id, data) => {
    const response = await api.put(`/governance/audits/${id}`, data);
    return response.data;
  },
  closeAudit: async (id, data) => {
    const response = await api.put(`/governance/audits/${id}/close`, data);
    return response.data;
  },

  // Compliance Issues
  getComplianceIssues: async (params) => {
    const response = await api.get('/governance/compliance-issues', { params });
    return response.data;
  },
  createComplianceIssue: async (data) => {
    const response = await api.post('/governance/compliance-issues', data);
    return response.data;
  },
  getComplianceIssue: async (id) => {
    const response = await api.get(`/governance/compliance-issues/${id}`);
    return response.data;
  },
  updateComplianceIssue: async (id, data) => {
    const response = await api.put(`/governance/compliance-issues/${id}`, data);
    return response.data;
  },
  resolveComplianceIssue: async (id, data) => {
    const response = await api.put(`/governance/compliance-issues/${id}/resolve`, data);
    return response.data;
  },
};
