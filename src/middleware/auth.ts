import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '@/config';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    isPremium: boolean;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès manquant',
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        isPremium: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    logger.error('Erreur d\'authentification:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token expiré',
        code: 'TOKEN_EXPIRED',
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide',
        code: 'TOKEN_INVALID',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const requirePremium = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.isPremium) {
    return res.status(403).json({
      success: false,
      message: 'Fonctionnalité réservée aux utilisateurs Premium',
      code: 'PREMIUM_REQUIRED',
    });
  }
  
  return next();
};

// Middleware optionnel pour les routes publiques qui peuvent bénéficier de l'authentification
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          isPremium: true,
        },
      });

      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // En cas d'erreur, on continue sans utilisateur authentifié
    next();
  }
};

// Utilitaires JWT
export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    { userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, config.jwt.refreshSecret) as any;
};