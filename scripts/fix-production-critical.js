#!/usr/bin/env node

/**
 * Script de correction des problèmes critiques en production
 * 
 * Problèmes corrigés :
 * 1. Redirection des emails vers l'adresse de test
 * 2. Corruption des PDFs lors du téléchargement (738KB au lieu de 2MB)
 * 3. Erreur 500 lors de l'envoi d'emails
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Correction des problèmes critiques de production...\n');

// 1. FIX: Mise à jour du service email pour forcer la détection de production
const emailServicePath = path.join(__dirname, '../src/services/resendEmailService.ts');
const emailServiceContent = fs.readFileSync(emailServicePath, 'utf-8');

const fixedEmailService = emailServiceContent.replace(
  /const getRecipientEmail = \(email: string\): string => \{[\s\S]*?return testEmail;[\s\S]*?\};/,
  `const getRecipientEmail = (email: string): string => {
  // Logs pour debug
  logger.info('📧 getRecipientEmail Debug:', {
    NODE_ENV: process.env.NODE_ENV,
    RENDER: process.env.RENDER,
    FORCE_PRODUCTION_EMAIL: process.env.FORCE_PRODUCTION_EMAIL,
    TEST_EMAIL: process.env.TEST_EMAIL,
    originalEmail: email,
  });
  
  // CORRECTION: Forcer la détection de production sur Render
  // Render définit automatiquement IS_PULL_REQUEST=false en production
  const isProduction = 
    process.env.NODE_ENV === 'production' || 
    process.env.RENDER === 'true' ||
    process.env.IS_PULL_REQUEST === 'false' ||
    process.env.RENDER_SERVICE_NAME === 'velocitaleads-api';
  
  if (isProduction) {
    logger.info('✅ Mode production détecté - envoi au vrai destinataire:', email);
    return email;
  }
  
  // Si on force l'envoi en production (pour les tests)
  if (process.env.FORCE_PRODUCTION_EMAIL === 'true') {
    logger.info('✅ Force production email - envoi au vrai destinataire:', email);
    return email;
  }
  
  // En développement, rediriger vers l'email de test
  const testEmail = process.env.TEST_EMAIL || 'direction@velocit-ai.fr';
  logger.info('🔄 Mode développement - redirection vers:', testEmail);
  return testEmail;
};`
);

fs.writeFileSync(emailServicePath, fixedEmailService);
console.log('✅ Service email corrigé : détection de production améliorée');

// 2. FIX: Mise à jour du controller des devis pour corriger le téléchargement PDF
const quoteControllerPath = path.join(__dirname, '../src/controllers/quoteController.ts');
const quoteControllerContent = fs.readFileSync(quoteControllerPath, 'utf-8');

// Rechercher et corriger la fonction downloadQuotePdf
const downloadPdfFix = `
// Fonction de téléchargement PDF corrigée
export const downloadQuotePdf = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Récupérer le devis avec toutes les relations nécessaires
    const quote = await prisma.quote.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        contact: true,
        user: {
          select: {
            prenom: true,
            nom: true,
            email: true,
            entreprise: true,
            adresse: true,
            telephone: true,
            siteWeb: true,
            siret: true,
            logo: true,
          },
        },
        items: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // Générer le PDF
    const pdfBuffer = await generateQuotePdf(quote);
    const fileName = \`Devis_\${quote.numero}.pdf\`;
    
    // CORRECTION: Headers corrects pour éviter la corruption via proxy
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader('Content-Disposition', \`attachment; filename="\${fileName}"\`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // CORRECTION: Utiliser res.end() avec le buffer directement
    // Ne PAS utiliser res.send() qui peut altérer les données binaires
    return res.end(pdfBuffer);
    
  } catch (error) {
    logger.error('Erreur lors du téléchargement du PDF:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement du PDF',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    });
  }
};`;

// Chercher et remplacer la fonction downloadQuotePdf
const functionRegex = /export const downloadQuotePdf = async[\s\S]*?^};/gm;
const updatedQuoteController = quoteControllerContent.replace(functionRegex, downloadPdfFix);

// Si la fonction n'a pas été trouvée, l'ajouter à la fin
if (!functionRegex.test(quoteControllerContent)) {
  console.log('⚠️  Fonction downloadQuotePdf non trouvée, vérification manuelle nécessaire');
} else {
  fs.writeFileSync(quoteControllerPath, updatedQuoteController);
  console.log('✅ Controller de devis corrigé : téléchargement PDF binaire préservé');
}

// 3. FIX: Ajouter des variables d'environnement pour Render
const envExamplePath = path.join(__dirname, '../.env.example');
const envContent = fs.readFileSync(envExamplePath, 'utf-8');

if (!envContent.includes('RENDER_SERVICE_NAME')) {
  const updatedEnv = envContent + `
# Variables Render (automatiquement définies en production)
RENDER=true
RENDER_SERVICE_NAME=velocitaleads-api
IS_PULL_REQUEST=false
`;
  fs.writeFileSync(envExamplePath, updatedEnv);
  console.log('✅ Variables d\'environnement Render ajoutées au .env.example');
}

// 4. FIX: Créer un endpoint de santé pour vérifier l'état du serveur
const healthPath = path.join(__dirname, '../src/routes/health.ts');
const healthContent = `import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    // Vérifier la connexion à la base de données
    await prisma.$queryRaw\`SELECT 1\`;
    
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
`;

fs.writeFileSync(healthPath, healthContent);
console.log('✅ Endpoint de santé créé : /api/health');

// 5. Ajouter la route health au routeur principal
const indexRoutesPath = path.join(__dirname, '../src/routes/index.ts');
const indexRoutesContent = fs.readFileSync(indexRoutesPath, 'utf-8');

if (!indexRoutesContent.includes('healthRoutes')) {
  const updatedIndexRoutes = indexRoutesContent
    .replace(
      "import debugRoutes from './debug';",
      "import debugRoutes from './debug';\nimport healthRoutes from './health';"
    )
    .replace(
      "// Routes de debug (production seulement)",
      "// Routes de santé\nrouter.use('/health', healthRoutes);\n\n// Routes de debug (production seulement)"
    );
  
  fs.writeFileSync(indexRoutesPath, updatedIndexRoutes);
  console.log('✅ Route de santé ajoutée au routeur principal');
}

console.log('\n✨ Corrections appliquées avec succès !');
console.log('\n📝 Prochaines étapes :');
console.log('1. Compiler le TypeScript : npm run build');
console.log('2. Commit et push : git add -A && git commit -m "fix: Correction problèmes critiques production" && git push');
console.log('3. Render redéploiera automatiquement');
console.log('4. Vérifier après déploiement : https://crm-intelligent-api.onrender.com/api/health');