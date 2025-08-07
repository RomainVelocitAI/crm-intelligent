import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    // Vérifier la connexion à la base de données
    await prisma.$queryRaw`SELECT 1`;
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        RENDER: process.env.RENDER,
        IS_PULL_REQUEST: process.env.IS_PULL_REQUEST,
        RENDER_SERVICE_NAME: process.env.RENDER_SERVICE_NAME,
      },
      database: 'connected',
      version: '1.0.0',
    };
    
    return res.status(200).json(health);
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
