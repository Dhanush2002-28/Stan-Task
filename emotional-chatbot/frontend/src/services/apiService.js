import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '/api',
    timeout: 30000, // 30 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for logging and auth
api.interceptors.request.use(
    (config) => {
        // Log requests in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data);
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        // Log successful responses in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }
        return response;
    },
    (error) => {
        // Enhanced error handling
        console.error('API Error:', error);

        if (error.code === 'ECONNABORTED') {
            error.message = 'Request timeout. Please check your connection and try again.';
        } else if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;
            error.message = data?.message || `Server error (${status})`;
        } else if (error.request) {
            // Request was made but no response received
            error.message = 'Unable to connect to server. Please check your internet connection.';
        }

        return Promise.reject(error);
    }
);

const apiService = {
    // Health check
    async checkHealth() {
        try {
            const response = await api.get('/health');
            return response.data;
        } catch (error) {
            throw new Error('Health check failed');
        }
    },

    // Chat endpoints
    async sendMessage(messageData) {
        try {
            const response = await api.post('/chat/message', messageData);
            return response.data.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to send message');
        }
    },

    async identifyUser(identificationData) {
        try {
            const response = await api.post('/chat/identify', identificationData);
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to identify user');
        }
    },

    async getConversationHistory(userId, limit = 50) {
        try {
            const response = await api.get(`/chat/history/${userId}`, {
                params: { limit }
            });
            return response.data.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null; // No conversation history found
            }
            throw new Error(error.message || 'Failed to load conversation history');
        }
    },

    async getConversationSessions(userId, page = 1, limit = 20) {
        try {
            const response = await api.get(`/chat/sessions/${userId}`, {
                params: { page, limit }
            });
            return response.data.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to load conversation sessions');
        }
    },

    async sendFeedback(feedbackData) {
        try {
            const response = await api.post('/chat/feedback', feedbackData);
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to send feedback');
        }
    },

    async deleteSession(userId, sessionId) {
        try {
            const response = await api.delete(`/chat/session/${userId}/${sessionId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to delete session');
        }
    },

    // User endpoints
    async getUserProfile(userId) {
        try {
            const response = await api.get(`/user/profile/${userId}`);
            return response.data.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null; // User not found, will be created
            }
            throw new Error(error.message || 'Failed to load user profile');
        }
    },

    async updateUserProfile(userId, profileData) {
        try {
            const response = await api.put(`/user/profile/${userId}`, profileData);
            return response.data.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to update user profile');
        }
    },

    async updateUserPreferences(userId, preferences) {
        try {
            const response = await api.post(`/user/preferences/${userId}`, preferences);
            return response.data.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to update preferences');
        }
    },

    async getUserAnalytics(userId, timeframe = 'all') {
        try {
            const response = await api.get(`/user/analytics/${userId}`, {
                params: { timeframe }
            });
            return response.data.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to load user analytics');
        }
    },

    async updateUserMood(userId, emotion, context) {
        try {
            const response = await api.post(`/user/mood/${userId}`, {
                emotion,
                context
            });
            return response.data.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to update mood');
        }
    },

    async deleteUserProfile(userId) {
        try {
            const response = await api.delete(`/user/profile/${userId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to delete user profile');
        }
    },

    // Memory endpoints
    async getUserMemories(userId, options = {}) {
        try {
            const { type, importance, page = 1, limit = 20, sortBy = 'importance', tags, search } = options;
            const params = { page, limit, sortBy };

            if (type) params.type = type;
            if (importance) params.importance = importance;
            if (tags) params.tags = Array.isArray(tags) ? tags.join(',') : tags;
            if (search) params.search = search;

            const response = await api.get(`/memory/${userId}`, { params });
            return response.data.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to load memories');
        }
    },

    async createMemory(userId, memoryData) {
        try {
            const response = await api.post(`/memory/${userId}`, memoryData);
            return response.data.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to create memory');
        }
    },

    async updateMemory(memoryId, updateData) {
        try {
            const response = await api.put(`/memory/${memoryId}`, updateData);
            return response.data.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to update memory');
        }
    },

    async deleteMemory(memoryId) {
        try {
            const response = await api.delete(`/memory/${memoryId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to delete memory');
        }
    },

    async getMemoryAnalytics(userId) {
        try {
            const response = await api.get(`/memory/${userId}/analytics`);
            return response.data.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to load memory analytics');
        }
    },

    async getRelevantMemories(userId, context) {
        try {
            const params = {};
            if (context.emotion) params.emotion = context.emotion;
            if (context.topics) params.topics = Array.isArray(context.topics) ? context.topics.join(',') : context.topics;
            if (context.conversationType) params.conversationType = context.conversationType;
            if (context.limit) params.limit = context.limit;

            const response = await api.get(`/memory/${userId}/relevant`, { params });
            return response.data.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to load relevant memories');
        }
    },

    async cleanupMemories(userId) {
        try {
            const response = await api.post(`/memory/${userId}/cleanup`);
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to cleanup memories');
        }
    },

    async getMemoryTypes() {
        try {
            const response = await api.get('/memory/types');
            return response.data.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to load memory types');
        }
    },

    async searchMemories(userId, query, filters = {}) {
        try {
            const response = await api.post(`/memory/${userId}/search`, {
                query,
                filters
            });
            return response.data.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to search memories');
        }
    },

    // Utility methods
    async uploadFile(file, type = 'general') {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);

            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to upload file');
        }
    },

    // Error reporting
    async reportError(errorData) {
        try {
            const response = await api.post('/error-report', {
                ...errorData,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
            });
            return response.data;
        } catch (error) {
            console.error('Failed to report error:', error);
        }
    }
};

export default apiService;
