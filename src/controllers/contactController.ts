import { Response } from 'express';
import { PrismaClient, ContactStatus } from '@prisma/client';
import { body, query, validationResult } from 'express-validator';
import { AuthRequest } from '@/middleware/auth';
import { logger } from '@/utils/logger';
import { sendTrackedEmail } from '@/services/resendEmailService';

const prisma = new PrismaClient();

export const createContactValidation = [
  body('nom').trim().isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('prenom').trim().isLength({ min: 2 }).withMessage('Le prénom doit contenir au moins 2 caractères'),
  body('email').isEmail().withMessage('Email invalide'),
  body('telephone').optional().trim(),
  body('entreprise').optional().trim(),
  body('poste').optional().trim(),
  body('adresse').optional().trim(),
  body('codePostal').optional().trim(),
  body('ville').optional().trim(),
  body('pays').optional().trim(),
  body('notes').optional().trim(),
];

export const updateContactValidation = [
  body('nom').optional().trim().isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('prenom').optional().trim().isLength({ min: 2 }).withMessage('Le prénom doit contenir au moins 2 caractères'),
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('telephone').optional().trim(),
  body('entreprise').optional().trim(),
  body('poste').optional().trim(),
  body('adresse').optional().trim(),
  body('codePostal').optional().trim(),
  body('ville').optional().trim(),
  body('pays').optional().trim(),
  body('statut').optional().isIn(Object.values(ContactStatus)).withMessage('Statut invalide'),
  body('notes').optional().trim(),
];

export const getContactsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100'),
  query('search').optional().trim(),
  query('statut').optional().isIn(Object.values(ContactStatus)).withMessage('Statut invalide'),
  query('sortBy').optional().isIn(['nom', 'prenom', 'email', 'entreprise', 'scoreValeur', 'chiffresAffairesTotal', 'derniereInteraction']).withMessage('Tri invalide'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Ordre de tri invalide'),
];

// Fonction utilitaire pour calculer les métriques d'un contact
export const calculateContactMetrics = async (contactId: string) => {
  const quotes = await prisma.quote.findMany({
    where: { contactId },
    include: {
      emailTracking: true,
    },
  });

  const acceptedQuotes = quotes.filter(q => q.statut === 'ACCEPTE');
  const sentQuotes = quotes.filter(q => ['ENVOYE', 'VU', 'ACCEPTE', 'REFUSE', 'EXPIRE'].includes(q.statut));

  const chiffresAffairesTotal = acceptedQuotes.reduce((sum, quote) => sum + quote.total, 0);
  const tauxConversion = sentQuotes.length > 0 ? (acceptedQuotes.length / sentQuotes.length) * 100 : 0;
  const panierMoyen = acceptedQuotes.length > 0 ? chiffresAffairesTotal / acceptedQuotes.length : 0;

  // Calcul du score de valeur (pondération: CA 40%, récence 30%, fréquence 20%, conversion 10%)
  const dernierAchat = acceptedQuotes.length > 0 ? Math.max(...acceptedQuotes.map(q => q.dateAcceptation?.getTime() || 0)) : null;
  const recenceScore = dernierAchat ? Math.max(0, 100 - ((Date.now() - dernierAchat) / (1000 * 60 * 60 * 24 * 30))) : 0; // Score basé sur les 30 derniers jours
  const frequenceScore = Math.min(100, acceptedQuotes.length * 10); // 10 points par commande, max 100
  const caScore = Math.min(100, chiffresAffairesTotal / 1000); // 1 point par 1000€, max 100

  const scoreValeur = (caScore * 0.4) + (recenceScore * 0.3) + (frequenceScore * 0.2) + (tauxConversion * 0.1);

  return {
    chiffresAffairesTotal,
    tauxConversion,
    panierMoyen,
    scoreValeur,
    dernierAchat: dernierAchat ? new Date(dernierAchat) : null,
  };
};

// Fonction pour déterminer le statut automatique d'un contact
export const determineContactStatus = (contact: any, metrics: any): ContactStatus => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  const oneYearAgo = new Date(now.getTime() - (12 * 30 * 24 * 60 * 60 * 1000));

  // Client actif: CA > 0 ET dernier achat < 6 mois
  if (metrics.chiffresAffairesTotal > 0 && metrics.dernierAchat && metrics.dernierAchat > sixMonthsAgo) {
    return ContactStatus.CLIENT_ACTIF;
  }

  // Inactif: aucune interaction > 1 an
  if (!contact.derniereInteraction || contact.derniereInteraction < oneYearAgo) {
    return ContactStatus.INACTIF;
  }

  // Prospect froid: aucune interaction > 6 mois
  if (!contact.derniereInteraction || contact.derniereInteraction < sixMonthsAgo) {
    return ContactStatus.PROSPECT_FROID;
  }

  // Par défaut, prospect tiède
  return ContactStatus.PROSPECT_TIEDE;
};

export const getContacts = async (req: AuthRequest, res: Response) => {
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
    const statut = req.query.statut as ContactStatus;
    const sortBy = (req.query.sortBy as string) || 'scoreValeur';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    const skip = (page - 1) * limit;

    // Construction des filtres
    const where: any = {
      userId: req.user!.id,
    };

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { entreprise: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (statut) {
      where.statut = statut;
    }

    // Récupération des contacts
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          quotes: {
            select: {
              id: true,
              statut: true,
              total: true,
              dateAcceptation: true,
            },
          },
          _count: {
            select: {
              quotes: true,
              interactions: true,
            },
          },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des contacts:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const getContact = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        quotes: {
          orderBy: { dateCreation: 'desc' },
          include: {
            items: true,
            emailTracking: true,
          },
        },
        interactions: {
          orderBy: { date: 'desc' },
        },
        _count: {
          select: {
            quotes: true,
            interactions: true,
          },
        },
      },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact non trouvé',
      });
    }

    return res.json({
      success: true,
      data: { contact },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const createContact = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array(),
      });
    }

    const { nom, prenom, email, telephone, entreprise, poste, adresse, codePostal, ville, pays, notes } = req.body;

    // Vérifier si un contact avec cet email existe déjà pour cet utilisateur
    const existingContact = await prisma.contact.findFirst({
      where: {
        email,
        userId: req.user!.id,
      },
    });

    if (existingContact) {
      return res.status(409).json({
        success: false,
        message: 'Un contact avec cet email existe déjà',
      });
    }

    const contact = await prisma.contact.create({
      data: {
        userId: req.user!.id,
        nom,
        prenom,
        email,
        telephone,
        entreprise,
        poste,
        adresse,
        codePostal,
        ville,
        pays: pays || 'France',
        notes,
        derniereInteraction: new Date(),
      },
    });

    // Créer une interaction pour la création du contact
    await prisma.interaction.create({
      data: {
        contactId: contact.id,
        type: 'AUTRE',
        objet: 'Contact créé',
        description: 'Contact ajouté au CRM',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Contact créé avec succès',
      data: { contact },
    });
  } catch (error) {
    logger.error('Erreur lors de la création du contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const updateContact = async (req: AuthRequest, res: Response) => {
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
    const updateData = req.body;

    // Vérifier que le contact appartient à l'utilisateur
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!existingContact) {
      return res.status(404).json({
        success: false,
        message: 'Contact non trouvé',
      });
    }

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (updateData.email && updateData.email !== existingContact.email) {
      const emailExists = await prisma.contact.findFirst({
        where: {
          email: updateData.email,
          userId: req.user!.id,
          NOT: { id },
        },
      });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Un contact avec cet email existe déjà',
        });
      }
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...updateData,
        derniereInteraction: new Date(),
      },
    });

    // Recalculer les métriques
    const metrics = await calculateContactMetrics(contact.id);
    
    // Mettre à jour le contact avec les nouvelles métriques
    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        ...metrics,
        dernierAchat: metrics.dernierAchat,
        statut: determineContactStatus(contact, metrics),
      },
    });

    return res.json({
      success: true,
      message: 'Contact mis à jour avec succès',
      data: { contact: updatedContact },
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

// Fonction pour archiver un devis de manière permanente
const archiveQuotePermanently = async (quote: any, contact: any, reason: string) => {
  try {
    // Préparer les données des éléments du devis en JSON
    const itemsData = quote.items.map((item: any) => ({
      id: item.id,
      serviceId: item.serviceId,
      designation: item.designation,
      description: item.description,
      quantite: item.quantite,
      prixUnitaire: item.prixUnitaire,
      tauxTva: item.tauxTva,
      total: item.total,
      ordre: item.ordre,
      conserver: item.conserver,
    }));

    // Créer l'archive permanente (ou mettre à jour si existe déjà)
    await prisma.archivedQuote.upsert({
      where: {
        originalQuoteId: quote.id,
      },
      create: {
        originalQuoteId: quote.id,
        userId: quote.userId,
        numero: quote.numero,
        objet: quote.objet,
        statut: quote.statut,
        dateCreation: quote.dateCreation,
        dateValidite: quote.dateValidite,
        dateEnvoi: quote.dateEnvoi,
        dateAcceptation: quote.dateAcceptation,
        dateConsultation: quote.dateConsultation,
        sousTotal: quote.sousTotal,
        tva: quote.tva,
        total: quote.total,
        conditions: quote.conditions,
        notes: quote.notes,
        
        // Snapshot des données contact
        contactId: contact.id,
        contactNom: contact.nom,
        contactPrenom: contact.prenom,
        contactEmail: contact.email,
        contactTelephone: contact.telephone,
        contactEntreprise: contact.entreprise,
        contactPoste: contact.poste,
        contactAdresse: contact.adresse,
        contactCodePostal: contact.codePostal,
        contactVille: contact.ville,
        contactPays: contact.pays,
        
        // Éléments en JSON
        items: itemsData,
        
        // Métadonnées d'archivage
        archivedReason: reason,
      },
      update: {
        // En cas de doublon, on peut mettre à jour la raison d'archivage
        archivedReason: reason,
        archivedAt: new Date(),
      },
    });

    logger.info('Devis archivé de manière permanente', {
      quoteId: quote.id,
      numero: quote.numero,
      contactEmail: contact.email,
      reason,
    });

    return true;
  } catch (error) {
    logger.error('Erreur lors de l\'archivage permanent du devis:', error);
    throw error;
  }
};

export const deleteContact = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Vérifier que le contact appartient à l'utilisateur
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        quotes: {
          include: {
            items: true,
            emailTracking: true,
          },
        },
      },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact non trouvé',
      });
    }

    // Utiliser une transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      let archivedCount = 0;
      let deletedDraftCount = 0;

      // CONFORMITÉ LÉGALE : Archiver TOUS les devis validés (sauf BROUILLON)
      const quotesToArchive = contact.quotes.filter(quote => 
        quote.statut !== 'BROUILLON' // Archiver tout sauf les brouillons
      );

      // ARCHIVER tous les devis validés (PRET, ENVOYE, VU, ACCEPTE, REFUSE, EXPIRE, TERMINE)
      for (const quote of quotesToArchive) {
        try {
          await archiveQuotePermanently(quote, contact, 'contact_deletion');
          
          // Supprimer les données de tracking email liées
          await tx.emailTracking.deleteMany({
            where: { quoteId: quote.id },
          });
          
          // Supprimer le devis original maintenant qu'il est archivé
          await tx.quote.delete({
            where: { id: quote.id },
          });
          archivedCount++;
          
          logger.info(`✅ ARCHIVÉ: Devis ${quote.statut} ${quote.numero} archivé et supprimé`);
        } catch (error) {
          logger.error(`Erreur lors de l'archivage du devis ${quote.numero}:`, error);
          // Continuer avec les autres même si un archivage échoue
        }
      }

      // Supprimer SEULEMENT les devis BROUILLON (pas de valeur légale)
      const draftQuotes = contact.quotes.filter(quote => quote.statut === 'BROUILLON');
      for (const draftQuote of draftQuotes) {
        try {
          // Supprimer d'abord les données de tracking email liées
          await tx.emailTracking.deleteMany({
            where: { quoteId: draftQuote.id },
          });
          
          await tx.quote.delete({
            where: { id: draftQuote.id },
          });
          deletedDraftCount++;
          
          logger.info(`🗑️ SUPPRIMÉ: Brouillon ${draftQuote.numero} supprimé définitivement`);
        } catch (error) {
          logger.error(`Erreur lors de la suppression du brouillon ${draftQuote.numero}:`, error);
        }
      }

      // Supprimer toutes les relations restantes
      await tx.interaction.deleteMany({
        where: { contactId: id },
      });
      
      await tx.genericEmail.deleteMany({
        where: { contactId: id },
      });

      // ✅ Tous les devis non-brouillons ont été archivés et supprimés
      // Il ne reste que les relations à nettoyer et le contact à supprimer
      
      // Maintenant supprimer le contact (plus de contraintes car tous les devis sont supprimés)
      await tx.contact.delete({
        where: { id },
      });
      
      logger.info('✅ Contact supprimé avec archivage complet', {
        contactId: id,
        archivedQuotes: archivedCount,
        deletedDrafts: deletedDraftCount
      });

      return { archivedCount, deletedDraftCount };
    });

    const { archivedCount, deletedDraftCount } = result;

    logger.info('Contact supprimé avec archivage automatique', {
      contactId: id,
      contactEmail: contact.email,
      archivedQuotes: archivedCount,
      deletedDrafts: deletedDraftCount,
    });

    return res.json({
      success: true,
      message: `Contact supprimé avec succès. ${archivedCount} devis archivés de manière permanente, ${deletedDraftCount} brouillons supprimés.`,
      data: {
        archivedQuotes: archivedCount,
        deletedDrafts: deletedDraftCount,
      },
    });
  } catch (error) {
    if (error.code === 'P2003') {
      // Erreur de contrainte de clé étrangère
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer ce contact car il a des devis associés. Veuillez d\'abord archiver ou supprimer les devis.',
      });
    }
    
    logger.error('Erreur lors de la suppression du contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const getContactMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Vérifier que le contact appartient à l'utilisateur
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact non trouvé',
      });
    }

    const metrics = await calculateContactMetrics(id!);

    return res.json({
      success: true,
      data: { metrics },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des métriques du contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const updateContactMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Vérifier que le contact appartient à l'utilisateur
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact non trouvé',
      });
    }

    const metrics = await calculateContactMetrics(id!);
    
    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        ...metrics,
        dernierAchat: metrics.dernierAchat,
        statut: determineContactStatus(contact, metrics),
      },
    });

    return res.json({
      success: true,
      message: 'Métriques mises à jour avec succès',
      data: { contact: updatedContact },
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour des métriques du contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

// Validation pour l'envoi d'email
export const sendEmailValidation = [
  body('subject').trim().isLength({ min: 1 }).withMessage('Le sujet est requis'),
  body('content').trim().isLength({ min: 1 }).withMessage('Le contenu est requis'),
];

// Envoyer un email à un contact
export const sendEmailToContact = async (req: AuthRequest, res: Response) => {
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
    const { subject, content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
      });
    }

    // Vérifier que le contact existe et appartient à l'utilisateur
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact non trouvé',
      });
    }

    // Récupérer les informations de l'utilisateur pour l'email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        nom: true,
        prenom: true,
        email: true,
        entreprise: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Envoyer l'email avec tracking
    await sendTrackedEmail(
      contact.email,
      subject,
      content,
      contact.id,
      req.user!.id
    );

    return res.json({
      success: true,
      message: 'Email envoyé avec succès',
    });
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de l\'email:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de l\'email',
    });
  }
};

// Récupérer les emails génériques d'un contact
export const getContactEmails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
      });
    }

    // Vérifier que le contact appartient à l'utilisateur
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact non trouvé',
      });
    }

    // Récupérer les emails génériques
    const genericEmails = await prisma.genericEmail.findMany({
      where: {
        contactId: id,
        userId,
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    // Récupérer les devis envoyés à ce contact avec leur tracking
    const quoteEmails = await prisma.quote.findMany({
      where: {
        contactId: id,
        userId,
        statut: {
          in: ['ENVOYE', 'VU', 'ACCEPTE', 'REFUSE', 'EXPIRE']
        }
      },
      include: {
        emailTracking: true,
      },
      orderBy: {
        dateEnvoi: 'desc',
      },
    });

    // Créer un tableau unifié d'emails avec différents types
    const unifiedEmails = [
      // Emails génériques (incluant les relances)
      ...genericEmails.map(email => {
        const isRelance = email.trackingId.startsWith('relance_');
        return {
          id: email.id,
          type: isRelance ? 'relance' as const : 'generic' as const,
          subject: email.subject,
          content: email.content,
          sentAt: email.sentAt,
          openedAt: email.openedAt,
          isOpened: email.isOpened,
          openCount: email.openCount,
          trackingId: email.trackingId,
          // Si c'est une relance, extraire l'ID du devis du trackingId
          relatedQuoteId: isRelance ? email.trackingId.split('_')[1] : undefined,
        };
      }),
      // Emails de devis
      ...quoteEmails.map(quote => ({
        id: `quote_${quote.id}`,
        type: 'quote' as const,
        subject: `Devis ${quote.numero} - ${quote.objet}`,
        content: quote.objet,
        sentAt: quote.dateEnvoi || quote.dateCreation,
        openedAt: quote.emailTracking[0]?.dateOuverture || null,
        isOpened: quote.emailTracking[0]?.ouvert || false,
        openCount: quote.emailTracking[0]?.nombreOuvertures || 0,
        quoteId: quote.id,
        quoteNumber: quote.numero,
        quoteStatus: quote.statut,
        quoteTotal: quote.total,
      }))
    ];

    // Trier par date d'envoi décroissante
    unifiedEmails.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    return res.json({
      success: true,
      data: { 
        emails: unifiedEmails,
        summary: {
          total: unifiedEmails.length,
          generic: genericEmails.filter(email => !email.trackingId.startsWith('relance_')).length,
          relances: genericEmails.filter(email => email.trackingId.startsWith('relance_')).length,
          quotes: quoteEmails.length,
          opened: unifiedEmails.filter(e => e.isOpened).length,
        }
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des emails:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

// Récupérer les devis archivés d'un utilisateur
export const getArchivedQuotes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
      });
    }

    const archivedQuotes = await prisma.archivedQuote.findMany({
      where: {
        userId,
      },
      orderBy: {
        archivedAt: 'desc',
      },
    });

    return res.json({
      success: true,
      data: { 
        archivedQuotes,
        summary: {
          total: archivedQuotes.length,
          byReason: {
            contact_deletion: archivedQuotes.filter(q => q.archivedReason === 'contact_deletion').length,
            manual_archive: archivedQuotes.filter(q => q.archivedReason === 'manual_archive').length,
            legal_retention: archivedQuotes.filter(q => q.archivedReason === 'legal_retention').length,
          },
          totalValue: archivedQuotes.reduce((sum, quote) => sum + quote.total, 0),
        }
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des archives:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};