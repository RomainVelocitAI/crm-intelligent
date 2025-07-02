import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, query, validationResult } from 'express-validator';
import { AuthRequest } from '@/middleware/auth';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export const createServiceValidation = [
  body('nom').trim().isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('description').optional().trim(),
  body('prixUnitaire').isFloat({ min: 0 }).withMessage('Prix unitaire invalide'),
  body('unite').trim().isLength({ min: 1 }).withMessage('Unité requise'),
  body('categorie').optional().trim(),
];

export const updateServiceValidation = [
  body('nom').optional().trim().isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('description').optional().trim(),
  body('prixUnitaire').optional().isFloat({ min: 0 }).withMessage('Prix unitaire invalide'),
  body('unite').optional().trim().isLength({ min: 1 }).withMessage('Unité requise'),
  body('categorie').optional().trim(),
  body('actif').optional().isBoolean().withMessage('Statut actif invalide'),
];

export const getServicesValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100'),
  query('search').optional().trim(),
  query('categorie').optional().trim(),
  query('actif').optional().isBoolean().withMessage('Filtre actif invalide'),
  query('sortBy').optional().isIn(['nom', 'prixUnitaire', 'categorie', 'createdAt']).withMessage('Tri invalide'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Ordre de tri invalide'),
];

export const getServices = async (req: AuthRequest, res: Response) => {
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
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const categorie = req.query.categorie as string;
    const actif = req.query.actif === 'true' ? true : req.query.actif === 'false' ? false : undefined;
    const sortBy = (req.query.sortBy as string) || 'nom';
    const sortOrder = (req.query.sortOrder as string) || 'asc';

    const skip = (page - 1) * limit;

    // Construction des filtres
    const where: any = {
      userId: req.user!.id,
    };

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { categorie: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categorie) {
      where.categorie = categorie;
    }

    if (actif !== undefined) {
      where.actif = actif;
    }

    // Récupération des services
    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              quoteItems: true,
            },
          },
        },
      }),
      prisma.service.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        services,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des services:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const getService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        quoteItems: {
          include: {
            quote: {
              select: {
                numero: true,
                objet: true,
                statut: true,
                dateCreation: true,
              },
            },
          },
          orderBy: {
            quote: {
              dateCreation: 'desc',
            },
          },
        },
        _count: {
          select: {
            quoteItems: true,
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service non trouvé',
      });
    }

    return res.json({
      success: true,
      data: { service },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du service:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array(),
      });
    }

    const { nom, description, prixUnitaire, unite, categorie } = req.body;

    // Vérifier si un service avec ce nom existe déjà
    const existingService = await prisma.service.findFirst({
      where: {
        nom,
        userId: req.user!.id,
      },
    });

    if (existingService) {
      return res.status(409).json({
        success: false,
        message: 'Un service avec ce nom existe déjà',
      });
    }

    const service = await prisma.service.create({
      data: {
        userId: req.user!.id,
        nom,
        description,
        prixUnitaire,
        unite,
        categorie,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Service créé avec succès',
      data: { service },
    });
  } catch (error) {
    logger.error('Erreur lors de la création du service:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const updateService = async (req: AuthRequest, res: Response) => {
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

    // Vérifier que le service appartient à l'utilisateur
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Service non trouvé',
      });
    }

    // Si le nom est modifié, vérifier qu'il n'existe pas déjà
    if (updateData.nom && updateData.nom !== existingService.nom) {
      const nameExists = await prisma.service.findFirst({
        where: {
          nom: updateData.nom,
          userId: req.user!.id,
          NOT: { id },
        },
      });

      if (nameExists) {
        return res.status(409).json({
          success: false,
          message: 'Un service avec ce nom existe déjà',
        });
      }
    }

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: 'Service mis à jour avec succès',
      data: { service },
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du service:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Vérifier que le service appartient à l'utilisateur
    const service = await prisma.service.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        _count: {
          select: {
            quoteItems: true,
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service non trouvé',
      });
    }

    // Vérifier si le service est utilisé dans des devis
    if (service._count.quoteItems > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ce service est utilisé dans des devis et ne peut pas être supprimé',
        data: {
          quoteItemsCount: service._count.quoteItems,
        },
      });
    }

    await prisma.service.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Service supprimé avec succès',
    });
  } catch (error) {
    logger.error('Erreur lors de la suppression du service:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const getServiceCategories = async (req: AuthRequest, res: Response) => {
  try {
    // Récupérer toutes les catégories distinctes de l'utilisateur
    const categories = await prisma.service.findMany({
      where: {
        userId: req.user!.id,
        categorie: {
          not: null,
        },
        actif: true,
      },
      select: {
        categorie: true,
      },
      distinct: ['categorie'],
      orderBy: {
        categorie: 'asc',
      },
    });

    const categoryList = categories
      .map(s => s.categorie)
      .filter(Boolean)
      .sort();

    return res.json({
      success: true,
      data: { categories: categoryList },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des catégories:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const getServiceStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Vérifier que le service appartient à l'utilisateur
    const service = await prisma.service.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service non trouvé',
      });
    }

    // Récupérer les statistiques du service
    const stats = await prisma.quoteItem.aggregate({
      where: {
        serviceId: id,
        quote: {
          userId: req.user!.id,
          statut: 'ACCEPTE',
        },
      },
      _sum: {
        total: true,
        quantite: true,
      },
      _count: {
        id: true,
      },
    });

    // Récupérer les utilisations par mois (12 derniers mois)
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    const monthlyUsage = await prisma.quoteItem.findMany({
      where: {
        serviceId: id,
        quote: {
          userId: req.user!.id,
          statut: 'ACCEPTE',
          dateAcceptation: {
            gte: lastYear,
          },
        },
      },
      include: {
        quote: {
          select: {
            dateAcceptation: true,
          },
        },
      },
    });

    // Grouper par mois
    const monthlyData = monthlyUsage.reduce((acc: any, item) => {
      const date = item.quote.dateAcceptation!;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[key]) {
        acc[key] = {
          month: key,
          revenue: 0,
          quantity: 0,
          count: 0,
        };
      }
      
      acc[key].revenue += item.total;
      acc[key].quantity += item.quantite;
      acc[key].count += 1;
      
      return acc;
    }, {});

    const monthlyStats = Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));

    return res.json({
      success: true,
      data: {
        service,
        stats: {
          totalRevenue: stats._sum.total || 0,
          totalQuantity: stats._sum.quantite || 0,
          totalUsage: stats._count || 0,
          monthlyStats,
        },
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques du service:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};