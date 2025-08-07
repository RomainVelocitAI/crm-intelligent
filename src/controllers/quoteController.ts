import { Response } from 'express';
import { PrismaClient, QuoteStatus } from '@prisma/client';
import { body, query, validationResult } from 'express-validator';
import { AuthRequest } from '@/middleware/auth';
import { logger } from '@/utils/logger';
import { sendQuoteEmail, sendQuoteRelanceEmail } from '@/services/resendEmailService';
import { generateQuotePDF, TemplateType } from '@/services/pdfService';
import { calculateContactMetrics, determineContactStatus } from '@/controllers/contactController';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export const createQuoteValidation = [
  body('contactId').isString().notEmpty().withMessage('ID du contact requis'),
  body('objet').trim().isLength({ min: 3 }).withMessage('L\'objet doit contenir au moins 3 caractères'),
  body('dateValidite').isISO8601().withMessage('Date de validité invalide'),
  body('items').isArray({ min: 1 }).withMessage('Au moins un élément requis'),
  body('items.*.designation').trim().isLength({ min: 1 }).withMessage('Désignation requise'),
  body('items.*.quantite').isFloat({ min: 0 }).withMessage('Quantité invalide'),
  body('items.*.prixUnitaire').isFloat({ min: 0 }).withMessage('Prix unitaire invalide'),
  body('items.*.tauxTva').optional().isFloat({ min: 0, max: 100 }).withMessage('Taux TVA invalide'),
  body('tva').optional().isFloat({ min: 0 }).withMessage('TVA invalide'),
  body('conditions').optional().trim(),
  body('notes').optional().trim(),
];

export const updateQuoteValidation = [
  body('objet').optional().trim().isLength({ min: 3 }).withMessage('L\'objet doit contenir au moins 3 caractères'),
  body('dateValidite').optional().isISO8601().withMessage('Date de validité invalide'),
  body('items').optional().isArray({ min: 1 }).withMessage('Au moins un élément requis'),
  body('items.*.designation').optional().trim().isLength({ min: 1 }).withMessage('Désignation requise'),
  body('items.*.quantite').optional().isFloat({ min: 0 }).withMessage('Quantité invalide'),
  body('items.*.prixUnitaire').optional().isFloat({ min: 0 }).withMessage('Prix unitaire invalide'),
  body('items.*.tauxTva').optional().isFloat({ min: 0, max: 100 }).withMessage('Taux TVA invalide'),
  body('tva').optional().isFloat({ min: 0 }).withMessage('TVA invalide'),
  body('statut').optional().isIn(Object.values(QuoteStatus)).withMessage('Statut invalide'),
  body('conditions').optional().trim(),
  body('notes').optional().trim(),
];

export const getQuotesValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100'),
  query('search').optional().trim(),
  query('statut').optional().isIn(Object.values(QuoteStatus)).withMessage('Statut invalide'),
  query('contactId').optional().isString().withMessage('ID du contact invalide'),
  query('sortBy').optional().isIn(['numero', 'objet', 'dateCreation', 'dateValidite', 'total', 'statut']).withMessage('Tri invalide'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Ordre de tri invalide'),
];

// Fonction pour générer un numéro de devis unique
const generateQuoteNumber = async (userId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `DEV-${year}-`;

  // Compter les devis de l'année en cours dans la table principale
  const activeCount = await prisma.quote.count({
    where: {
      userId,
      dateCreation: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  });

  // Compter les devis archivés de l'année en cours
  const archivedCount = await prisma.archivedQuote.count({
    where: {
      userId,
      dateCreation: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  });

  const totalCount = activeCount + archivedCount;
  return `${prefix}${String(totalCount + 1).padStart(4, '0')}`;
};

// Fonction pour calculer les totaux d'un devis
const calculateQuoteTotals = (items: any[]) => {
  const sousTotal = items.reduce((sum, item) => {
    return sum + (item.quantite * item.prixUnitaire);
  }, 0);

  const montantTva = items.reduce((sum, item) => {
    const itemTotal = item.quantite * item.prixUnitaire;
    const tauxTva = item.tauxTva || 20;
    return sum + (itemTotal * tauxTva) / 100;
  }, 0);

  const total = sousTotal + montantTva;

  return {
    sousTotal,
    tva: montantTva,
    total,
  };
};

export const getQuotes = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides',
        errors: errors.array(),
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const statut = req.query.statut as QuoteStatus;
    const contactId = req.query.contactId as string;
    const sortBy = (req.query.sortBy as string) || 'dateCreation';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    const skip = (page - 1) * limit;

    // Construction des filtres
    const where: any = {
      userId: req.user!.id,
    };

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { objet: { contains: search, mode: 'insensitive' } },
        { contact: { nom: { contains: search, mode: 'insensitive' } } },
        { contact: { prenom: { contains: search, mode: 'insensitive' } } },
        { contact: { entreprise: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (statut) {
      where.statut = statut;
    }

    if (contactId) {
      where.contactId = contactId;
    }

    // Récupération des devis
    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          contact: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              entreprise: true,
            },
          },
          items: {
            orderBy: { ordre: 'asc' },
          },
          emailTracking: true,
          _count: {
            select: {
              items: true,
            },
          },
        },
      }),
      prisma.quote.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        quotes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des devis:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const getQuote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        contact: true,
        items: {
          orderBy: { ordre: 'asc' },
          include: {
            service: true,
          },
        },
        emailTracking: true,
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    return res.json({
      success: true,
      data: { quote },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du devis:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const createQuote = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array(),
      });
    }

    const { contactId, objet, dateValidite, items, tva = 20, conditions, notes } = req.body;

    // Vérifier que le contact appartient à l'utilisateur
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId: req.user!.id,
      },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact non trouvé',
      });
    }

    // Générer le numéro de devis
    const numero = await generateQuoteNumber(req.user!.id);

    // Calculer les totaux
    const totals = calculateQuoteTotals(items);

    // Créer le devis
    const quote = await prisma.quote.create({
      data: {
        userId: req.user!.id,
        contactId,
        numero,
        objet,
        dateValidite: new Date(dateValidite),
        sousTotal: totals.sousTotal,
        tva: totals.tva,
        total: totals.total,
        conditions,
        notes,
        items: {
          create: items.map((item: any, index: number) => ({
            designation: item.designation,
            description: item.description,
            quantite: item.quantite,
            prixUnitaire: item.prixUnitaire,
            tauxTva: item.tauxTva || 20,
            total: item.quantite * item.prixUnitaire,
            ordre: index + 1,
            serviceId: item.serviceId,
          })),
        },
      },
      include: {
        contact: true,
        items: {
          orderBy: { ordre: 'asc' },
        },
      },
    });

    // Mettre à jour la dernière interaction du contact
    await prisma.contact.update({
      where: { id: contactId },
      data: { derniereInteraction: new Date() },
    });

    // Créer une interaction
    await prisma.interaction.create({
      data: {
        contactId,
        type: 'DEVIS',
        objet: `Devis ${numero} créé`,
        description: objet,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Devis créé avec succès',
      data: { quote },
    });
  } catch (error) {
    logger.error('Erreur lors de la création du devis:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const updateQuote = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { objet, dateValidite, items, tva, statut, conditions, notes } = req.body;

    // Vérifier que le devis appartient à l'utilisateur
    const existingQuote = await prisma.quote.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!existingQuote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // Vérifier si le devis peut être modifié
    if (existingQuote.statut === 'ACCEPTE' || existingQuote.statut === 'TERMINE') {
      return res.status(400).json({
        success: false,
        message: existingQuote.statut === 'ACCEPTE' 
          ? 'Un devis accepté ne peut pas être modifié'
          : 'Un devis terminé ne peut pas être modifié',
      });
    }

    const updateData: any = {};

    if (objet !== undefined) updateData.objet = objet;
    if (dateValidite !== undefined) updateData.dateValidite = new Date(dateValidite);
    if (conditions !== undefined) updateData.conditions = conditions;
    if (notes !== undefined) updateData.notes = notes;
    if (statut !== undefined) {
      updateData.statut = statut;
      if (statut === 'ACCEPTE') {
        updateData.dateAcceptation = new Date();
      }
      if (statut === 'ENVOYE' && !existingQuote.dateEnvoi) {
        updateData.dateEnvoi = new Date();
      }
    }

    // Si les items sont modifiés, recalculer les totaux
    if (items) {
      const totals = calculateQuoteTotals(items);
      updateData.sousTotal = totals.sousTotal;
      updateData.tva = totals.tva;
      updateData.total = totals.total;

      // Supprimer les anciens items et créer les nouveaux
      await prisma.quoteItem.deleteMany({
        where: { quoteId: id },
      });
    }

    // Mettre à jour le devis
    const quote = await prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        contact: true,
        items: {
          orderBy: { ordre: 'asc' },
        },
      },
    });

    // Mettre à jour les métriques si le statut change
    if (statut !== undefined && statut !== existingQuote.statut) {
      // Mettre à jour la dernière interaction du contact
      await prisma.contact.update({
        where: { id: existingQuote.contactId },
        data: { derniereInteraction: new Date() },
      });

      // Créer une interaction
      await prisma.interaction.create({
        data: {
          contactId: existingQuote.contactId,
          type: 'DEVIS',
          objet: `Devis ${existingQuote.numero} - Statut changé`,
          description: `Statut changé de ${existingQuote.statut} vers ${statut}`,
        },
      });

      // Mettre à jour les métriques du contact
      if (statut === 'ACCEPTE' || statut === 'REFUSE') {
        const metrics = await calculateContactMetrics(existingQuote.contactId);
        const contact = await prisma.contact.findUnique({
          where: { id: existingQuote.contactId },
        });
        
        if (contact) {
          // Mettre à jour le contact avec les nouvelles métriques
          await prisma.contact.update({
            where: { id: existingQuote.contactId },
            data: {
              ...metrics,
              dernierAchat: metrics.dernierAchat,
              statut: determineContactStatus(contact, metrics),
              derniereInteraction: new Date(),
            },
          });
        }
      }
    }

    // Créer les nouveaux items si fournis
    if (items) {
      await prisma.quoteItem.createMany({
        data: items.map((item: any, index: number) => ({
          quoteId: id,
          designation: item.designation,
          description: item.description,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
          tauxTva: item.tauxTva || 20,
          total: item.quantite * item.prixUnitaire,
          ordre: index + 1,
          serviceId: item.serviceId,
        })),
      });
    }

    // Récupérer le devis mis à jour avec les items
    const updatedQuote = await prisma.quote.findUnique({
      where: { id },
      include: {
        contact: true,
        items: {
          orderBy: { ordre: 'asc' },
        },
      },
    });

    return res.json({
      success: true,
      message: 'Devis mis à jour avec succès',
      data: { quote: updatedQuote },
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du devis:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

// Fonction pour archiver automatiquement un devis accepté (conservation légale)
export const legalArchiveQuote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Vérifier que le devis appartient à l'utilisateur et est accepté
    const quote = await prisma.quote.findFirst({
      where: {
        id,
        userId: req.user!.id,
        statut: 'ACCEPTE',
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis accepté non trouvé',
      });
    }

    // Archiver le devis pour conservation légale
    await prisma.quote.update({
      where: { id },
      data: {
        statut: 'ARCHIVE' as any,
        updatedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: 'Devis archivé pour conservation légale (10 ans)',
      action: 'legal_archived',
      legalNotice: 'Conservation obligatoire selon les articles L123-22 et R123-173 du Code de commerce'
    });

  } catch (error) {
    logger.error('Erreur lors de l\'archivage légal du devis:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const deleteQuote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // Pour forcer la suppression depuis les archives

    // Vérifier que le devis appartient à l'utilisateur
    const quote = await prisma.quote.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // Si c'est un BROUILLON ou force=true, suppression définitive
    if (quote.statut === 'BROUILLON' || force === 'true') {
      await prisma.quote.delete({
        where: { id },
      });

      return res.json({
        success: true,
        message: 'Devis supprimé définitivement',
        action: 'deleted'
      });
    }

    // Vérification légale pour les devis acceptés
    if (quote.statut === 'ACCEPTE') {
      return res.status(400).json({
        success: false,
        message: 'Conservation légale obligatoire',
        details: 'Conformément aux articles L123-22 et R123-173 du Code de commerce, les devis acceptés doivent être conservés pendant 10 ans à des fins comptables et fiscales. Ce devis sera automatiquement archivé sans possibilité de suppression.',
        action: 'legal_archive_only'
      });
    }

    // Pour les autres statuts (TERMINE, ENVOYE, VU, REFUSE, EXPIRE), archivage au lieu de suppression
    if (['TERMINE', 'ENVOYE', 'VU', 'REFUSE', 'EXPIRE'].includes(quote.statut)) {
      await prisma.quote.update({
        where: { id },
        data: {
          statut: 'ARCHIVE' as any, // Type assertion pour éviter l'erreur Prisma
          updatedAt: new Date(),
        },
      });

      return res.json({
        success: true,
        message: 'Devis archivé avec succès',
        action: 'archived',
        needsConfirmation: true
      });
    }

    // Cas par défaut - ne devrait pas arriver
    return res.status(400).json({
      success: false,
      message: 'Statut de devis non reconnu',
    });

  } catch (error) {
    logger.error('Erreur lors de la suppression/archivage du devis:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

// Nouvelle fonction pour récupérer les devis archivés
export const getArchivedQuotes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const archivedQuotes = await prisma.archivedQuote.findMany({
      where: {
        userId,
      },
      orderBy: {
        archivedAt: 'desc',
      },
    });

    // Transformer les données pour correspondre au format attendu par le frontend
    const transformedQuotes = archivedQuotes.map(archived => ({
      id: archived.originalQuoteId,
      numero: archived.numero,
      objet: archived.objet,
      statut: archived.statut,
      dateCreation: archived.dateCreation,
      dateValidite: archived.dateValidite,
      dateEnvoi: archived.dateEnvoi,
      dateAcceptation: archived.dateAcceptation,
      dateConsultation: archived.dateConsultation,
      sousTotal: archived.sousTotal,
      tva: archived.tva,
      total: archived.total,
      conditions: archived.conditions,
      notes: archived.notes,
      updatedAt: archived.archivedAt,
      contact: {
        id: archived.contactId,
        nom: archived.contactNom,
        prenom: archived.contactPrenom,
        email: archived.contactEmail,
        telephone: archived.contactTelephone,
        entreprise: archived.contactEntreprise,
        poste: archived.contactPoste,
        adresse: archived.contactAdresse,
        codePostal: archived.contactCodePostal,
        ville: archived.contactVille,
      },
      items: typeof archived.items === 'string' ? JSON.parse(archived.items) : archived.items,
    }));

    return res.json({
      success: true,
      data: {
        quotes: transformedQuotes,
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des devis archivés:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

// Fonction pour restaurer un devis archivé
export const restoreQuote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body; // ENVOYE, VU, ACCEPTE, REFUSE, etc.

    // Vérifier que le devis appartient à l'utilisateur et est archivé
    const quote = await prisma.quote.findFirst({
      where: {
        id,
        userId: req.user!.id,
        statut: 'ARCHIVE',
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis archivé non trouvé',
      });
    }

    // Restaurer le devis avec le nouveau statut
    const restoredQuote = await prisma.quote.update({
      where: { id },
      data: {
        statut: newStatus || 'ENVOYE', // Par défaut ENVOYE
        updatedAt: new Date(),
      },
      include: {
        contact: true,
        items: true,
      },
    });

    return res.json({
      success: true,
      message: 'Devis restauré avec succès',
      data: restoredQuote,
    });
  } catch (error) {
    logger.error('Erreur lors de la restauration du devis:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

// Nouvelle fonction pour télécharger le PDF avec GET (compatible avec les proxies/CDN)
export const downloadQuotePDF = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    // Récupérer le devis
    const quote = await prisma.quote.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        contact: true,
        items: {
          orderBy: { ordre: 'asc' },
        },
        user: true,
      },
    });
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }
    try {
      // Récupérer les informations de l'utilisateur pour déterminer le type de template
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { isPremium: true }
      });
      // Options de génération PDF basées sur le statut premium
      const pdfOptions = {
        templateType: user?.isPremium ? TemplateType.PREMIUM : TemplateType.BASIC,
        isPremium: user?.isPremium || false,
        customBranding: user?.isPremium ? {
          colors: {
            primary: '#007bff',
            secondary: '#6c757d'
          }
        } : undefined
      };
      // Génération PDF
      const pdfPath = await generateQuotePDF(quote as any, pdfOptions);
      
      // Vérifier que le fichier existe
      if (!fs.existsSync(pdfPath)) {
        logger.error('Fichier PDF non trouvé:', pdfPath);
        return res.status(404).json({
          success: false,
          message: 'Fichier PDF non trouvé',
        });
      }
      
      // Servir le fichier PDF directement
      const fileName = `Devis_${quote.numero}.pdf`;
      
      // Lire le fichier PDF
      const pdfBuffer = fs.readFileSync(pdfPath);
      
      // Définir les headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Envoyer le buffer directement
      return res.send(pdfBuffer);
      
    } catch (pdfError: any) {
      logger.error('Erreur lors de la génération PDF:', pdfError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du PDF',
        details: pdfError.message,
      });
    }
  } catch (error: any) {
    logger.error('Erreur lors du téléchargement PDF:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      details: error.message,
    });
  }
};

// Fonction existante pour compatibilité (utilise POST)
export const testQuotePDF = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Récupérer le devis
    const quote = await prisma.quote.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        contact: true,
        items: {
          orderBy: { ordre: 'asc' },
        },
        user: true,
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    try {
      // Récupérer les informations de l'utilisateur pour déterminer le type de template
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { isPremium: true }
      });

      // Options de génération PDF basées sur le statut premium
      const pdfOptions = {
        templateType: user?.isPremium ? TemplateType.PREMIUM : TemplateType.BASIC,
        isPremium: user?.isPremium || false,
        customBranding: user?.isPremium ? {
          colors: {
            primary: '#007bff',
            secondary: '#6c757d'
          }
        } : undefined
      };

      // Génération PDF
      const pdfPath = await generateQuotePDF(quote as any, pdfOptions);
      
      // Vérifier que le fichier existe
      if (!fs.existsSync(pdfPath)) {
        logger.error('Fichier PDF non trouvé:', pdfPath);
        return res.status(404).json({
          success: false,
          message: 'Fichier PDF non trouvé',
        });
      }
      
      // Servir le fichier PDF directement
      const fileName = `Devis_${quote.numero}.pdf`;
      
      // Lire le fichier PDF en buffer pour compatibilité avec les proxies (Render, etc.)
      const pdfBuffer = fs.readFileSync(pdfPath);
      
      // Définir les headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      
      // Envoyer le buffer directement (compatible avec les proxies comme Render)
      return res.send(pdfBuffer);
      
    } catch (pdfError: any) {
      logger.error('Erreur lors de la génération PDF:', pdfError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du PDF',
        details: pdfError.message,
      });
    }
  } catch (error: any) {
    logger.error('Erreur lors du test PDF:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      details: error.message,
    });
  }
};

export const sendQuote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    // Vérifier que le devis appartient à l'utilisateur
    const quote = await prisma.quote.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        contact: true,
        items: {
          orderBy: { ordre: 'asc' },
        },
        user: true,
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // Vérifications des statuts pour l'envoi
    if (quote.statut === 'ACCEPTE') {
      return res.status(400).json({
        success: false,
        message: 'Ce devis a déjà été accepté',
      });
    }

    if (quote.statut === 'ARCHIVE') {
      return res.status(400).json({
        success: false,
        message: 'Ce devis est archivé et ne peut plus être envoyé',
      });
    }

    // Permettre l'envoi depuis BROUILLON, PRET, TERMINE (et re-envoi depuis ENVOYE, VU, REFUSE, EXPIRE)
    const allowedStatuses = ['BROUILLON', 'PRET', 'TERMINE', 'ENVOYE', 'VU', 'REFUSE', 'EXPIRE'];
    if (!allowedStatuses.includes(quote.statut)) {
      return res.status(400).json({
        success: false,
        message: `Impossible d'envoyer un devis avec le statut ${quote.statut}`,
      });
    }

    try {
      // Récupérer les informations de l'utilisateur pour déterminer le type de template
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { isPremium: true }
      });

      // Options de génération PDF basées sur le statut premium
      const pdfOptions = {
        templateType: user?.isPremium ? TemplateType.PREMIUM : TemplateType.BASIC,
        isPremium: user?.isPremium || false,
        protectionLevel: 'strong' as const, // Protection lecture seule par défaut
        customBranding: user?.isPremium ? {
          colors: {
            primary: '#007bff',
            secondary: '#6c757d'
          }
        } : undefined
      };

      // Générer le PDF
      logger.info('Génération du PDF pour le devis:', quote.numero);
      const pdfPath = await generateQuotePDF(quote as any, pdfOptions);
      logger.info('PDF généré avec succès:', pdfPath);

      // Envoyer l'email
      logger.info('Envoi de l\'email pour le devis:', quote.numero);
      await sendQuoteEmail(quote as any, pdfPath, message);
      logger.info('Email envoyé avec succès');

      // Mettre à jour le statut du devis
      const updatedQuote = await prisma.quote.update({
        where: { id },
        data: {
          statut: 'ENVOYE',
          dateEnvoi: new Date(),
        },
      });

      // Mettre à jour la dernière interaction du contact
      await prisma.contact.update({
        where: { id: quote.contactId },
        data: { derniereInteraction: new Date() },
      });

      // Créer une interaction
      await prisma.interaction.create({
        data: {
          contactId: quote.contactId,
          type: 'EMAIL',
          objet: `Devis ${quote.numero} envoyé`,
          description: message || `Envoi du devis ${quote.numero}`,
        },
      });

      return res.json({
        success: true,
        message: 'Devis envoyé avec succès',
        data: { quote: updatedQuote },
      });
    } catch (emailError: any) {
      logger.error('Erreur lors de l\'envoi du devis:', emailError);
      
      // Déterminer le type d'erreur
      let errorMessage = 'Erreur lors de l\'envoi de l\'email';
      if (emailError.message?.includes('PDF')) {
        errorMessage = 'Erreur lors de la génération du PDF';
      } else if (emailError.message?.includes('SMTP') || emailError.message?.includes('auth')) {
        errorMessage = 'Erreur de configuration email (SMTP)';
      } else if (emailError.message?.includes('puppeteer')) {
        errorMessage = 'Erreur lors de la génération du PDF (Puppeteer)';
      }
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        details: emailError.message,
      });
    }
  } catch (error) {
    logger.error('Erreur lors de l\'envoi du devis:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const duplicateQuote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Récupérer le devis original
    const originalQuote = await prisma.quote.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        items: {
          orderBy: { ordre: 'asc' },
        },
      },
    });

    if (!originalQuote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // Générer un nouveau numéro
    const numero = await generateQuoteNumber(req.user!.id);

    // Créer le nouveau devis
    const newQuote = await prisma.quote.create({
      data: {
        userId: req.user!.id,
        contactId: originalQuote.contactId,
        numero,
        objet: `${originalQuote.objet} (Copie)`,
        dateValidite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        sousTotal: originalQuote.sousTotal,
        tva: originalQuote.tva,
        total: originalQuote.total,
        conditions: originalQuote.conditions,
        notes: originalQuote.notes,
        items: {
          create: originalQuote.items.map(item => ({
            designation: item.designation,
            description: item.description,
            quantite: item.quantite,
            prixUnitaire: item.prixUnitaire,
            total: item.total,
            ordre: item.ordre,
            serviceId: item.serviceId,
          })),
        },
      },
      include: {
        contact: true,
        items: {
          orderBy: { ordre: 'asc' },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Devis dupliqué avec succès',
      data: { quote: newQuote },
    });
  } catch (error) {
    logger.error('Erreur lors de la duplication du devis:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

// Validation pour l'envoi de relance
export const sendQuoteRelanceValidation = [
  body('subject').trim().isLength({ min: 1 }).withMessage('Le sujet est requis'),
  body('content').trim().isLength({ min: 1 }).withMessage('Le contenu est requis'),
];

// Envoyer une relance pour un devis
export const sendQuoteRelance = async (req: AuthRequest, res: Response) => {
  try {
    logger.info('Début de sendQuoteRelance', { 
      quoteId: req.params.id, 
      userId: req.user?.id,
      body: req.body 
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Erreurs de validation dans sendQuoteRelance', { errors: errors.array() });
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { subject, content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      logger.error('Utilisateur non authentifié dans sendQuoteRelance');
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
      });
    }

    // Vérifier que le devis existe et appartient à l'utilisateur
    const quote = await prisma.quote.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        contact: true,
        user: true,
        items: {
          orderBy: { ordre: 'asc' },
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

    // Vérifier que le devis peut être relancé (doit être envoyé ou vu)
    if (quote.statut !== QuoteStatus.ENVOYE && quote.statut !== QuoteStatus.VU) {
      return res.status(400).json({
        success: false,
        message: 'Ce devis ne peut pas être relancé',
      });
    }

    // Générer le PDF du devis
    logger.info('Génération du PDF pour relance', { quoteId: id });
    let pdfPath: string;
    let pdfBuffer: Buffer;
    
    try {
      pdfPath = await generateQuotePDF(quote, { 
        templateType: TemplateType.PREMIUM,
        isPremium: true,
        protectionLevel: 'none' // Pas de protection pour les relances
      });
      logger.info('PDF généré avec succès', { pdfPath });
    } catch (pdfError: any) {
      logger.error('Erreur lors de la génération PDF:', {
        error: pdfError.message,
        stack: pdfError.stack,
        quoteId: id
      });
      throw new Error(`Erreur génération PDF: ${pdfError.message}`);
    }
    
    try {
      // Lire le fichier PDF et le convertir en Buffer
      pdfBuffer = fs.readFileSync(pdfPath);
      logger.info('PDF lu en Buffer', { bufferSize: pdfBuffer.length });
    } catch (fsError: any) {
      logger.error('Erreur lors de la lecture du fichier PDF:', {
        error: fsError.message,
        pdfPath,
        quoteId: id
      });
      throw new Error(`Erreur lecture PDF: ${fsError.message}`);
    }

    // Envoyer l'email de relance avec le PDF en pièce jointe
    logger.info('Envoi de l\'email de relance', { 
      to: quote.contact.email, 
      subject, 
      quoteId: id 
    });
    
    // Adapter les données pour l'email service
    const emailQuoteData = {
      id: quote.id,
      numero: quote.numero,
      objet: quote.objet,
      total: quote.total,
      dateValidite: quote.dateValidite,
      contact: {
        id: quote.contact.id,
        prenom: quote.contact.prenom,
        nom: quote.contact.nom,
        email: quote.contact.email,
      },
      user: {
        id: quote.user.id,
        prenom: quote.user.prenom,
        nom: quote.user.nom,
        email: quote.user.email,
        entreprise: quote.user.entreprise,
        telephone: quote.user.telephone,
      },
    };
    
    await sendQuoteRelanceEmail(
      quote.contact.email,
      subject,
      content,
      emailQuoteData,
      pdfBuffer
    );
    logger.info('Email de relance envoyé avec succès');

    // Mettre à jour la date d'envoi si nécessaire
    await prisma.quote.update({
      where: { id },
      data: {
        dateEnvoi: new Date(),
      },
    });

    // Mettre à jour les métriques du contact
    const metrics = await calculateContactMetrics(quote.contactId);
    await prisma.contact.update({
      where: { id: quote.contactId },
      data: {
        ...metrics,
        dernierAchat: metrics.dernierAchat,
        statut: determineContactStatus(quote.contact, metrics),
        derniereInteraction: new Date(),
      },
    });

    return res.json({
      success: true,
      message: 'Relance envoyée avec succès',
    });
  } catch (error: any) {
    logger.error('Erreur détaillée lors de l\'envoi de la relance:', {
      error: error.message,
      stack: error.stack,
      quoteId: req.params.id,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la relance',
      details: error.message,
      debug: {
        quoteId: req.params.id,
        userId: req.user?.id,
        errorType: error.constructor.name
      }
    });
  }
};

// Fonction pour valider un devis (passer de BROUILLON à PRET)
export const validateQuote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Vérifier que le devis existe et appartient à l'utilisateur
    const quote = await prisma.quote.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        contact: true,
        items: true,
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé'
      });
    }

    // Vérifier que le devis est en brouillon
    if (quote.statut !== 'BROUILLON') {
      return res.status(400).json({
        success: false,
        message: 'Seuls les devis en brouillon peuvent être validés',
        currentStatus: quote.statut
      });
    }

    // Vérifier que le devis a au moins un élément
    if (!quote.items || quote.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le devis doit contenir au moins un élément pour être validé'
      });
    }

    // Mettre à jour le statut vers PRET
    const updatedQuote = await prisma.quote.update({
      where: { id },
      data: {
        statut: 'PRET',
        updatedAt: new Date(),
      },
      include: {
        contact: true,
        items: {
          orderBy: { ordre: 'asc' },
        },
        user: true,
      },
    });

    // Mettre à jour la dernière interaction du contact
    await prisma.contact.update({
      where: { id: quote.contactId },
      data: { derniereInteraction: new Date() },
    });

    // Créer une interaction
    await prisma.interaction.create({
      data: {
        contactId: quote.contactId,
        type: 'DEVIS',
        objet: `Devis ${quote.numero} validé`,
        description: `Le devis a été validé et est prêt à être envoyé`,
      },
    });

    logger.info('Devis validé avec succès', {
      quoteId: id,
      quoteNumber: quote.numero,
      userId,
      contactId: quote.contactId,
      previousStatus: 'BROUILLON',
      newStatus: 'PRET'
    });

    return res.json({
      success: true,
      message: 'Devis validé avec succès',
      data: updatedQuote
    });

  } catch (error: any) {
    logger.error('Erreur lors de la validation du devis', {
      error: error.message,
      stack: error.stack,
      quoteId: req.params.id,
      userId: req.user?.id
    });

    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du devis',
      details: error.message
    });
  }
};

export const updateQuoteStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    if (!status || !Object.values(QuoteStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    // Vérifier que le devis existe et appartient à l'utilisateur
    const quote = await prisma.quote.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        contact: true,
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé'
      });
    }

    // Mettre à jour le statut
    const updatedQuote = await prisma.quote.update({
      where: { id },
      data: {
        statut: status,
        updatedAt: new Date(),
      },
      include: {
        contact: true,
        items: {
          orderBy: { ordre: 'asc' },
        },
        user: true,
      },
    });

    // Mettre à jour la dernière interaction du contact
    await prisma.contact.update({
      where: { id: quote.contactId },
      data: { derniereInteraction: new Date() },
    });

    // Créer une interaction
    const statusLabels = {
      'BROUILLON': 'mis en brouillon',
      'PRET': 'validé',
      'ENVOYE': 'envoyé',
      'VU': 'consulté',
      'ACCEPTE': 'accepté',
      'REFUSE': 'refusé',
      'EXPIRE': 'expiré'
    };

    await prisma.interaction.create({
      data: {
        contactId: quote.contactId,
        type: 'DEVIS',
        objet: `Devis ${quote.numero} ${statusLabels[status] || 'modifié'}`,
        description: `Le statut du devis a été changé vers: ${status}`,
      },
    });

    logger.info('Statut du devis mis à jour', {
      quoteId: id,
      quoteNumber: quote.numero,
      userId,
      contactId: quote.contactId,
      previousStatus: quote.statut,
      newStatus: status
    });

    return res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: updatedQuote
    });

  } catch (error: any) {
    logger.error('Erreur lors de la mise à jour du statut', {
      error: error.message,
      stack: error.stack,
      quoteId: req.params.id,
      userId: req.user?.id
    });

    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      details: error.message
    });
  }
};