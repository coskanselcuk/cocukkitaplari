import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Create axios instance with base config
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Books API
export const booksApi = {
  getAll: async (params = {}) => {
    const response = await api.get('/books', { params });
    return response.data;
  },
  
  getById: async (bookId) => {
    const response = await api.get(`/books/${bookId}`);
    return response.data;
  },
  
  getPages: async (bookId) => {
    const response = await api.get(`/books/${bookId}/pages`);
    return response.data;
  },
};

// Categories API
export const categoriesApi = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
  
  getBySlug: async (slug) => {
    const response = await api.get(`/categories/${slug}`);
    return response.data;
  },
};

// Reading Progress API
export const progressApi = {
  getUserProgress: async (userId) => {
    const response = await api.get(`/progress/${userId}`);
    return response.data;
  },
  
  saveProgress: async (userId, bookId, currentPage) => {
    const response = await api.post('/progress', {
      userId,
      bookId,
      currentPage,
    });
    return response.data;
  },
  
  markComplete: async (userId, bookId) => {
    const response = await api.post('/progress/complete', {
      userId,
      bookId,
    });
    return response.data;
  },
  
  deleteProgress: async (userId, bookId) => {
    const response = await api.delete(`/progress/${userId}/${bookId}`);
    return response.data;
  },
};

// TTS API (existing)
export const ttsApi = {
  generate: async (text) => {
    const response = await api.post('/tts/generate', { text });
    return response.data;
  },
  
  getVoices: async () => {
    const response = await api.get('/tts/voices');
    return response.data;
  },
};

// Custom Voices API
export const voicesApi = {
  getAll: async () => {
    const response = await api.get('/voices');
    return response.data;
  },
  
  create: async (voiceData) => {
    const response = await api.post('/voices', voiceData);
    return response.data;
  },
  
  update: async (voiceId, voiceData) => {
    const response = await api.put(`/voices/${voiceId}`, voiceData);
    return response.data;
  },
  
  delete: async (voiceId) => {
    const response = await api.delete(`/voices/${voiceId}`);
    return response.data;
  },
  
  verify: async (voiceId) => {
    const response = await api.post(`/voices/${voiceId}/verify`);
    return response.data;
  },
  
  setDefault: async (voiceId) => {
    const response = await api.post(`/voices/set-default/${voiceId}`);
    return response.data;
  },
  
  getDefault: async () => {
    const response = await api.get('/voices/default');
    return response.data;
  }
};

export const authApi = {
  exchangeSession: async (sessionId) => {
    const response = await api.post('/auth/session', { session_id: sessionId });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

// Notifications API
export const notificationsApi = {
  getAll: async (limit = 20, unreadOnly = false) => {
    const response = await api.get('/notifications', { 
      params: { limit, unread_only: unreadOnly } 
    });
    return response.data;
  },
  
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },
  
  markAsRead: async (notificationIds) => {
    const response = await api.post('/notifications/mark-read', { 
      notification_ids: notificationIds 
    });
    return response.data;
  },
  
  markAllAsRead: async () => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  },
  
  // Admin functions
  create: async (notification) => {
    const response = await api.post('/notifications/admin/create', notification);
    return response.data;
  },
  
  listAll: async (limit = 50) => {
    const response = await api.get('/notifications/admin/list', { params: { limit } });
    return response.data;
  },
  
  delete: async (notificationId) => {
    const response = await api.delete(`/notifications/admin/${notificationId}`);
    return response.data;
  }
};

export default api;
