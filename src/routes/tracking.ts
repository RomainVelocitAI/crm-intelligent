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

// Fonction pour calculer un score de confiance (version plus généreuse)
const calculateConfidenceScore = (userAgent: string, referer: string, acceptHeader: string, hasJavaScript: boolean, clientIP: string): number => {
  let score = 40; // Score de base un peu plus généreux

  // Détecter bot
  const isBot = detectBot(userAgent);
  if (isBot) score -= 60; // Moins pénalisant
  
  // PÉNALITÉS STRICTES uniquement pour les cas évidents de préchargement
  // User-Agent Gmail spécifique = préchargement certain
  if (/Chrome\/42\.0\.2311\.13/i.test(userAgent)) score -= 70; // UA spécifique Gmail
  
  // Versions très anciennes ET image seule = suspect
  if (/Chrome\/[0-9]{2}\.0/i.test(userAgent) && acceptHeader.includes('image/') && !acceptHeader.includes('text/html')) {
    score -= 30;
  }
  
  // BONUS généreux pour navigation réelle
  // JavaScript activé = utilisateur réel (bonus important)
  if (hasJavaScript) score += 50;
  
  // Navigateur moderne récent (plus généreux)
  if (/Chrome\/1[2-9]\d|Firefox\/1[0-9]\d|Safari\/1[5-9]|Edge\/1[0-9]\d/i.test(userAgent)) {
    score += 30;
  }
  
  // User-Agent complexe et moderne = utilisateur réel
  if (userAgent.length > 100 && /AppleWebKit|Gecko|Mozilla/i.test(userAgent)) {
    score += 20;
  }
  
  // Accept header varié (pas seulement image) = navigation normale
  if (acceptHeader.includes('text/html') || acceptHeader.includes('application/')) {
    score += 15;
  }
  
  // Referer depuis un webmail = probable ouverture réelle
  if (referer && /mail\.google\.com|outlook|yahoo/i.test(referer)) {
    score += 30; // Bonus généreux pour webmail
  }
  
  // Si l'accès vient de Google Mail (même via proxy), c'est probablement une vraie ouverture
  if (/google/i.test(referer) || /gmail/i.test(acceptHeader) || clientIP.includes('74.125') || clientIP.includes('66.249')) {
    score += 25; // Bonus important pour les IPs Google
  }
  
  // Gmail : être plus strict avec Chrome/42.0.2311.13
  if (/Chrome\/42\.0\.2311\.13/i.test(userAgent)) {
    // Chrome/42 = probable préchargement, même avec referer Gmail
    score -= 30; // Pénalité pour Chrome/42 (préchargement très probable)
    
    // Seule exception : si JavaScript est activé, c'est plus probable qu'une vraie ouverture
    if (hasJavaScript) {
      score += 25; // Récupération partielle si JS
    }
  } else if (referer && referer.includes('mail.google.com')) {
    // Autres navigateurs avec referer Gmail = probable vraie ouverture
    score += 30;
  }

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
    
    // Mode test : bypass le scoring si paramètre test=1
    const isTestMode = req.query.test === '1';
    
    // Calculer le score de confiance
    const confidenceScore = calculateConfidenceScore(userAgent, referer, acceptHeader, hasJavaScript, clientIP);
    const isBot = detectBot(userAgent);
    
    // Seuil de confiance : 40% (équilibré)
    const CONFIDENCE_THRESHOLD = isTestMode ? 0 : 40;
    
    // NOUVELLE STRATÉGIE : Délai anti-robot de 15 secondes
    const now = new Date();
    const ANTI_BOT_DELAY_MS = 15 * 1000; // 15 secondes

    // Logger les détails pour diagnostic
    logger.info('🎯 TRACKING AMÉLIORÉ - Détails:', {
      quoteId,
      email: decodedEmail,
      scoreCalculé: confidenceScore,
      seuil: CONFIDENCE_THRESHOLD,
      estBot: isBot,
      aJavaScript: hasJavaScript,
      modeTest: isTestMode,
      userAgent: userAgent.substring(0, 100),
      acceptHeader: acceptHeader.substring(0, 50),
      referer: referer.substring(0, 50),
      clientIP
    });

    // Récupérer l'enregistrement existant pour vérifier le timestamp
    let existingTracking = null;
    try {
      existingTracking = await prisma.emailTracking.findUnique({
        where: {
          quoteId_email: {
            quoteId,
            email: decodedEmail,
          },
        },
      });
    } catch (error) {
      logger.warn('Erreur lors de la récupération du tracking existant:', error);
    }

    // Vérifier le délai anti-robot (15 secondes)
    let isWithinAntiRobotDelay = false;
    if (existingTracking && existingTracking.createdAt) {
      const timeSinceFirstAccess = now.getTime() - existingTracking.createdAt.getTime();
      isWithinAntiRobotDelay = timeSinceFirstAccess < ANTI_BOT_DELAY_MS;
      
      logger.info('⏱️ DÉLAI ANTI-ROBOT - Vérification:', {
        quoteId,
        premierAcces: existingTracking.createdAt,
        maintenant: now,
        delaiMs: timeSinceFirstAccess,
        seuilMs: ANTI_BOT_DELAY_MS,
        tropRapide: isWithinAntiRobotDelay
      });
    }

    // Enregistrer tous les accès au pixel pour diagnostic
    try {
      await prisma.emailTracking.upsert({
        where: {
          quoteId_email: {
            quoteId,
            email: decodedEmail,
          },
        },
        update: {
          nombreOuvertures: {
            increment: 1,
          },
          derniereActivite: now, // Mettre à jour le dernier accès
        },
        create: {
          quoteId,
          email: decodedEmail,
          ouvert: false, // Pas ouvert par défaut
          nombreOuvertures: 1,
          derniereActivite: now,
        },
      });
    } catch (dbError) {
      logger.warn('Erreur base de données tracking (continuons quand même):', dbError);
    }

    // Debug : Afficher les conditions avant la mise à jour
    console.log('🔍 DEBUG TRACKING - Conditions:', {
      quoteId,
      confidenceScore,
      seuil: CONFIDENCE_THRESHOLD,
      scoreOK: confidenceScore >= CONFIDENCE_THRESHOLD,
      isBot,
      tropRapide: isWithinAntiRobotDelay,
      conditionFinale: confidenceScore >= CONFIDENCE_THRESHOLD && !isBot && !isWithinAntiRobotDelay
    });

    // Mettre à jour le statut du devis SEULEMENT si toutes les conditions sont remplies
    if (confidenceScore >= CONFIDENCE_THRESHOLD && !isBot && !isWithinAntiRobotDelay) {
      console.log('✅ DEBUG - Toutes conditions remplies (score + pas bot + délai OK), recherche du devis...');
      
      try {
        // Utiliser une requête SQL directe pour éviter les problèmes de schéma
        const quote = await prisma.$queryRaw<Array<{id: string, statut: string}>>`
          SELECT id, statut FROM quotes WHERE id = ${quoteId}
        `;

        console.log('📄 DEBUG - Devis trouvé:', {
          existe: quote && quote.length > 0,
          statut: quote?.[0]?.statut,
          id: quote?.[0]?.id
        });

        if (quote && quote.length > 0 && quote[0].statut === 'ENVOYE') {
          console.log('🚀 DEBUG - Mise à jour du statut vers VU...');
          
          // Mise à jour directe en SQL
          await prisma.$executeRaw`
            UPDATE quotes SET statut = 'VU' WHERE id = ${quoteId}
          `;
          
          // Marquer aussi l'email comme ouvert maintenant qu'on est sûr
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
            },
            create: {
              quoteId,
              email: decodedEmail,
              ouvert: true,
              dateOuverture: new Date(),
              nombreOuvertures: 1,
            },
          });
          
          console.log('✅ DEBUG - Devis mis à jour avec succès vers VU');
          
          logger.info('✅ TRACKING AMÉLIORÉ - Devis marqué comme VU:', { 
            quoteId, 
            email: decodedEmail, 
            confidenceScore,
            userAgent: userAgent.substring(0, 60)
          });
        } else {
          console.log('❌ DEBUG - Devis non éligible:', {
            quoteId,
            existe: quote && quote.length > 0,
            statutActuel: quote?.[0]?.statut || 'DEVIS_NON_TROUVÉ',
            attendu: 'ENVOYE'
          });
          
          logger.info('ℹ️  TRACKING AMÉLIORÉ - Devis non trouvé ou statut incorrect:', {
            quoteId,
            statutActuel: quote?.[0]?.statut || 'DEVIS_NON_TROUVÉ'
          });
        }
      } catch (quoteError) {
        console.error('❌ DEBUG - Erreur lors de la mise à jour:', quoteError);
        logger.warn('Erreur mise à jour statut devis:', quoteError);
      }
    } else {
      console.log('❌ DEBUG - Conditions non remplies:', {
        scoreInsuffisant: confidenceScore < CONFIDENCE_THRESHOLD,
        estBot: isBot,
        score: confidenceScore,
        seuil: CONFIDENCE_THRESHOLD
      });
      
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
      'X-Tracking-Version': 'AMELIORE-V2', // Marqueur pour vérifier que le nouveau code fonctionne
      'X-Confidence-Score': confidenceScore.toString(),
      'X-Is-Bot': isBot.toString()
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

// Route pour servir et tracker les téléchargements de PDF
router.get('/pdf/:quoteId/:email/:filename', async (req, res) => {
  try {
    const { quoteId, email, filename } = req.params;
    
    // Décoder l'email (base64)
    const decodedEmail = Buffer.from(email, 'base64').toString();
    
    // Analyser les en-têtes pour déterminer si c'est un vrai téléchargement
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || '';
    const acceptHeader = req.get('Accept') || '';
    const clientIP = req.ip || req.connection.remoteAddress || '';
    
    // Mode test : bypass le scoring si paramètre test=1
    const isTestMode = req.query.test === '1';
    
    // Calculer le score de confiance pour les téléchargements PDF
    let score = 70; // Score de base plus élevé car c'est un téléchargement actif
    
    // Bonus pour navigateur réel
    if (/Chrome\/1[2-9]\d|Firefox\/1[0-9]\d|Safari\/1[5-9]|Edge\/1[0-9]\d/i.test(userAgent)) {
      score += 20;
    }
    
    // Bonus Accept PDF
    if (acceptHeader.includes('application/pdf') || acceptHeader.includes('*/*')) {
      score += 10;
    }
    
    // PÉNALITÉ si c'est un préchargement (referer Gmail + accept image)
    if (/mail\.google\.com/i.test(referer) && acceptHeader.includes('image/')) {
      score -= 50;
    }
    
    const CONFIDENCE_THRESHOLD = isTestMode ? 0 : 60;
    const shouldTrack = score >= CONFIDENCE_THRESHOLD;
    
    logger.info('📄 TRACKING PDF - Téléchargement:', {
      quoteId,
      email: decodedEmail,
      filename,
      scoreCalculé: score,
      seuil: CONFIDENCE_THRESHOLD,
      shouldTrack,
      modeTest: isTestMode,
      userAgent: userAgent.substring(0, 100),
      acceptHeader: acceptHeader.substring(0, 50),
      referer: referer.substring(0, 50),
      clientIP
    });
    
    // Mettre à jour le statut du devis si le téléchargement semble légitime
    if (shouldTrack) {
      try {
        // Mettre à jour le tracking email
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
        
        // Mettre à jour le statut du devis vers VU
        const quote = await prisma.$queryRaw<Array<{id: string, statut: string}>>`
          SELECT id, statut FROM quotes WHERE id = ${quoteId}
        `;
        
        if (quote && quote.length > 0 && quote[0].statut === 'ENVOYE') {
          await prisma.$executeRaw`
            UPDATE quotes SET statut = 'VU', "dateConsultation" = NOW() WHERE id = ${quoteId}
          `;
          
          logger.info('✅ TRACKING PDF - Devis marqué comme VU:', { 
            quoteId, 
            email: decodedEmail,
            filename,
            scoreConfiance: score
          });
        }
      } catch (dbError) {
        logger.warn('Erreur base de données tracking PDF:', dbError);
      }
    }
    
    // Servir le fichier PDF
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'uploads/pdfs', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier PDF non trouvé' });
    }
    
    // Headers pour le téléchargement PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-PDF-Tracking', shouldTrack ? 'tracked' : 'not-tracked');
    res.setHeader('X-Confidence-Score', score.toString());
    
    // Streamer le fichier
    const fileStream = fs.createReadStream(filePath);
    return fileStream.pipe(res);
    
  } catch (error) {
    logger.error('❌ TRACKING PDF - Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour le tracking des emails génériques
router.get('/email/:trackingId/:encodedEmail', async (req, res) => {
  try {
    const { trackingId, encodedEmail } = req.params;
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || '';
    const acceptHeader = req.get('Accept') || '';
    const ip = req.ip || req.connection.remoteAddress || '';
    const hasJavaScript = req.query.js === '1';
    const isTestMode = req.query.test === '1';

    // Décoder l'email
    const email = Buffer.from(encodedEmail, 'base64').toString('utf-8');

    // Calculer le score de confiance pour les emails génériques (mêmes paramètres que les devis)
    const confidenceScore = calculateConfidenceScore(userAgent, referer, acceptHeader, hasJavaScript, ip);
    const isBot = detectBot(userAgent);
    
    // Seuil de confiance identique aux devis
    const CONFIDENCE_THRESHOLD = isTestMode ? 0 : 40;
    const shouldTrack = confidenceScore >= CONFIDENCE_THRESHOLD && !isBot;

    logger.info('📧 TRACKING EMAIL GÉNÉRIQUE - Analyse:', {
      trackingId,
      email,
      scoreCalculé: confidenceScore,
      seuil: CONFIDENCE_THRESHOLD,
      estBot: isBot,
      shouldTrack,
      userAgent: userAgent.substring(0, 100),
      ip,
    });

    // Mettre à jour le tracking de l'email générique SEULEMENT si légitime
    if (shouldTrack) {
      try {
        await prisma.genericEmail.updateMany({
          where: { trackingId },
          data: {
            isOpened: true,
            openedAt: new Date(),
            openCount: {
              increment: 1,
            },
          },
        });
        
        logger.info('✅ EMAIL GÉNÉRIQUE - Marqué comme ouvert:', { 
          trackingId, 
          email,
          confidenceScore
        });
      } catch (dbError) {
        logger.error('Erreur lors de la mise à jour du tracking email générique:', dbError);
      }
    } else {
      logger.info('❌ EMAIL GÉNÉRIQUE - Non comptabilisé:', { 
        trackingId, 
        email,
        confidenceScore,
        isBot,
        reason: confidenceScore < CONFIDENCE_THRESHOLD ? 'Score trop faible' : 'Bot détecté'
      });
    }

    // Créer un pixel transparent 1x1
    const pixelBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pixelBuffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });return res.send(pixelBuffer);
  } catch (error) {
    logger.error('❌ TRACKING EMAIL GÉNÉRIQUE - Erreur:', error);
    
    // Retourner un pixel transparent même en cas d'erreur
    const pixelBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pixelBuffer.length,
    });return res.send(pixelBuffer);
  }
});

export default router;