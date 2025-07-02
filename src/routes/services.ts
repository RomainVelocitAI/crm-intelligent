import { Router } from 'express';
import {
  getServices,
  getServicesValidation,
  getService,
  createService,
  createServiceValidation,
  updateService,
  updateServiceValidation,
  deleteService,
  getServiceCategories,
  getServiceStats,
} from '@/controllers/serviceController';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes CRUD
router.get('/', getServicesValidation, getServices);
router.get('/categories', getServiceCategories);
router.get('/:id', getService);
router.get('/:id/stats', getServiceStats);
router.post('/', createServiceValidation, createService);
router.put('/:id', updateServiceValidation, updateService);
router.delete('/:id', deleteService);

export default router;