import axios, { AxiosRequestConfig, InternalAxiosRequestConfig, AxiosError } from 'axios';

// Récupérer l'URL de l'API depuis les variables d'environnement Vite ou utiliser une URL par défaut
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const IS_DEV = import.meta.env.DEV;

console.log('Mode de développement:', IS_DEV ? 'Oui' : 'Non');
console.log('API URL configured as:', API_URL);

// Configuration de base d'Axios
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
  withCredentials: false
});

// Fonction pour vérifier si le backend est accessible
const checkBackendConnection = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`, {
      headers: {
        'Accept': 'application/json',
      },
      withCredentials: false
    });
    return response.status === 200;
  } catch (error) {
    console.warn('Backend non accessible:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

// Intercepteur pour ajouter le token aux requêtes
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Vérifier la connexion au backend
    const isBackendAvailable = await checkBackendConnection();
    if (!isBackendAvailable && IS_DEV) {
      console.log('Backend non disponible, utilisation des données simulées');
      if (config.url?.startsWith('/admin')) {
        return Promise.reject({ 
          message: 'Backend non disponible - Mode simulation activé',
          simulation: true
        });
      }
    }

    const token = localStorage.getItem('fsts_token');
    if (token && config.headers) {
      config.headers.set('Authorization', `Bearer ${token}`);
      config.headers.set('Accept', 'application/json');
      console.log('Token added to request:', config.url);
    } else {
      console.log('No token found for request:', config.url);
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error.message);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses
api.interceptors.response.use(
  (response) => {
    console.log('Response received for:', response.config.url);
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      console.error('Response interceptor error:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
        message: error.message
      });

      // Gérer les erreurs CORS
      if (error.response.status === 0 || error.message.includes('Network Error')) {
        console.error('CORS or Network Error detected');
        return Promise.reject(new Error('Erreur de connexion au serveur. Vérifiez que le serveur est accessible et que CORS est correctement configuré.'));
      }

      // Gérer les erreurs d'authentification
      if (error.response.status === 401) {
        localStorage.removeItem('fsts_token');
        return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'));
      }
    }
    return Promise.reject(error);
  }
);

// Utilitaires de gestion du token
export const tokenService = {
  getToken: () => localStorage.getItem('fsts_token'),
  
  setToken: (token: string) => {
    localStorage.setItem('fsts_token', token);
  },
  
  removeToken: () => {
    localStorage.removeItem('fsts_token');
  },
  
  isAuthenticated: () => {
    const token = localStorage.getItem('fsts_token');
    return !!token;
  }
};

// Service d'authentification
export const authService = {
  async register(email: string, password: string, name: string) {
    const response = await api.post('/register', { email, password, name });
    if (response.data.token) {
      tokenService.setToken(response.data.token);
      localStorage.setItem('fsts_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  async login(email: string, password: string) {
    const response = await api.post('/login', { email, password });
    if (response.data.token) {
      tokenService.setToken(response.data.token);
      localStorage.setItem('fsts_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  async createAdmin(email: string, password: string, name: string) {
    const response = await api.post('/create-admin', { email, password, name });
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/me');
    return response.data;
  },

  isAuthenticated() {
    return tokenService.isAuthenticated();
  },

  isAdmin() {
    const user = localStorage.getItem('fsts_user');
    if (!user) return false;
    const userData = JSON.parse(user);
    return userData.role === 'admin';
  },

  logout() {
    tokenService.removeToken();
    localStorage.removeItem('fsts_user');
  }
};
  
// Service de chat
export const chatService = {
  async sendMessage(message: string, sessionId: string) {
    try {
      const response = await api.post('/chat', { 
        message, 
        session_id: sessionId 
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      if (IS_DEV) {
        return {
          response: "Message simulé en mode développement",
          session_id: sessionId
        };
      }
      throw error;
    }
  },

  async getSessions() {
    try {
      const response = await api.get('/chat/sessions');
      const sessions = Array.isArray(response.data) ? response.data : [];
      return sessions.map((session: any) => ({
        id: session.session_id,
        lastMessage: session.last_message,
        lastTimestamp: session.last_timestamp,
        messageCount: session.message_count
      }));
    } catch (error) {
      console.error('Error getting sessions:', error);
      if (IS_DEV) {
        return [{
          id: `session-${Date.now()}`,
          lastMessage: "Message simulé",
          lastTimestamp: new Date().toISOString(),
          messageCount: 1
        }];
      }
      return [];
    }
  },

  async getSessionMessages(sessionId: string) {
    try {
      const response = await api.get(`/chat/history/${sessionId}`);
      const messages = Array.isArray(response.data) ? response.data : [];
      return messages.map((msg: any) => ({
        id: msg._id,
        message: msg.message,
        response: msg.response,
        timestamp: msg.timestamp,
        sessionId: msg.session_id
      }));
    } catch (error) {
      console.error('Error getting session messages:', error);
      if (IS_DEV) {
        return [{
          id: `msg-${Date.now()}`,
          message: "Message simulé",
          response: "Réponse simulée",
          timestamp: new Date().toISOString(),
          sessionId: sessionId
        }];
      }
      return [];
    }
  }
};

// Service FAQ
export const faqService = {
  getAllFaqs: () => api.get('/api/faq'),
  addFaq: (question: string, answer: string, category: string) => {
    return api.post('/api/admin/faq', { 
      question, 
      answer, 
      category 
    });
  },
  updateFaq: (id: string, question: string, answer: string, category: string) =>
    api.put(`/api/admin/faq/${id}`, { 
      question, 
      answer, 
      category 
    }),
  deleteFaq: (id: string) => api.delete(`/api/admin/faq/${id}`)
};

// Service d'administration
export const adminService = {
  async getStats(period: string = 'month') {
    try {
      const token = localStorage.getItem('fsts_token');
      const userStr = localStorage.getItem('fsts_user');
      
      if (!token || !userStr) {
        throw new Error('Authentication required');
      }

      const user = JSON.parse(userStr);
      if (user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      const response = await api.get(`/admin/stats?period=${period}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting admin stats:', error);
      throw error;
    }
  },

  async getDetailedStats(period: string = 'month') {
    try {
      const response = await api.get(`/admin/stats/detailed?period=${period}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting detailed stats:', error);
      throw error;
    }
  },

  async getUserTypes() {
    try {
      const response = await api.get('/admin/stats/user-types');
      return response.data;
    } catch (error: any) {
      console.error('Error getting user types:', error);
      if (IS_DEV || error.message === 'Network Error' || error.simulation) {
        return [
          { type: "Étudiants", count: 70 },
          { type: "Enseignants", count: 15 },
          { type: "Administration", count: 10 },
          { type: "Autres", count: 5 }
        ];
      }
      throw error;
    }
  },

  getUsers: async () => {
    const response = await api.get('/admin/users', {
      headers: {
        Authorization: `Bearer ${tokenService.getToken()}`,
      },
    });
    return response.data;
  },

  updateUser: async (userId: string, userData: any) => {
    const response = await api.put(
      `/admin/users/${userId}`,
      userData,
      {
        headers: {
          Authorization: `Bearer ${tokenService.getToken()}`,
        },
      }
    );
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete(`/admin/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${tokenService.getToken()}`,
      },
    });
    return response.data;
  }
};

export const updateProfile = async (data: { name: string; email: string }) => {
  try {
    const token = localStorage.getItem('fsts_token');
    if (!token) throw new Error('Non authentifié');

    const response = await fetch(`${API_URL}/update-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour du profil');
    }

    const updatedUser = await response.json();
    localStorage.setItem('fsts_user', JSON.stringify(updatedUser));
    return updatedUser;
  } catch (error) {
    console.error('Erreur updateProfile:', error);
    throw error;
  }
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
  try {
    const token = localStorage.getItem('fsts_token');
    if (!token) throw new Error('Non authentifié');

    const response = await fetch(`${API_URL}/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors du changement de mot de passe');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur changePassword:', error);
    throw error;
  }
};

// Fonction utilitaire pour gérer les erreurs API
const handleApiError = (error: any) => {
  if (error.response) {
    throw new Error(error.response.data.detail || 'Une erreur est survenue');
  }
  throw error;
};

interface AnnouncementData {
  title: string;
  content: string;
  type: string;
}

export const createAnnouncement = async (data: AnnouncementData) => {
  try {
    const response = await api.post('/announcements', {
      title: data.title,
      content: data.content,
      type: data.type || 'info'
    });
    return response.data;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
};
