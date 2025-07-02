export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  entreprise?: string;
  siret?: string;
  numeroTvaIntracommunautaire?: string;
  telephone?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  pays: string;
  isPremium?: boolean;
  skipArchiveWarning?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  userId: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  entreprise?: string;
  poste?: string;
  siret?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  pays: string;
  statut: ContactStatus;
  scoreValeur: number;
  chiffresAffairesTotal: number;
  tauxConversion: number;
  panierMoyen: number;
  derniereInteraction?: string;
  dernierAchat?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ContactStatus {
  CLIENT_ACTIF = 'CLIENT_ACTIF',
  PROSPECT_CHAUD = 'PROSPECT_CHAUD',
  PROSPECT_TIEDE = 'PROSPECT_TIEDE',
  PROSPECT_FROID = 'PROSPECT_FROID',
  INACTIF = 'INACTIF',
}

export interface Quote {
  id: string;
  userId: string;
  contactId: string;
  numero: string;
  objet: string;
  statut: QuoteStatus;
  dateCreation: string;
  dateValidite: string;
  dateEnvoi?: string;
  dateAcceptation?: string;
  sousTotal: number;
  tva: number;
  total: number;
  conditions?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  contact?: Contact;
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  serviceId?: string;
  designation: string;
  description?: string;
  quantite: number;
  prixUnitaire: number;
  tauxTva: number;
  total: number;
  ordre: number;
  conserver?: boolean;
  service?: Service;
}

export enum QuoteStatus {
  BROUILLON = 'BROUILLON',
  PRET = 'PRET',
  ENVOYE = 'ENVOYE',
  VU = 'VU',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
  EXPIRE = 'EXPIRE',
  TERMINE = 'TERMINE',
  ARCHIVE = 'ARCHIVE',
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  entreprise?: string;
}

export interface AuthTokens {
  accessToken: string;
}

export interface Service {
  id: string;
  userId: string;
  nom: string;
  description?: string;
  prixUnitaire: number;
  unite: string;
  categorie?: string;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GenericEmail {
  id: string;
  contactId: string;
  userId: string;
  trackingId: string;
  subject: string;
  content: string;
  sentAt: string;
  openedAt: string | null;
  isOpened: boolean;
  openCount: number;
}

export interface UnifiedEmail {
  id: string;
  type: 'generic' | 'relance' | 'quote';
  subject: string;
  content: string;
  sentAt: string;
  openedAt: string | null;
  isOpened: boolean;
  openCount: number;
  trackingId?: string;
  relatedQuoteId?: string;
  quoteId?: string;
  quoteNumber?: string;
  quoteStatus?: QuoteStatus;
  quoteTotal?: number;
}