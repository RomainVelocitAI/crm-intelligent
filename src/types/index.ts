// Types généraux
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Types d'authentification
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
  siret?: string;
  telephone?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  isPremium: boolean;
}

// Types de contact
export enum ContactStatus {
  CLIENT_ACTIF = 'CLIENT_ACTIF',
  PROSPECT_CHAUD = 'PROSPECT_CHAUD',
  PROSPECT_TIEDE = 'PROSPECT_TIEDE',
  PROSPECT_FROID = 'PROSPECT_FROID',
  INACTIF = 'INACTIF',
}

export interface ContactMetrics {
  chiffresAffairesTotal: number;
  tauxConversion: number;
  panierMoyen: number;
  scoreValeur: number;
}

export interface ContactCreateData {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  entreprise?: string;
  poste?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  notes?: string;
}

export interface ContactUpdateData extends Partial<ContactCreateData> {
  statut?: ContactStatus;
}

export interface ContactFilters {
  search?: string;
  statut?: ContactStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Types de devis
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

export interface QuoteItem {
  id?: string;
  serviceId?: string;
  designation: string;
  description?: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  ordre?: number;
}

export interface QuoteCreateData {
  contactId: string;
  objet: string;
  dateValidite: string;
  items: QuoteItem[];
  tva?: number;
  conditions?: string;
  notes?: string;
}

export interface QuoteUpdateData extends Partial<QuoteCreateData> {
  statut?: QuoteStatus;
}

export interface QuoteFilters {
  search?: string;
  statut?: QuoteStatus;
  contactId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Types de service
export interface ServiceCreateData {
  nom: string;
  description?: string;
  prixUnitaire: number;
  unite: string;
  categorie?: string;
}

export interface ServiceUpdateData extends Partial<ServiceCreateData> {
  actif?: boolean;
}

export interface ServiceFilters {
  search?: string;
  categorie?: string;
  actif?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ServiceStats {
  totalRevenue: number;
  totalQuantity: number;
  totalUsage: number;
  monthlyStats: Array<{
    month: string;
    revenue: number;
    quantity: number;
    count: number;
  }>;
}

// Types d'interaction
export enum InteractionType {
  EMAIL = 'EMAIL',
  TELEPHONE = 'TELEPHONE',
  REUNION = 'REUNION',
  DEVIS = 'DEVIS',
  COMMANDE = 'COMMANDE',
  AUTRE = 'AUTRE',
}

export interface InteractionCreateData {
  contactId: string;
  type: InteractionType;
  objet?: string;
  description?: string;
  date?: string;
}

// Types de métriques
export interface DashboardMetrics {
  totalContacts: number;
  totalQuotes: number;
  acceptedQuotes: number;
  totalRevenue: number;
  conversionRate: number;
  averageBasket: number;
  revenueTrend: number;
}

export interface DashboardCharts {
  contactsByStatus: Array<{
    status: ContactStatus;
    count: number;
  }>;
  quotesByStatus: Array<{
    status: QuoteStatus;
    count: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    count: number;
  }>;
}

export interface DashboardData {
  overview: DashboardMetrics;
  charts: DashboardCharts;
  recent: {
    quotes: any[];
    topContacts: any[];
  };
}

export interface ContactMetricsData {
  contact: any;
  metrics: {
    totalQuotes: number;
    acceptedQuotes: number;
    totalRevenue: number;
    conversionRate: number;
    averageBasket: number;
    totalInteractions: number;
    emailOpenRate: number;
    emailClickRate: number;
  };
  charts: {
    monthlyRevenue: Array<{
      month: string;
      revenue: number;
      count: number;
    }>;
    quotesByStatus: Array<{
      status: string;
      count: number;
    }>;
  };
  timeline: Array<{
    type: 'quote' | 'interaction';
    date: Date;
    title: string;
    description?: string;
    status?: string;
    interactionType?: string;
  }>;
}

export interface RevenueAnalysis {
  period: string;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    count: number;
  }>;
  topServices: Array<{
    serviceId: string;
    service: {
      nom: string;
      categorie?: string;
    };
    _sum: {
      total: number;
    };
    _count: {
      id: number;
    };
  }>;
  topContacts: Array<{
    contactId: string;
    contact: {
      nom: string;
      prenom: string;
      entreprise?: string;
    };
    _sum: {
      total: number;
    };
    _count: {
      id: number;
    };
  }>;
  quoteStatusAnalysis: Array<{
    statut: QuoteStatus;
    _sum: {
      total: number;
    };
    _count: {
      id: number;
    };
  }>;
  summary: {
    totalRevenue: number;
    totalQuotes: number;
    averageMonthlyRevenue: number;
  };
}

// Types d'email tracking
export interface EmailTrackingData {
  quoteId: string;
  email: string;
  ouvert: boolean;
  dateOuverture?: Date;
  nombreOuvertures: number;
  clique: boolean;
  dateClique?: Date;
  nombreCliques: number;
}

export interface EmailTrackingStats {
  quote: any;
  summary: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    openRate: number;
    clickRate: number;
    firstOpen?: Date;
    lastOpen?: Date;
  };
  details: EmailTrackingData[];
}

// Types de fichiers
export interface FileInfo {
  exists: boolean;
  size?: number;
  createdAt?: Date;
  fileName?: string;
}

// Types de configuration
export interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
  from: {
    name: string;
    address: string;
  };
}

export interface DatabaseConfig {
  url: string;
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

// Types d'erreur
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Types de requête étendus
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

// Export de tous les types
export * from '@prisma/client';