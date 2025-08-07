// Contrôleur de debug pour diagnostiquer les problèmes en production
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '@/middleware/auth';
import { logger } from '@/utils/logger';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Endpoint de diagnostic environnement
export const checkEnvironment = async (req: Request, res: Response) => {
  try {
    const diagnostics = {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        RENDER: process.env.RENDER,
        FORCE_PRODUCTION_EMAIL: process.env.FORCE_PRODUCTION_EMAIL,
        TEST_EMAIL: process.env.TEST_EMAIL,
        RESEND_API_KEY_EXISTS: !!process.env.RESEND_API_KEY,
        RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
      },
      server: {
        platform: process.platform,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      },
      database: {
        connected: false,
        userCount: 0,
        quoteCount: 0,
      },
      filesystem: {
        uploadsDir: false,
        pdfsDir: false,
      }
    };

    // Test connexion DB
    try {
      const userCount = await prisma.user.count();
      const quoteCount = await prisma.quote.count();
      diagnostics.database.connected = true;
      diagnostics.database.userCount = userCount;
      diagnostics.database.quoteCount = quoteCount;
    } catch (dbError) {
      logger.error('Database connection error:', dbError);
    }

    // Test filesystem
    const uploadsPath = path.join(process.cwd(), 'uploads');
    const pdfsPath = path.join(process.cwd(), 'uploads', 'pdfs');
    
    diagnostics.filesystem.uploadsDir = fs.existsSync(uploadsPath);
    diagnostics.filesystem.pdfsDir = fs.existsSync(pdfsPath);

    return res.json({
      success: true,
      diagnostics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error in checkEnvironment:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du diagnostic',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Endpoint pour tester le téléchargement PDF avec différentes méthodes
export const testPdfDownload = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { method = 'stream' } = req.query;

    // Récupérer le devis
    const quote = await prisma.quote.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      select: {
        numero: true,
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // Créer un PDF de test simple
    const testContent = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF ${quote.numero}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
0000000312 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
405
%%EOF`);

    const fileName = `Test_${quote.numero}.pdf`;

    switch (method) {
      case 'buffer':
        // Méthode 1: Buffer direct
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', testContent.length.toString());
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('X-Download-Method', 'buffer');
        return res.send(testContent);

      case 'base64':
        // Méthode 2: Base64
        const base64 = testContent.toString('base64');
        return res.json({
          success: true,
          fileName,
          data: base64,
          method: 'base64',
        });

      case 'stream':
      default:
        // Méthode 3: Stream
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', testContent.length.toString());
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('X-Download-Method', 'stream');
        return res.end(testContent);
    }
  } catch (error) {
    logger.error('Error in testPdfDownload:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du test PDF',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Endpoint pour forcer la correction des emails en production
export const forceProductionEmails = async (req: AuthRequest, res: Response) => {
  try {
    // Forcer NODE_ENV à production pour ce processus
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.FORCE_PRODUCTION_EMAIL = 'true';

    const result = {
      before: {
        NODE_ENV: originalEnv,
        FORCE_PRODUCTION_EMAIL: process.env.FORCE_PRODUCTION_EMAIL,
      },
      after: {
        NODE_ENV: process.env.NODE_ENV,
        FORCE_PRODUCTION_EMAIL: process.env.FORCE_PRODUCTION_EMAIL,
      },
      message: 'Variables d\'environnement forcées en mode production',
    };

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    logger.error('Error in forceProductionEmails:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la correction',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export default {
  checkEnvironment,
  testPdfDownload,
  forceProductionEmails,
};