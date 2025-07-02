import crypto from 'crypto';

// Générer un ID unique
export const generateId = (length: number = 12): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Générer un token sécurisé
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('base64url');
};

// Formater un montant en euros
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

// Formater une date en français
export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat('fr-FR', options || defaultOptions).format(date);
};

// Formater une date courte
export const formatShortDate = (date: Date): string => {
  return formatDate(date, { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Formater une date avec heure
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Calculer la différence en jours entre deux dates
export const daysDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Vérifier si une date est dans le futur
export const isFutureDate = (date: Date): boolean => {
  return date.getTime() > Date.now();
};

// Vérifier si une date est expirée
export const isExpired = (date: Date): boolean => {
  return date.getTime() < Date.now();
};

// Nettoyer et capitaliser un nom
export const capitalizeName = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Nettoyer un email
export const cleanEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

// Générer un slug à partir d'un texte
export const generateSlug = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Supprimer tirets multiples
    .replace(/^-|-$/g, ''); // Supprimer tirets au début et à la fin
};

// Calculer un pourcentage
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100; // Arrondir à 2 décimales
};

// Générer une couleur à partir d'un texte (pour les avatars)
export const generateColorFromText = (text: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D2B4DE'
  ];
  
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Obtenir les initiales d'un nom
export const getInitials = (firstName: string, lastName: string): string => {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName.charAt(0).toUpperCase();
  return `${first}${last}`;
};

// Masquer partiellement un email
export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  if (username.length <= 2) return email;
  
  const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
};

// Valider un numéro SIRET français
export const validateSiret = (siret: string): boolean => {
  if (!/^[0-9]{14}$/.test(siret)) return false;
  
  // Algorithme de validation SIRET (Luhn modifié)
  const digits = siret.split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < digits.length; i++) {
    let digit = digits[i];
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit = Math.floor(digit / 10) + (digit % 10);
    }
    sum += digit;
  }
  
  return sum % 10 === 0;
};

// Formater un numéro de téléphone français
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('33')) {
    // Numéro international (+33)
    const national = cleaned.substring(2);
    return `+33 ${national.substring(0, 1)} ${national.substring(1, 3)} ${national.substring(3, 5)} ${national.substring(5, 7)} ${national.substring(7, 9)}`;
  } else if (cleaned.length === 10 && cleaned.startsWith('0')) {
    // Numéro national (0X XX XX XX XX)
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`;
  }
  
  return phone; // Retourner tel quel si format non reconnu
};

// Sanitiser une chaîne pour éviter les injections
export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Supprimer < et >
    .replace(/javascript:/gi, '') // Supprimer javascript:
    .replace(/on\w+=/gi, '') // Supprimer les handlers d'événements
    .trim();
};

// Générer un mot de passe temporaire
export const generateTempPassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

// Calculer l'âge à partir d'une date de naissance
export const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Débouncer une fonction
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttler une fonction
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Convertir des octets en format lisible
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Vérifier si un objet est vide
export const isEmpty = (obj: any): boolean => {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  if (typeof obj === 'string') return obj.trim().length === 0;
  return false;
};

// Retarder l'exécution
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export default {
  generateId,
  generateSecureToken,
  formatCurrency,
  formatDate,
  formatShortDate,
  formatDateTime,
  daysDifference,
  isFutureDate,
  isExpired,
  capitalizeName,
  cleanEmail,
  generateSlug,
  calculatePercentage,
  generateColorFromText,
  getInitials,
  maskEmail,
  validateSiret,
  formatPhoneNumber,
  sanitizeString,
  generateTempPassword,
  calculateAge,
  debounce,
  throttle,
  formatBytes,
  isEmpty,
  sleep,
};