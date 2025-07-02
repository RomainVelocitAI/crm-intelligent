import { Router } from 'express';
import {
  register,
  registerValidation,
  login,
  loginValidation,
  refreshToken,
  me,
  updateProfile,
  changePassword,
} from '@/controllers/authController';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

// Routes publiques
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refreshToken);

// Routes protégées
router.get('/me', authenticateToken, me);
router.get('/profile', authenticateToken, me); // Alias pour /me
router.put('/profile', authenticateToken, updateProfile);
router.put('/password', authenticateToken, changePassword);

export default router;