#!/usr/bin/env node

/**
 * Script de correction pour le téléchargement PDF avec encodage Base64
 * 
 * Problème : Les PDFs sont corrompus lors du téléchargement via proxy/CDN
 * Solution : Encoder le PDF en base64 avant l'envoi
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Application de la correction PDF avec Base64...\n');

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

    // SOLUTION BASE64: Encoder le PDF en base64 pour éviter la corruption
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64PDF = pdfBuffer.toString('base64');
    
    // Nettoyer le fichier temporaire
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }
    
    // Envoyer le PDF encodé en base64
    return res.status(200).json({
      success: true,
      data: {
        fileName,
        contentType: 'application/pdf',
        content: base64PDF,
        encoding: 'base64'
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
  
  // Écrire le fichier mis à jour
  fs.writeFileSync(quoteControllerPath, updatedContent);
  console.log('✅ Fonction downloadQuotePDF mise à jour avec encodage Base64');
  
  // Créer ou mettre à jour le composant frontend pour gérer le base64
  const frontendHandlerPath = path.join(__dirname, '../client/src/utils/pdfDownload.ts');
  const frontendHandlerContent = `/**
 * Utilitaire pour télécharger un PDF encodé en Base64
 */

export const downloadBase64PDF = (response: {
  fileName: string;
  contentType: string;
  content: string;
  encoding: string;
}) => {
  try {
    // Décoder le base64
    const binaryString = atob(response.content);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Créer un blob
    const blob = new Blob([bytes], { type: response.contentType });
    
    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = response.fileName;
    
    // Déclencher le téléchargement
    document.body.appendChild(link);
    link.click();
    
    // Nettoyer
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF:', error);
    return false;
  }
};
`;
  
  // Créer le répertoire utils s'il n'existe pas
  const utilsDir = path.dirname(frontendHandlerPath);
  if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir, { recursive: true });
  }
  
  fs.writeFileSync(frontendHandlerPath, frontendHandlerContent);
  console.log('✅ Utilitaire frontend créé pour gérer le téléchargement Base64');
  
  console.log('\n📝 Instructions pour le frontend:');
  console.log('----------------------------------');
  console.log('1. Modifier l\'appel API dans le composant QuoteDetail pour utiliser JSON');
  console.log('2. Utiliser la fonction downloadBase64PDF pour traiter la réponse');
  console.log('3. Exemple d\'utilisation:');
  console.log('');
  console.log('   const response = await api.get(\`/api/quotes/\${quoteId}/download\`);');
  console.log('   if (response.data.success) {');
  console.log('     downloadBase64PDF(response.data.data);');
  console.log('   }');
  console.log('');
  
} else {
  console.error('❌ Fonction downloadQuotePDF non trouvée dans le contrôleur');
  console.log('Veuillez vérifier le fichier src/controllers/quoteController.ts');
}

console.log('\n✅ Script terminé');
console.log('📌 N\'oubliez pas de:');
console.log('   1. Tester la correction localement');
console.log('   2. Adapter le code frontend pour gérer la réponse base64');
console.log('   3. Commit et push les changements');