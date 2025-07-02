import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Fonction pour détecter les bots et crawlers (plus sélective)
const detectBot = (userAgent: string, referer: string, acceptHeader: string): boolean => {
  const strictBotPatterns = [
    // Bots de sécurité email spécifiques
    /proofpoint.*email.*protection/i,
    /mimecast.*security/i,
    /barracuda.*scanner/i,
    /forcepoint.*dlp/i,
    /symantec.*email/i,
    
    // Crawlers évidents
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    
    // Outils automatisés
    /curl\/\d+/i,
    /wget\/\d+/i,
    /python-requests/i,
    /java\/\d+/i,
    /php\/\d+/i,
    
    // Scanners de sécurité spécifiques
    /security.*scanner/i,
    /vulnerability.*scanner/i,
  ];

  // Ne pas marquer comme bot si c'est un vrai navigateur avec "bot" dans le nom
  const realBrowserWithBot = /Mozilla.*Chrome.*Safari/i.test(userAgent) || 
                             /Mozilla.*Firefox/i.test(userAgent) ||
                             /Mozilla.*Safari/i.test(userAgent);

  if (realBrowserWithBot) return false;

  return strictBotPatterns.some(pattern => pattern.test(userAgent));
};

// Fonction pour détecter les préchargements automatiques (plus permissive)
const detectPreload = (userAgent: string, acceptHeader: string): boolean => {
  // Seulement les cas évidents de préchargement
  const preloadIndicators = [
    // User agents explicites de préchargement
    /prefetch/i.test(userAgent),
    /preload/i.test(userAgent),
    
    // Clients email automatisés spécifiques (pas les vrais clients)
    /outlook.*safelinks/i.test(userAgent),
    /microsoft.*protection/i.test(userAgent),
  ];

  return preloadIndicators.some(indicator => indicator);
};

// Fonction pour calculer un score de confiance (0-100) - Version équilibrée
const calculateConfidenceScore = (data: {
  userAgent: string;
  referer: string;
  acceptHeader: string;
  isBot: boolean;
  isPreload: boolean;
  hasJavaScript: boolean;
}): number => {
  let score = 60; // Score de base plus élevé

  // Pénalités MAJEURES pour les vrais problèmes
  if (data.isBot) score -= 40;
  if (data.isPreload) score -= 25;
  
  // Pénalités MINEURES pour les indicateurs suspects
  if (!data.userAgent || data.userAgent.length < 5) score -= 15;
  if (!/Mozilla/i.test(data.userAgent)) score -= 10;
  
  // Bonus pour les indicateurs positifs
  if (data.hasJavaScript) score += 20; // Bonus plus important pour JS
  if (data.referer && data.referer.length > 0) score += 10;
  
  // Vérifier les patterns de navigateurs réels
  const realBrowserPatterns = [
    /Chrome\/\d+/i,
    /Firefox\/\d+/i,
    /Safari\/\d+/i,
    /Edge\/\d+/i,
    /Opera\/\d+/i,
  ];
  
  if (realBrowserPatterns.some(pattern => pattern.test(data.userAgent))) {
    score += 25; // Bonus important pour navigateurs réels
  }

  // Bonus pour Accept headers normaux
  if (data.acceptHeader.includes('text/html')) score += 10;
  if (data.acceptHeader.includes('image/')) score += 5;

  // S'assurer que le score reste dans la plage 0-100
  return Math.max(0, Math.min(100, score));
};

// Pixel de tracking pour les emails ouverts
router.get('/pixel/:quoteId/:email', async (req, res) => {
  try {
    const { quoteId, email } = req.params;

    // Décoder l'email (base64)
    const decodedEmail = Buffer.from(email, 'base64').toString();

    // Analyser les en-têtes pour détecter les faux positifs
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || '';
    const acceptHeader = req.get('Accept') || '';
    const clientIP = req.ip || req.connection.remoteAddress || '';
    
    // Vérifier si c'est un appel JavaScript (plus fiable)
    const hasJavaScript = req.query.js === '1';
    const timestamp = req.query.t;

    // Détecter les bots et préchargements automatiques
    const isBot = detectBot(userAgent, referer, acceptHeader);
    const isPreload = detectPreload(userAgent, acceptHeader);
    
    // Calculer un score de confiance (0-100)
    const confidenceScore = calculateConfidenceScore({
      userAgent,
      referer,
      acceptHeader,
      isBot,
      isPreload,
      hasJavaScript
    });

    // Mettre à jour ou créer l'enregistrement de tracking
    const trackingData = await prisma.emailTracking.upsert({
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
        // Nouveaux champs pour l'analyse
        derniereActivite: new Date(),
        userAgent: userAgent,
        adresseIP: clientIP,
        scoreConfiance: confidenceScore,
        estBot: isBot,
        estPrechargement: isPreload,
      },
      create: {
        quoteId,
        email: decodedEmail,
        ouvert: true,
        dateOuverture: new Date(),
        nombreOuvertures: 1,
        derniereActivite: new Date(),
        userAgent: userAgent,
        adresseIP: clientIP,
        scoreConfiance: confidenceScore,
        estBot: isBot,
        estPrechargement: isPreload,
      },
    });

    // Mettre à jour le statut du devis SEULEMENT si le score de confiance est élevé
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    // Seuil de confiance : 50% minimum pour marquer comme "VU" (plus permissif)
    const CONFIDENCE_THRESHOLD = 50;
    
    if (quote && quote.statut === 'ENVOYE' && confidenceScore >= CONFIDENCE_THRESHOLD && !isBot && !isPreload) {
      await prisma.quote.update({
        where: { id: quoteId },
        data: { 
          statut: 'VU',
          dateConsultation: new Date(),
        },
      });
      
      logger.info('Devis marqué comme VU (ouverture confirmée):', { 
        quoteId, 
        email: decodedEmail, 
        confidenceScore,
        userAgent: userAgent.substring(0, 100) // Limiter la longueur pour les logs
      });
    } else {
      logger.info('Pixel chargé mais non comptabilisé comme ouverture réelle:', { 
        quoteId, 
        email: decodedEmail, 
        confidenceScore,
        isBot,
        isPreload,
        userAgent: userAgent.substring(0, 100),
        acceptHeader,
        referer,
        hasJavaScript,
        reason: confidenceScore < CONFIDENCE_THRESHOLD ? 'Score de confiance faible' : 'Bot ou préchargement détecté'
      });
    }

    // Mode debug : toujours logger les détails pour diagnostic
    logger.info('Détails du tracking:', {
      quoteId,
      email: decodedEmail,
      scoreCalculé: confidenceScore,
      seuil: CONFIDENCE_THRESHOLD,
      estBot: isBot,
      estPrechargement: isPreload,
      aJavaScript: hasJavaScript,
      userAgent: userAgent.substring(0, 150),
      acceptHeader: acceptHeader.substring(0, 100),
      referer: referer.substring(0, 100),
      marqueCommeVu: quote && quote.statut === 'ENVOYE' && confidenceScore >= CONFIDENCE_THRESHOLD && !isBot && !isPreload
    });

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
    logger.error('Erreur lors du tracking du pixel:', error);
    
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

// Tracking des clics sur les liens
router.get('/link/:quoteId/:email/:url', async (req, res) => {
  try {
    const { quoteId, email, url } = req.params;

    // Décoder l'email et l'URL
    const decodedEmail = Buffer.from(email, 'base64').toString();
    const decodedUrl = Buffer.from(url, 'base64').toString();

    // Mettre à jour ou créer l'enregistrement de tracking
    await prisma.emailTracking.upsert({
      where: {
        quoteId_email: {
          quoteId,
          email: decodedEmail,
        },
      },
      update: {
        clique: true,
        dateClique: new Date(),
        nombreCliques: {
          increment: 1,
        },
      },
      create: {
        quoteId,
        email: decodedEmail,
        clique: true,
        dateClique: new Date(),
        nombreCliques: 1,
      },
    });

    logger.info('Lien cliqué:', { quoteId, email: decodedEmail, url: decodedUrl });

    // Rediriger vers l'URL d'origine
    return res.redirect(decodedUrl);
  } catch (error) {
    logger.error('Erreur lors du tracking du lien:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du tracking',
    });
  }
});

// API pour récupérer les statistiques de tracking d'un devis
router.get('/stats/:quoteId', async (req, res) => {
  try {
    const { quoteId } = req.params;

    const trackingStats = await prisma.emailTracking.findMany({
      where: { quoteId },
      include: {
        quote: {
          select: {
            numero: true,
            objet: true,
            dateEnvoi: true,
            contact: {
              select: {
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (trackingStats.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucune donnée de tracking trouvée pour ce devis',
      });
    }

    const summary = {
      totalSent: trackingStats.length,
      totalOpened: trackingStats.filter(t => t.ouvert).length,
      totalClicked: trackingStats.filter(t => t.clique).length,
      openRate: (trackingStats.filter(t => t.ouvert).length / trackingStats.length) * 100,
      clickRate: (trackingStats.filter(t => t.clique).length / trackingStats.length) * 100,
      firstOpen: trackingStats
        .filter(t => t.dateOuverture)
        .sort((a, b) => a.dateOuverture!.getTime() - b.dateOuverture!.getTime())[0]?.dateOuverture,
      lastOpen: trackingStats
        .filter(t => t.dateOuverture)
        .sort((a, b) => b.dateOuverture!.getTime() - a.dateOuverture!.getTime())[0]?.dateOuverture,
    };return res.json({
      success: true,
      data: {
        quote: trackingStats[0].quote,
        summary,
        details: trackingStats,
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des stats de tracking:', error);return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
});

export default router;