import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth';
import {
  saveOnboarding,
  getUserPreferences,
  updateUserPreferences,
  saveTutorialProgress,
  getTutorialProgress,
  onboardingValidation
} from '@/controllers/onboardingController';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes onboarding
router.post('/', onboardingValidation, saveOnboarding);
router.get('/preferences', getUserPreferences);
router.put('/preferences', onboardingValidation, updateUserPreferences);

// Routes tutorial
router.post('/tutorial-progress', saveTutorialProgress);
router.get('/tutorial-progress', getTutorialProgress);

export default router;