import { body, param, query } from 'express-validator';

// Validation pour les emails
export const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Email invalide');

// Validation pour les mots de passe
export const passwordValidation = body('password')
  .isLength({ min: 8 })
  .withMessage('Le mot de passe doit contenir au moins 8 caractères')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre');

// Validation pour les noms
export const nameValidation = (field: string) =>
  body(field)
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage(`Le ${field} doit contenir entre 2 et 50 caractères`)
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage(`Le ${field} ne peut contenir que des lettres, espaces, tirets et apostrophes`);

// Validation pour les numéros de téléphone français
export const phoneValidation = body('telephone')
  .optional()
  .matches(/^(?:(?:\+33|0)[1-9](?:[0-9]{8}))$/)
  .withMessage('Numéro de téléphone français invalide');

// Validation pour les codes postaux français
export const postalCodeValidation = body('codePostal')
  .optional()
  .matches(/^[0-9]{5}$/)
  .withMessage('Code postal français invalide (5 chiffres)');

// Validation pour les SIRET
export const siretValidation = body('siret')
  .optional()
  .matches(/^[0-9]{14}$/)
  .withMessage('Numéro SIRET invalide (14 chiffres)');

// Validation pour les montants
export const amountValidation = (field: string) =>
  body(field)
    .isFloat({ min: 0 })
    .withMessage(`Le ${field} doit être un nombre positif`);

// Validation pour les quantités
export const quantityValidation = body('quantite')
  .isFloat({ min: 0.01 })
  .withMessage('La quantité doit être supérieure à 0');

// Validation pour les IDs
export const idValidation = param('id')
  .isString()
  .isLength({ min: 1 })
  .withMessage('ID invalide');

// Validation pour les dates
export const dateValidation = (field: string) =>
  body(field)
    .isISO8601()
    .withMessage(`Date ${field} invalide`);

// Validation pour la pagination
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un entier positif'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
];

// Validation pour les recherches
export const searchValidation = query('search')
  .optional()
  .trim()
  .isLength({ max: 100 })
  .withMessage('La recherche ne peut pas dépasser 100 caractères');

// Validation pour les URLs
export const urlValidation = (field: string) =>
  body(field)
    .optional()
    .isURL()
    .withMessage(`URL ${field} invalide`);

// Validation pour les statuts d'énumération
export const enumValidation = (field: string, enumValues: string[]) =>
  body(field)
    .optional()
    .isIn(enumValues)
    .withMessage(`Valeur ${field} invalide. Valeurs autorisées: ${enumValues.join(', ')}`);

// Validation pour les tableaux
export const arrayValidation = (field: string, minItems: number = 1) =>
  body(field)
    .isArray({ min: minItems })
    .withMessage(`${field} doit être un tableau avec au moins ${minItems} élément(s)`);

// Validation pour les objets imbriqués (items de devis)
export const quoteItemsValidation = [
  arrayValidation('items'),
  body('items.*.designation')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('La désignation est requise et ne peut pas dépasser 200 caractères'),
  body('items.*.description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La description ne peut pas dépasser 500 caractères'),
  body('items.*.quantite')
    .isFloat({ min: 0.01 })
    .withMessage('La quantité doit être supérieure à 0'),
  body('items.*.prixUnitaire')
    .isFloat({ min: 0 })
    .withMessage('Le prix unitaire doit être positif'),
];

export default {
  emailValidation,
  passwordValidation,
  nameValidation,
  phoneValidation,
  postalCodeValidation,
  siretValidation,
  amountValidation,
  quantityValidation,
  idValidation,
  dateValidation,
  paginationValidation,
  searchValidation,
  urlValidation,
  enumValidation,
  arrayValidation,
  quoteItemsValidation,
};