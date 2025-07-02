import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { logger } from '@/utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Route publique pour télécharger un devis avec token
router.get('/quote/:token/download', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Décoder le token (format: base64(quoteId:timestamp))
    let quoteId: string;
    let timestamp: number;
    
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [id, ts] = decoded.split(':');
      quoteId = id;
      timestamp = parseInt(ts);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide',
      });
    }

    // Vérifier que le token n'est pas expiré (7 jours)
    const now = Date.now();
    const tokenAge = now - timestamp;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes

    if (tokenAge > maxAge) {
      return res.status(410).json({
        success: false,
        message: 'Le lien de téléchargement a expiré',
      });
    }

    // Récupérer le devis
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        contact: true,
        user: true,
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // Chercher le fichier PDF le plus récent pour ce devis
    const uploadsDir = './uploads/pdfs';
    const files = fs.readdirSync(uploadsDir);
    const quoteFiles = files.filter(file => 
      file.includes(`Devis_${quote.numero}_`) && file.endsWith('.pdf')
    );

    if (quoteFiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fichier PDF non trouvé',
      });
    }

    // Prendre le fichier le plus récent
    const latestFile = quoteFiles.sort().pop();
    const filePath = path.join(uploadsDir, latestFile!);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier PDF non trouvé',
      });
    }

    // Enregistrer l'accès au devis
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        statut: quote.statut === 'ENVOYE' ? 'VU' : quote.statut,
      },
    });

    // Créer une interaction
    await prisma.interaction.create({
      data: {
        contactId: quote.contactId,
        type: 'AUTRE',
        objet: `Devis ${quote.numero} consulté`,
        description: 'Le client a téléchargé le devis',
      },
    });

    logger.info('Téléchargement public de devis', {
      quoteId,
      numero: quote.numero,
      contactEmail: quote.contact?.email || 'N/A',
    });

    // Envoyer le fichier
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Devis_${quote.numero}.pdf"`);
    return res.sendFile(path.resolve(filePath));

  } catch (error) {
    logger.error('Erreur lors du téléchargement public de devis:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
});

export default router;