import api from './api';

export const aiService = {
  getConversations: async () => {
    const response = await api.get('/ai/conversations');
    return response.data;
  },

  createConversation: async (title = 'New Conversation') => {
    const response = await api.post('/ai/conversations', { title });
    return response.data;
  },

  getConversation: async (id) => {
    const response = await api.get(`/ai/conversations/${id}`);
    return response.data;
  },

  deleteConversation: async (id) => {
    const response = await api.delete(`/ai/conversations/${id}`);
    return response.data;
  },

  // Stream reader helper for chat messages
  sendChatMessage: async (conversationId, content, onChunk) => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    const token = localStorage.getItem('ecosync_token');
    
    const response = await fetch(`${baseURL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ conversation_id: conversationId, content }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let text = '';

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      text += chunkValue;
      if (onChunk) {
        onChunk(chunkValue);
      }
    }

    return text;
  },

  generateAiReport: async (params = {}) => {
    const response = await api.post('/ai/report', params);
    return response.data;
  },

  getRecommendations: async () => {
    const response = await api.post('/ai/recommendations');
    return response.data;
  },
};
