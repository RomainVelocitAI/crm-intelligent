import { Router } from 'express';
import {
  getQuotes,
  getQuotesValidation,
  getQuote,
  createQuote,
  createQuoteValidation,
  updateQuote,
  updateQuoteValidation,
  deleteQuote,
  sendQuote,
  duplicateQuote,
  testQuotePDF,
  getArchivedQuotes,
  restoreQuote,
  legalArchiveQuote,
  sendQuoteRelance,
  sendQuoteRelanceValidation,
  validateQuote,
  updateQuoteStatus,
} from '@/controllers/quoteController';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes d'archivage (AVANT les routes avec :id)
router.get('/archived', getArchivedQuotes);

// Routes CRUD
router.get('/', getQuotesValidation, getQuotes);
router.get('/:id', getQuote);
router.post('/', createQuoteValidation, createQuote);
router.put('/:id', updateQuoteValidation, updateQuote);
router.delete('/:id', deleteQuote);

// Routes spécifiques
router.post('/:id/validate', validateQuote);
router.post('/:id/send', sendQuote);
router.post('/:id/duplicate', duplicateQuote);
router.post('/:id/test-pdf', testQuotePDF);
router.post('/:id/restore', restoreQuote);
router.post('/:id/legal-archive', legalArchiveQuote);
router.post('/:id/relance', sendQuoteRelanceValidation, sendQuoteRelance);
router.patch('/:id/status', updateQuoteStatus);

export default router;