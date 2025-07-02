import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Fonction pour détecter les bots et crawlers (version simplifiée)
const detectBot = (userAgent: string): boolean => {
  const strictBotPatterns = [
    /proofpoint.*email.*protection/i,
    /mimecast.*security/i,
    /barracuda.*scanner/i,
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /curl\/\d+/i,
    /wget\/\d+/i,
    /python-requests/i,
    /java\/\d+/i,
    /php\/\d+/i,
  ];

  // Ne pas marquer comme bot si c'est un vrai navigateur
  const realBrowserWithBot = /Mozilla.*Chrome.*Safari/i.test(userAgent) || 
                             /Mozilla.*Firefox/i.test(userAgent) ||
                             /Mozilla.*Safari/i.test(userAgent);

  if (realBrowserWithBot) return false;
  return strictBotPatterns.some(pattern => pattern.test(userAgent));
};

// Fonction pour calculer un score de confiance (version simplifiée)
const calculateConfidenceScore = (userAgent: string, referer: string, acceptHeader: string, hasJavaScript: boolean): number => {
  let score = 60; // Score de base

  // Détecter bot
  const isBot = detectBot(userAgent);
  if (isBot) score -= 40;
  
  // Bonus navigateur réel
  if (/Chrome\/\d+|Firefox\/\d+|Safari\/\d+|Edge\/\d+/i.test(userAgent)) {
    score += 25;
  }
  
  // Bonus JavaScript
  if (hasJavaScript) score += 20;
  
  // Bonus referer
  if (referer && referer.length > 0) score += 10;
  
  // Bonus Accept headers
  if (acceptHeader.includes('text/html')) score += 10;
  if (acceptHeader.includes('image/')) score += 5;

  return Math.max(0, Math.min(100, score));
};

// Pixel de tracking amélioré (version simplifiée)
router.get('/pixel/:quoteId/:email', async (req, res) => {
  try {
    const { quoteId, email } = req.params;

    // Décoder l'email (base64)
    const decodedEmail = Buffer.from(email, 'base64').toString();

    // Analyser les en-têtes
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || '';
    const acceptHeader = req.get('Accept') || '';
    const clientIP = req.ip || req.connection.remoteAddress || '';
    
    // Vérifier si c'est un appel JavaScript
    const hasJavaScript = req.query.js === '1';
    
    // Calculer le score de confiance
    const confidenceScore = calculateConfidenceScore(userAgent, referer, acceptHeader, hasJavaScript);
    const isBot = detectBot(userAgent);
    
    // Seuil de confiance : 50% minimum
    const CONFIDENCE_THRESHOLD = 50;

    // Logger les détails pour diagnostic
    logger.info('🎯 TRACKING AMÉLIORÉ - Détails:', {
      quoteId,
      email: decodedEmail,
      scoreCalculé: confidenceScore,
      seuil: CONFIDENCE_THRESHOLD,
      estBot: isBot,
      aJavaScript: hasJavaScript,
      userAgent: userAgent.substring(0, 100),
      acceptHeader: acceptHeader.substring(0, 50),
      referer: referer.substring(0, 50),
      clientIP
    });

    // Mettre à jour ou créer l'enregistrement de tracking (version basique)
    try {
      await prisma.emailTracking.upsert({
        where: {
          quoteId_email: {
            quoteId,
            email: decodedEmail,
          },
        },
        update: {
          ouvert: true,
          dateOuverture: new Date(),
          nombreOuvertures: {
            increment: 1,
          },
        },
        create: {
          quoteId,
          email: decodedEmail,
          ouvert: true,
          dateOuverture: new Date(),
          nombreOuvertures: 1,
        },
      });
    } catch (dbError) {
      logger.warn('Erreur base de données tracking (continuons quand même):', dbError);
    }

    // Mettre à jour le statut du devis SEULEMENT si le score est élevé
    if (confidenceScore >= CONFIDENCE_THRESHOLD && !isBot) {
      try {
        const quote = await prisma.quote.findUnique({
          where: { id: quoteId },
        });

        if (quote && quote.statut === 'ENVOYE') {
          await prisma.quote.update({
            where: { id: quoteId },
            data: { 
              statut: 'VU',
            },
          });
          
          logger.info('✅ TRACKING AMÉLIORÉ - Devis marqué comme VU:', { 
            quoteId, 
            email: decodedEmail, 
            confidenceScore,
            userAgent: userAgent.substring(0, 60)
          });
        } else {
          logger.info('ℹ️  TRACKING AMÉLIORÉ - Devis non trouvé ou statut incorrect:', {
            quoteId,
            statutActuel: quote?.statut || 'DEVIS_NON_TROUVÉ'
          });
        }
      } catch (quoteError) {
        logger.warn('Erreur mise à jour statut devis:', quoteError);
      }
    } else {
      logger.info('❌ TRACKING AMÉLIORÉ - Non comptabilisé:', { 
        quoteId, 
        email: decodedEmail, 
        confidenceScore,
        isBot,
        reason: confidenceScore < CONFIDENCE_THRESHOLD ? 'Score trop faible' : 'Bot détecté'
      });
    }

    // Retourner un pixel transparent 1x1
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });return res.send(pixel);
  } catch (error) {
    logger.error('❌ TRACKING AMÉLIORÉ - Erreur:', error);
    
    // Retourner un pixel même en cas d'erreur
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pixel.length,
    });return res.send(pixel);
  }
});

export default router;