import axios, { AxiosRequestConfig, InternalAxiosRequestConfig, AxiosError } from 'axios';

// Récupérer l'URL de l'API depuis les variables d'environnement Vite ou utiliser l'URL de production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const RASA_URL = import.meta.env.VITE_RASA_URL || 'http://localhost:5005';
const IS_DEV = import.meta.env.DEV;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 seconde

console.log('Mode de développement:', IS_DEV ? 'Oui' : 'Non');
console.log('API URL configured as:', API_URL);
console.log('Rasa URL configured as:', RASA_URL);

// Configuration de base d'Axios pour l'API
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 20000,
  withCredentials: true
});

// Configuration spécifique pour Rasa
const rasaApi = axios.create({
  baseURL: RASA_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 20000,
  withCredentials: false
});

// Fonction pour vérifier si le backend est accessible
const checkBackendConnection = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`, {
      headers: {
        'Accept': 'application/json',
      },
      withCredentials: true
    });
    return response.status === 200;
  } catch (error) {
    console.warn('Backend non accessible:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

// Fonction pour attendre un certain temps
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour vérifier si le token est expiré
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Intercepteur pour ajouter le token aux requêtes et gérer les retries
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
    if (token) {
      // Ne pas vérifier l'expiration pour les routes d'authentification
      if (!config.url?.includes('/login') && !config.url?.includes('/register') && !config.url?.includes('/refresh-token')) {
        if (isTokenExpired(token)) {
          console.log('Token expiré, tentative de rafraîchissement...');
          try {
            const response = await api.post('/refresh-token');
            if (response.data.token) {
              localStorage.setItem('fsts_token', response.data.token);
              config.headers['Authorization'] = `Bearer ${response.data.token}`;
              api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            } else {
              throw new Error('Token de rafraîchissement invalide');
            }
          } catch (error) {
            console.error('Erreur lors du rafraîchissement du token:', error);
            authService.logout();
            window.location.href = '/auth';
            return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'));
          }
        } else {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      } else {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error.message);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et les retries
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (!error.config) {
      return Promise.reject(error);
    }

    const config = error.config as InternalAxiosRequestConfig & { _retry?: number };
    
    // Initialiser le compteur de retries si non défini
    config._retry = config._retry || 0;

    if (error.response) {
      // Gérer les erreurs CORS
      if (error.response.status === 0 || error.message.includes('Network Error')) {
        if (config._retry < MAX_RETRIES) {
          config._retry += 1;
          await wait(RETRY_DELAY * config._retry);
          return api(config);
        }
        return Promise.reject(new Error('Erreur de connexion au serveur.'));
      }

      // Gérer les erreurs d'authentification
      if (error.response.status === 401) {
        // Ne pas réessayer pour les routes d'authentification
        if (config.url?.includes('/login') || config.url?.includes('/register') || config.url?.includes('/refresh-token')) {
          return Promise.reject(error);
        }

        // Pour les autres routes, tenter de rafraîchir le token une seule fois
        if (config._retry === 0) {
          config._retry = 1;
          try {
            const response = await api.post('/api/refresh-token');  // Updated refresh token endpoint
            if (response.data.token) {
              localStorage.setItem('fsts_token', response.data.token);
              config.headers['Authorization'] = `Bearer ${response.data.token}`;
              return api(config);
            }
          } catch (refreshError) {
            authService.logout();
            window.location.href = '/auth';
            return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'));
          }
        }
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
    try {
      const response = await api.post('/login', { email, password });
      if (response.data.token) {
        tokenService.setToken(response.data.token);
        localStorage.setItem('fsts_user', JSON.stringify(response.data.user));
        
        // Configurer le token dans l'instance axios
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  async createAdmin(email: string, password: string, name: string) {
    const response = await api.post('/create-admin', { email, password, name });
    return response.data;
  },

  async getCurrentUser() {
    try {
      const response = await api.get('/me');
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  },

  isAuthenticated() {
    const token = tokenService.getToken();
    if (!token) return false;
    
    try {
      // Vérifier si le token est expiré
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  isAdmin() {
    const user = localStorage.getItem('fsts_user');
    if (!user) return false;
    try {
      const userData = JSON.parse(user);
      return userData.role === 'admin';
    } catch {
      return false;
    }
  },

  logout() {
    tokenService.removeToken();
    localStorage.removeItem('fsts_user');
    delete api.defaults.headers.common['Authorization'];
    // Ajoute cette ligne pour forcer la redirection
    window.location.href = '/auth';
  }
};
  
interface ChatSession {
  session_id: string;
  last_message: string;
  last_timestamp: string;
  message_count: number;
}

// Service de chat
export const chatService = {
  async sendMessage(message: string, sessionId: string) {
    try {
      if (!message || typeof message !== 'string') {
        throw new Error('Message invalide');
      }
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Session ID invalide');
      }

      // Envoyer le message au backend
      const response = await api.post('/chat', {
        message: message.trim(),
        session_id: sessionId
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          data: [{
            message: response.data.data.response,
            session_id: response.data.data.session_id
          }]
        };
      }
      
      throw new Error('Format de réponse invalide');
    } catch (error) {
      console.error('Erreur envoi message:', error);
      if (error instanceof AxiosError) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        console.error('Request config:', error.config);
      }
      throw error;
    }
  },

  async getSessions() {
    try {
      const response = await api.get('/chat/sessions');
      if (response.data && response.data.success) {
        return response.data.data.map((session: ChatSession) => ({
          id: session.session_id,
          lastMessage: session.last_message,
          lastTimestamp: session.last_timestamp,
          messageCount: session.message_count
        }));
      }
      return [];
    } catch (error) {
      console.error('Erreur récupération sessions:', error);
      return [];
    }
  },

  async getSessionMessages(sessionId: string) {
    try {
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Session ID invalide');
      }
      const response = await api.get(`/chat/history/${sessionId}`);
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Erreur récupération messages:', error);
      if (error instanceof AxiosError) {
        console.error('Axios error details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method
        });
      }
      return [];
    }
  }
};

// Service Announcements
export const announcementService = {
  getAllAnnouncements: () => api.get('/announcements'),
  addAnnouncement: (title: string, content: string) => {
    return api.post('/admin/announcement', {
      title,
      content
    });
  },
  updateAnnouncement: (id: string, title: string, content: string) =>
    api.put(`/admin/announcement/${id}`, {
      title,
      content
    }),
  deleteAnnouncement: (id: string) => api.delete(`/admin/announcement/${id}`)
};

// Service Stats
export const statsService = {
  getStats: () => api.get('/admin/stats'),
  getActivityStats: (days: number) => api.get(`/admin/stats/activity?days=${days}`),
  getUserTypeStats: () => api.get('/admin/stats/user-types'),
  getMessagesPerUser: (days: number) => api.get(`/admin/stats/messages-per-user?days=${days}`),
};

// Types pour les réponses API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface ErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface ChatSessionData {
  session_id: string;
  last_message: string;
  last_timestamp: string;
  message_count: number;
}

interface ChatMessageData {
  _id: string;
  message: string;
  response: string;
  timestamp: string;
  session_id: string;
}

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  status: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
}

interface UserStats {
  total_users: number;
  chat_count: number;
  activity_data: Array<{
    date: string;
    users: number;
    messages: number;
  }>;
  user_types: Array<{
    name: string;
    value: number;
  }>;
  faq_count: number;
}

interface DetailedStats {
  dailyStats: Array<{
    date: string;
    messageCount: number;
    userCount: number;
    avgResponseTime: number;
  }>;
}

interface Stats {
  total_users: number;
  active_users: number;
  total_conversations: number;
}

interface UserFormData {
  name: string;
  email: string;
  role: string;
}

interface AnnouncementFormData {
  title: string;
  content: string;
}

interface FormData {
  user?: UserFormData;
  announcement?: AnnouncementFormData;
}

// Service d'administration
export const adminService = {
  async getStats() {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  async getActivityStats(days: number = 30) {
    const response = await api.get(`/admin/stats/activity?days=${days}`);
    return response.data;
  },

  async getUserTypeStats() {
    const response = await api.get('/admin/stats/user-types');
    return response.data;
  },

  async getUsersPaginated(params: { page: number; limit: number; search?: string }) {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  async getAnnouncementsPaginated(params: { page: number; limit: number; search?: string }) {
    const response = await api.get('/admin/announcements', { params });
    return response.data;
  },

  async createUser(data: { name: string; email: string; password: string; role: string }) {
    const response = await api.post('/admin/users', data);
    return response.data;
  },

  async updateUser(userId: string, data: Partial<UserFormData>) {
    const response = await api.put(`/admin/users/${userId}`, data);
    return response.data;
  },

  async deleteUser(userId: string) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  async createAnnouncement(data: AnnouncementFormData) {
    const response = await api.post('/admin/announcements', data);
    return response.data;
  },

  async updateAnnouncement(announcementId: string, data: AnnouncementFormData) {
    const response = await api.put(`/admin/announcements/${announcementId}`, data);
    return response.data;
  },

  async deleteAnnouncement(announcementId: string) {
    const response = await api.delete(`/admin/announcements/${announcementId}`);
    return response.data;
  }
};

export { api };

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
const handleApiError = (error: Error | AxiosError) => {
  if (error instanceof AxiosError && error.response) {
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

export const adminExportService = {
  downloadUsersCsv: async () => {
    const token = localStorage.getItem('fsts_token');
    const response = await fetch(`${API_URL}/admin/users/export`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'utilisateurs.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadAppReportPdf: async () => {
    const token = localStorage.getItem('fsts_token');
    const response = await fetch(`${API_URL}/admin/report/pdf`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rapport_fsts.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
};
