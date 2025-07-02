import { Router } from 'express';
import {
  getContacts,
  getContactsValidation,
  getContact,
  createContact,
  createContactValidation,
  updateContact,
  updateContactValidation,
  deleteContact,
  getContactMetrics,
  updateContactMetrics,
  sendEmailToContact,
  sendEmailValidation,
  getContactEmails,
  getArchivedQuotes,
} from '@/controllers/contactController';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Route pour les archives (AVANT les routes avec :id)
router.get('/archived-quotes', getArchivedQuotes);

// Routes CRUD
router.get('/', getContactsValidation, getContacts);
router.get('/:id', getContact);
router.post('/', createContactValidation, createContact);
router.put('/:id', updateContactValidation, updateContact);
router.delete('/:id', deleteContact);

// Routes spécifiques
router.get('/:id/metrics', getContactMetrics);
router.post('/:id/metrics/update', updateContactMetrics);
router.post('/:id/send-email', sendEmailValidation, sendEmailToContact);
router.get('/:id/emails', getContactEmails);

export default router;