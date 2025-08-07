import { Router } from 'express';
import { authenticateToken, AuthRequest } from '@/middleware/auth';
import { 
  checkEnvironment, 
  testPdfDownload, 
  forceProductionEmails 
} from '@/controllers/debugController';

const router = Router();

// Routes de diagnostic (protégées)
router.get('/environment', checkEnvironment);
router.get('/test-pdf/:id', authenticateToken, testPdfDownload);
router.post('/force-production', authenticateToken, forceProductionEmails);

export default router;