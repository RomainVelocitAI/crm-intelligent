import { Router } from 'express';
import authRoutes from './auth';
import contactRoutes from './contacts';
import quoteRoutes from './quotes';
import serviceRoutes from './services';
import metricsRoutes from './metrics';
import trackingRoutes from './tracking';
import publicRoutes from './public';
import onboardingRoutes from './onboarding';

const router = Router();

// Routes d'authentification
router.use('/auth', authRoutes);

// Routes protégées
router.use('/contacts', contactRoutes);
router.use('/quotes', quoteRoutes);
router.use('/services', serviceRoutes);
router.use('/metrics', metricsRoutes);
router.use('/tracking', trackingRoutes);
router.use('/onboarding', onboardingRoutes);

export default router;