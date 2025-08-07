#!/usr/bin/env node

/**
 * Script de correction alternative pour le téléchargement PDF avec streaming binaire
 * 
 * Problème : Les PDFs sont corrompus lors du téléchargement via proxy/CDN  
 * Solution : Utiliser un streaming binaire direct avec headers optimisés
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Application de la correction PDF avec streaming alternatif...\n');

// Mise à jour du contrôleur de téléchargement PDF
const quoteControllerPath = path.join(__dirname, '../src/controllers/quoteController.ts');
const quoteControllerContent = fs.readFileSync(quoteControllerPath, 'utf-8');

// Recherche de la fonction downloadQuotePDF
const downloadFunctionRegex = /export const downloadQuotePDF = async \(req: AuthRequest, res: Response\) => \{[\s\S]*?^};$/m;

const newDownloadFunction = `export const downloadQuotePDF = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    // Récupérer le devis avec toutes les relations
    const quote = await prisma.quote.findUnique({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        user: true,
        contact: true,
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
    const pdfOptions = {
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    };

    const { pdfPath, fileName } = await generateQuotePDF(
      quote as any,
      pdfOptions
    );

    // SOLUTION ALTERNATIVE: Streaming direct avec headers optimisés
    const stream = fs.createReadStream(pdfPath);
    const stat = fs.statSync(pdfPath);
    
    // Headers spécifiques pour éviter la corruption via proxy
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stat.size.toString());
    res.setHeader('Content-Disposition', \`attachment; filename="\${fileName}"\`);
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Expires', '-1');
    res.setHeader('Pragma', 'no-cache');
    
    // Streaming direct
    stream.pipe(res);
    
    // Nettoyer après envoi
    stream.on('end', () => {
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    });
    
    stream.on('error', (error) => {
      logger.error('Erreur streaming PDF:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors du téléchargement du PDF',
        });
      }
    });
    
  } catch (error: any) {
    logger.error('Erreur downloadQuotePDF:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement du PDF',
      details: error.message,
    });
  }
};`;

// Vérifier si la fonction existe
if (downloadFunctionRegex.test(quoteControllerContent)) {
  // Remplacer la fonction existante
  const updatedContent = quoteControllerContent.replace(downloadFunctionRegex, newDownloadFunction);
  
  // Ajouter l'import fs si nécessaire
  if (!updatedContent.includes("import * as fs from 'fs'") && !updatedContent.includes("import fs from 'fs'")) {
    const importRegex = /(import[\s\S]*?from ['"].*?['"];?\n)/;
    const lastImport = updatedContent.match(importRegex);
    if (lastImport) {
      const insertPosition = updatedContent.lastIndexOf(lastImport[0]) + lastImport[0].length;
      const finalContent = updatedContent.slice(0, insertPosition) + 
                          "import * as fs from 'fs';\n" + 
                          updatedContent.slice(insertPosition);
      fs.writeFileSync(quoteControllerPath, finalContent);
    } else {
      fs.writeFileSync(quoteControllerPath, updatedContent);
    }
  } else {
    fs.writeFileSync(quoteControllerPath, updatedContent);
  }
  
  console.log('✅ Fonction downloadQuotePDF mise à jour avec streaming alternatif');
  
  // Créer un middleware Express pour forcer les headers binaires
  const middlewarePath = path.join(__dirname, '../src/middleware/binaryResponse.ts');
  const middlewareContent = `/**
 * Middleware pour forcer la réponse binaire sur certaines routes
 * Évite la corruption des fichiers binaires via proxy/CDN
 */

import { Request, Response, NextFunction } from 'express';

export const forceBinaryResponse = (req: Request, res: Response, next: NextFunction) => {
  // Sauvegarder la méthode originale
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override pour les routes de téléchargement
  if (req.path.includes('/download') || req.path.includes('/pdf')) {
    res.send = function(data: any) {
      // Forcer l'envoi binaire
      if (Buffer.isBuffer(data)) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Transfer-Encoding', 'binary');
      }
      return originalSend.call(this, data);
    };
  }
  
  next();
};
`;
  
  // Créer le répertoire middleware s'il n'existe pas
  const middlewareDir = path.dirname(middlewarePath);
  if (!fs.existsSync(middlewareDir)) {
    fs.mkdirSync(middlewareDir, { recursive: true });
  }
  
  fs.writeFileSync(middlewarePath, middlewareContent);
  console.log('✅ Middleware créé pour forcer les réponses binaires');
  
  console.log('\n📝 Instructions pour activer le middleware:');
  console.log('------------------------------------------');
  console.log('1. Dans src/index.ts ou src/app.ts, ajouter:');
  console.log('');
  console.log("   import { forceBinaryResponse } from './middleware/binaryResponse';");
  console.log('   app.use(forceBinaryResponse);');
  console.log('');
  console.log('2. Placer ce middleware AVANT les routes');
  console.log('');
  
  // Vérifier si on peut automatiquement ajouter le middleware
  const appFiles = [
    path.join(__dirname, '../src/index.ts'),
    path.join(__dirname, '../src/app.ts'),
    path.join(__dirname, '../src/server.ts')
  ];
  
  let appFile = null;
  for (const file of appFiles) {
    if (fs.existsSync(file)) {
      appFile = file;
      break;
    }
  }
  
  if (appFile) {
    console.log('📌 Fichier principal trouvé:', path.basename(appFile));
    console.log('   Vous pouvez ajouter le middleware dans ce fichier');
  }
  
} else {
  console.error('❌ Fonction downloadQuotePDF non trouvée dans le contrôleur');
  console.log('Veuillez vérifier le fichier src/controllers/quoteController.ts');
}

console.log('\n✅ Script terminé');
console.log('📌 N\'oubliez pas de:');
console.log('   1. Tester la correction localement');
console.log('   2. Vérifier que le streaming fonctionne correctement');
console.log('   3. Commit et push les changements');