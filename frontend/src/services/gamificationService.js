import api from './api';

export const gamificationService = {
  // Challenges
  getChallenges: async (params) => {
    const response = await api.get('/gamification/challenges', { params });
    return response.data;
  },
  createChallenge: async (data) => {
    const response = await api.post('/gamification/challenges', data);
    return response.data;
  },
  getChallenge: async (id) => {
    const response = await api.get(`/gamification/challenges/${id}`);
    return response.data;
  },
  updateChallenge: async (id, data) => {
    const response = await api.put(`/gamification/challenges/${id}`, data);
    return response.data;
  },
  updateChallengeStatus: async (id, status) => {
    const response = await api.put(`/gamification/challenges/${id}/status`, { status });
    return response.data;
  },

  // Challenge Participation
  joinChallenge: async (challengeId) => {
    const response = await api.post(`/gamification/challenges/${challengeId}/join`);
    return response.data;
  },
  updateChallengeProgress: async (participationId, progress) => {
    const response = await api.put(`/gamification/challenge-participations/${participationId}/progress`, { progress });
    return response.data;
  },
  uploadChallengeEvidence: async (participationId, data) => {
    const response = await api.post(`/gamification/challenge-participations/${participationId}/evidence`, data);
    return response.data;
  },
  approveChallengeParticipation: async (participationId, data) => {
    const response = await api.put(`/gamification/challenge-participations/${participationId}/approve`, data);
    return response.data;
  },
  getMyChallengeParticipations: async () => {
    const response = await api.get('/gamification/challenge-participations/my');
    return response.data;
  },

  // Badges
  getBadges: async (params) => {
    const response = await api.get('/gamification/badges', { params });
    return response.data;
  },
  createBadge: async (data) => {
    const response = await api.post('/gamification/badges', data);
    return response.data;
  },
  updateBadge: async (id, data) => {
    const response = await api.put(`/gamification/badges/${id}`, data);
    return response.data;
  },
  getMyBadges: async () => {
    const response = await api.get('/gamification/badges/my');
    return response.data;
  },

  // Rewards
  getRewards: async (params) => {
    const response = await api.get('/gamification/rewards', { params });
    return response.data;
  },
  createReward: async (data) => {
    const response = await api.post('/gamification/rewards', data);
    return response.data;
  },
  updateReward: async (id, data) => {
    const response = await api.put(`/gamification/rewards/${id}`, data);
    return response.data;
  },
  redeemReward: async (rewardId) => {
    const response = await api.post(`/gamification/rewards/${rewardId}/redeem`);
    return response.data;
  },
  getMyRedemptions: async () => {
    const response = await api.get('/gamification/rewards/redemptions/my');
    return response.data;
  },

  // Leaderboard
  getLeaderboard: async (params) => {
    const response = await api.get('/gamification/leaderboard', { params });
    return response.data;
  },
  getDepartmentLeaderboard: async (departmentId, params) => {
    const response = await api.get(`/gamification/leaderboard/department/${departmentId}`, { params });
    return response.data;
  },
};
