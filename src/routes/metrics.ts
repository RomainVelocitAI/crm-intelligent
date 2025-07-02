import { Router } from 'express';
import {
  getDashboard,
  getDashboardValidation,
  getContactMetrics,
  getRevenueAnalysis,
} from '@/controllers/metricsController';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes de métriques
router.get('/dashboard', getDashboardValidation, getDashboard);
router.get('/contacts/:id', getContactMetrics);
router.get('/revenue', getRevenueAnalysis);

export default router;