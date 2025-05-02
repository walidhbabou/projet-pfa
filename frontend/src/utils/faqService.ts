import axios from 'axios';
import { api } from './api';

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: 'exams' | 'programs' | 'professors' | 'procedures' | 'orientation' | 'general';
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface FAQCreateInput {
  question: string;
  answer: string;
  category: FAQ['category'];
}

export interface FAQUpdateInput {
  question?: string;
  answer?: string;
  category?: FAQ['category'];
}

class FAQService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('fsts_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('fsts_token', token);
  }

  private getHeaders() {
    const token = localStorage.getItem('fsts_token');
    if (!token) {
      throw new Error('Token non défini. Veuillez vous connecter.');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private validateFAQData(data: FAQCreateInput | FAQUpdateInput): void {
    if ('question' in data && (typeof data.question !== 'string' || data.question.length < 5)) {
      throw new Error('La question doit contenir au moins 5 caractères');
    }
    if ('answer' in data && (typeof data.answer !== 'string' || data.answer.length < 10)) {
      throw new Error('La réponse doit contenir au moins 10 caractères');
    }
    if ('category' in data && !['exams', 'programs', 'professors', 'procedures', 'orientation', 'general'].includes(data.category)) {
      throw new Error('Catégorie invalide');
    }
  }

  async getAllFAQs(): Promise<FAQ[]> {
    try {
      const token = localStorage.getItem('fsts_token');
      if (!token) {
        throw new Error('Token non défini. Veuillez vous connecter.');
      }

      const response = await api.get('/faq', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.data.success || !Array.isArray(response.data.faqs)) {
        console.error('Format de réponse invalide:', response.data);
        return [];
      }

      return response.data.faqs;
    } catch (error) {
      console.error('Erreur lors de la récupération des FAQs:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem('fsts_token');
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des FAQs');
      }
      return [];
    }
  }

  async searchFAQs(query: string): Promise<FAQ[]> {
    try {
      const token = localStorage.getItem('fsts_token');
      if (!token) {
        throw new Error('Token non défini. Veuillez vous connecter.');
      }

      const response = await api.get(`/faq/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.data.success || !Array.isArray(response.data.results)) {
        console.error('Format de réponse invalide:', response.data);
        return [];
      }

      return response.data.results;
    } catch (error) {
      console.error('Erreur lors de la recherche des FAQs:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem('fsts_token');
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        throw new Error(error.response?.data?.message || 'Erreur lors de la recherche des FAQs');
      }
      return [];
    }
  }

  async addFAQ(faq: FAQCreateInput): Promise<FAQ> {
    try {
      this.validateFAQData(faq);

      const token = localStorage.getItem('fsts_token');
      if (!token) {
        throw new Error('Token non défini. Veuillez vous connecter.');
      }

      const response = await api.post('/admin/faq', faq, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la FAQ:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem('fsts_token');
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        } else if (error.response?.status === 403) {
          throw new Error('Accès non autorisé. Droits administrateur requis.');
        }
        throw new Error(error.response?.data?.message || 'Erreur lors de l\'ajout de la FAQ');
      }
      throw error;
    }
  }

  async updateFAQ(id: string, faq: FAQUpdateInput): Promise<FAQ> {
    try {
      this.validateFAQData(faq);

      const token = localStorage.getItem('fsts_token');
      if (!token) {
        throw new Error('Token non défini. Veuillez vous connecter.');
      }

      const response = await api.put(`/admin/faq/${id}`, faq, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la FAQ:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem('fsts_token');
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        } else if (error.response?.status === 403) {
          throw new Error('Accès non autorisé. Droits administrateur requis.');
        } else if (error.response?.status === 404) {
          throw new Error('FAQ non trouvée');
        }
        throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour de la FAQ');
      }
      throw error;
    }
  }

  async deleteFAQ(id: string): Promise<void> {
    try {
      const token = localStorage.getItem('fsts_token');
      if (!token) {
        throw new Error('Token non défini. Veuillez vous connecter.');
      }

      await api.delete(`/admin/faq/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la FAQ:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem('fsts_token');
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        } else if (error.response?.status === 403) {
          throw new Error('Accès non autorisé. Droits administrateur requis.');
        } else if (error.response?.status === 404) {
          throw new Error('FAQ non trouvée');
        }
        throw new Error(error.response?.data?.message || 'Erreur lors de la suppression de la FAQ');
      }
      throw error;
    }
  }
}

export const faqService = new FAQService();
