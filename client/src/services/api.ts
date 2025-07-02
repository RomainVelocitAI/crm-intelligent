import axios from 'axios';

const API_BASE_URL = '/api';

// Instance Axios avec configuration de base
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('velocitaleads-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types pour les API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  entreprise: string;
}

export interface ContactRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  entreprise?: string;
  poste?: string;
  siren?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  notes?: string;
}

export interface QuoteRequest {
  contactId: string;
  objet: string;
  statut?: string;
  dateValidite: string;
  conditions?: string;
  notes?: string;
  sousTotal: number;
  tva: number;
  total: number;
  items: QuoteItemRequest[];
}

export interface QuoteItemRequest {
  serviceId?: string;
  designation: string;
  description?: string;
  quantite: number;
  prixUnitaire: number;
  tauxTva?: number;
}

// Services d'authentification
export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(userData: RegisterRequest) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async updateProfile(profileData: {
    nom?: string;
    prenom?: string;
    entreprise?: string;
    siret?: string;
    numeroTvaIntracommunautaire?: string;
    telephone?: string;
    adresse?: string;
    codePostal?: string;
    ville?: string;
  }) {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
};

// Services de contacts
export const contactsService = {
  async getContacts() {
    const response = await api.get('/contacts');
    return response.data;
  },

  async getContact(id: string) {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
  },

  async createContact(contact: ContactRequest) {
    const response = await api.post('/contacts', contact);
    return response.data;
  },

  async updateContact(id: string, contact: ContactRequest) {
    const response = await api.put(`/contacts/${id}`, contact);
    return response.data;
  },

  async deleteContact(id: string) {
    const response = await api.delete(`/contacts/${id}`);
    return response.data;
  },

  async sendEmailToContact(id: string, subject: string, content: string) {
    const response = await api.post(`/contacts/${id}/send-email`, {
      subject,
      content,
    });
    return response.data;
  },

  async getContactEmails(id: string) {
    const response = await api.get(`/contacts/${id}/emails`);
    return response.data;
  },

  async updateContactMetrics(id: string) {
    const response = await api.post(`/contacts/${id}/metrics/update`);
    return response.data;
  },
};

// Services de devis
export const quotesService = {
  async getQuotes() {
    const response = await api.get('/quotes');
    return response.data;
  },

  async getQuote(id: string) {
    const response = await api.get(`/quotes/${id}`);
    return response.data;
  },

  async createQuote(quote: QuoteRequest) {
    const response = await api.post('/quotes', quote);
    return response.data;
  },

  async updateQuote(id: string, quote: QuoteRequest) {
    const response = await api.put(`/quotes/${id}`, quote);
    return response.data;
  },

  async deleteQuote(id: string) {
    const response = await api.delete(`/quotes/${id}`);
    return response.data;
  },

  async sendQuote(id: string) {
    const response = await api.post(`/quotes/${id}/send`);
    return response.data;
  },

  async duplicateQuote(id: string) {
    const response = await api.post(`/quotes/${id}/duplicate`);
    return response.data;
  },

  async getArchivedQuotes() {
    const response = await api.get('/quotes/archived');
    return response.data;
  },

  async restoreQuote(id: string, newStatus?: string) {
    const response = await api.post(`/quotes/${id}/restore`, { newStatus });
    return response.data;
  },

  async deleteArchivedQuote(id: string) {
    const response = await api.delete(`/quotes/${id}?force=true`);
    return response.data;
  },

  async updateQuoteStatus(id: string, status: string) {
    const response = await api.patch(`/quotes/${id}/status`, { status });
    return response.data;
  },

  async sendRelance(id: string, relanceData: { subject: string; content: string }) {
    const response = await api.post(`/quotes/${id}/relance`, relanceData);
    return response.data;
  },

  async validateQuote(id: string) {
    const response = await api.post(`/quotes/${id}/validate`);
    return response.data;
  },
};

// Services de services
export const servicesService = {
  async getServices() {
    const response = await api.get('/services');
    return response.data;
  },

  async createService(service: any) {
    const response = await api.post('/services', service);
    return response.data;
  },

  async updateService(id: string, service: any) {
    const response = await api.put(`/services/${id}`, service);
    return response.data;
  },

  async deleteService(id: string) {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },
};

// Services de métriques
export const metricsService = {
  async getDashboard() {
    const response = await api.get('/metrics/dashboard');
    return response.data;
  },

  async getContactMetrics(contactId: string) {
    const response = await api.get(`/metrics/contacts/${contactId}`);
    return response.data;
  },
};