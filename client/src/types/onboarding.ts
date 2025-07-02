export interface UserPreferences {
  id: string;
  userId: string;
  businessType?: string;
  sector?: string;
  siret?: string;
  annualTarget: number;
  monthlyTarget?: number;
  followUpFrequency: number;
  emailTemplates?: any;
  notificationSettings: {
    emailAlerts: boolean;
    dashboardReminders: boolean;
    weeklyReport: boolean;
  };
  onboardingCompleted: boolean;
  tutorialProgress: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingFormData {
  businessType: string;
  sector: string;
  siret?: string;
  annualTarget: number;
  monthlyTarget?: number;
  followUpFrequency: number;
  emailTemplates?: any;
  notificationSettings: {
    emailAlerts: boolean;
    dashboardReminders: boolean;
    weeklyReport: boolean;
  };
}

export const BUSINESS_TYPES = [
  { value: 'freelance', label: 'Freelance / Auto-entrepreneur' },
  { value: 'tpe', label: 'TPE (Très Petite Entreprise)' },
  { value: 'pme', label: 'PME (Petite et Moyenne Entreprise)' },
  { value: 'sarl', label: 'SARL' },
  { value: 'sas', label: 'SAS' },
  { value: 'autre', label: 'Autre' },
];

export const SECTORS = [
  { value: 'conseil', label: 'Conseil & Consulting' },
  { value: 'design', label: 'Design & Créatif' },
  { value: 'dev', label: 'Développement & IT' },
  { value: 'marketing', label: 'Marketing & Communication' },
  { value: 'formation', label: 'Formation & Éducation' },
  { value: 'sante', label: 'Santé & Bien-être' },
  { value: 'immobilier', label: 'Immobilier' },
  { value: 'finance', label: 'Finance & Comptabilité' },
  { value: 'commerce', label: 'Commerce & Vente' },
  { value: 'autre', label: 'Autre' },
];