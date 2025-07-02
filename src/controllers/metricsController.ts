import { Response } from 'express';
import { PrismaClient, ContactStatus, QuoteStatus } from '@prisma/client';
import { query, validationResult } from 'express-validator';
import { AuthRequest } from '@/middleware/auth';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export const getDashboardValidation = [
  query('period').optional().isIn(['7d', '30d', '90d', '1y', 'all']).withMessage('Période invalide'),
  query('startDate').optional().isISO8601().withMessage('Date de début invalide'),
  query('endDate').optional().isISO8601().withMessage('Date de fin invalide'),
];

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides',
        errors: errors.array(),
      });
    }

    const period = req.query.period as string || '30d';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // Calcul des dates selon la période
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else {
      const now = new Date();
      let start: Date;
      
      switch (period) {
        case '7d':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(0); // Toutes les données
      }
      
      if (period !== 'all') {
        dateFilter = { gte: start };
      }
    }

    // Requêtes en parallèle pour les métriques principales
    const [
      totalContacts,
      totalQuotes,
      acceptedQuotes,
      totalRevenue,
      contactsByStatus,
      quotesByStatus,
      recentQuotes,
      topContacts,
      monthlyRevenue,
      conversionRates,
      // Nouveaux KPIs
      pendingQuotes,
      pipelineValue,
      sentQuotes,
      viewedQuotes
    ] = await Promise.all([
      // Total des contacts
      prisma.contact.count({
        where: { userId: req.user!.id },
      }),
      
      // Total des devis
      prisma.quote.count({
        where: {
          userId: req.user!.id,
          ...(Object.keys(dateFilter).length > 0 && { dateCreation: dateFilter }),
        },
      }),
      
      // Devis acceptés
      prisma.quote.findMany({
        where: {
          userId: req.user!.id,
          statut: 'ACCEPTE',
          ...(Object.keys(dateFilter).length > 0 && { dateAcceptation: dateFilter }),
        },
        select: {
          total: true,
          dateAcceptation: true,
        },
      }),
      
      // Chiffre d'affaires total
      prisma.quote.aggregate({
        where: {
          userId: req.user!.id,
          statut: 'ACCEPTE',
          ...(Object.keys(dateFilter).length > 0 && { dateAcceptation: dateFilter }),
        },
        _sum: {
          total: true,
        },
      }),
      
      // Répartition des contacts par statut
      prisma.contact.groupBy({
        by: ['statut'],
        where: { userId: req.user!.id },
        _count: {
          id: true,
        },
      }),
      
      // Répartition des devis par statut
      prisma.quote.groupBy({
        by: ['statut'],
        where: {
          userId: req.user!.id,
          ...(Object.keys(dateFilter).length > 0 && { dateCreation: dateFilter }),
        },
        _count: {
          id: true,
        },
      }),
      
      // Devis récents
      prisma.quote.findMany({
        where: { userId: req.user!.id },
        orderBy: { dateCreation: 'desc' },
        take: 5,
        include: {
          contact: {
            select: {
              nom: true,
              prenom: true,
              entreprise: true,
            },
          },
        },
      }),
      
      // Top contacts par CA
      prisma.contact.findMany({
        where: { userId: req.user!.id },
        orderBy: { chiffresAffairesTotal: 'desc' },
        take: 5,
        select: {
          id: true,
          nom: true,
          prenom: true,
          entreprise: true,
          chiffresAffairesTotal: true,
          tauxConversion: true,
          statut: true,
        },
      }),
      
      // Revenus par mois (12 derniers mois)
      prisma.quote.findMany({
        where: {
          userId: req.user!.id,
          statut: 'ACCEPTE',
          dateAcceptation: {
            gte: new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          total: true,
          dateAcceptation: true,
        },
      }),
      
      // Taux de conversion global
      prisma.quote.groupBy({
        by: ['statut'],
        where: {
          userId: req.user!.id,
          statut: {
            in: ['ENVOYE', 'VU', 'ACCEPTE', 'REFUSE', 'EXPIRE'],
          },
          ...(Object.keys(dateFilter).length > 0 && { dateCreation: dateFilter }),
        },
        _count: {
          id: true,
        },
      }),

      // Nouveaux KPIs - Devis en attente (PRET + ENVOYE + VU)
      prisma.quote.count({
        where: {
          userId: req.user!.id,
          statut: {
            in: ['PRET', 'ENVOYE', 'VU'],
          },
          ...(Object.keys(dateFilter).length > 0 && { dateCreation: dateFilter }),
        },
      }),

      // Pipeline value (valeur totale des devis non acceptés)
      prisma.quote.aggregate({
        where: {
          userId: req.user!.id,
          statut: {
            in: ['PRET', 'ENVOYE', 'VU', 'BROUILLON'],
          },
          ...(Object.keys(dateFilter).length > 0 && { dateCreation: dateFilter }),
        },
        _sum: {
          total: true,
        },
      }),

      // Devis envoyés (pour calcul taux d'ouverture)
      prisma.quote.count({
        where: {
          userId: req.user!.id,
          statut: 'ENVOYE',
          ...(Object.keys(dateFilter).length > 0 && { dateEnvoi: dateFilter }),
        },
      }),

      // Devis vus (pour calcul taux d'ouverture)
      prisma.quote.count({
        where: {
          userId: req.user!.id,
          statut: {
            in: ['VU', 'ACCEPTE', 'REFUSE'],
          },
          ...(Object.keys(dateFilter).length > 0 && { dateConsultation: dateFilter }),
        },
      }),
    ]);

    // Calcul des métriques dérivées
    const sentQuotesCount = conversionRates.reduce((sum, item) => sum + item._count.id, 0);
    const acceptedCount = conversionRates.find(item => item.statut === 'ACCEPTE')?._count.id || 0;
    const conversionRate = sentQuotesCount > 0 ? (acceptedCount / sentQuotesCount) * 100 : 0;
    const averageBasket = acceptedQuotes.length > 0 ? (totalRevenue._sum.total || 0) / acceptedQuotes.length : 0;

    // Calcul des nouveaux KPIs
    const openingRate = sentQuotes > 0 ? (viewedQuotes / sentQuotes) * 100 : 0;
    const pipelineValueTotal = pipelineValue._sum.total || 0;

    // Grouper les revenus par mois
    const monthlyData = monthlyRevenue.reduce((acc: any, quote) => {
      const date = quote.dateAcceptation!;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[key]) {
        acc[key] = {
          month: key,
          revenue: 0,
          count: 0,
        };
      }
      
      acc[key].revenue += quote.total;
      acc[key].count += 1;
      
      return acc;
    }, {});

    // Pour les nouveaux utilisateurs sans données historiques, afficher seulement le mois en cours
    let monthlyStats;
    if (Object.keys(monthlyData).length === 0) {
      // Nouveaux utilisateurs : seulement le mois en cours
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyStats = [{
        month: currentMonth,
        revenue: 0,
        count: 0,
      }];
    } else {
      // Utilisateurs avec données historiques : afficher toutes les données
      monthlyStats = Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));
    }

    // Formatage des données pour les graphiques
    const contactsChart = contactsByStatus.map(item => ({
      status: item.statut,
      count: item._count.id,
    }));

    const quotesChart = quotesByStatus.map(item => ({
      status: item.statut,
      count: item._count.id,
    }));

    // Calcul des tendances (comparaison avec la période précédente)
    const previousPeriodStart = new Date();
    if (period === '7d') {
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 14);
    } else if (period === '30d') {
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 60);
    } else if (period === '90d') {
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 180);
    } else {
      previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 2);
    }

    const previousPeriodRevenue = await prisma.quote.aggregate({
      where: {
        userId: req.user!.id,
        statut: 'ACCEPTE',
        dateAcceptation: {
          gte: previousPeriodStart,
          lt: Object.keys(dateFilter).length > 0 ? dateFilter.gte : new Date(),
        },
      },
      _sum: {
        total: true,
      },
    });

    const currentRevenue = totalRevenue._sum.total || 0;
    const previousRevenue = previousPeriodRevenue._sum.total || 0;
    const revenueTrend = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return res.json({
      success: true,
      data: {
        overview: {
          totalContacts,
          totalQuotes,
          acceptedQuotes: acceptedQuotes.length,
          totalRevenue: currentRevenue,
          conversionRate: Math.round(conversionRate * 100) / 100,
          averageBasket: Math.round(averageBasket * 100) / 100,
          revenueTrend: Math.round(revenueTrend * 100) / 100,
          // Nouveaux KPIs
          pendingQuotes,
          pipelineValue: Math.round(pipelineValueTotal * 100) / 100,
          openingRate: Math.round(openingRate * 100) / 100,
        },
        charts: {
          contactsByStatus: contactsChart,
          quotesByStatus: quotesChart,
          monthlyRevenue: monthlyStats,
        },
        recent: {
          quotes: recentQuotes,
          topContacts,
        },
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du dashboard:', error);
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

    // Récupérer les métriques détaillées du contact
    const [quotes, interactions, emailTracking] = await Promise.all([
      prisma.quote.findMany({
        where: { contactId: id },
        include: {
          emailTracking: true,
          items: true,
        },
        orderBy: { dateCreation: 'desc' },
      }),
      
      prisma.interaction.findMany({
        where: { contactId: id },
        orderBy: { date: 'desc' },
      }),
      
      prisma.emailTracking.findMany({
        where: {
          quote: { contactId: id },
        },
      }),
    ]);

    // Calcul des métriques
    const totalQuotes = quotes.length;
    const acceptedQuotes = quotes.filter(q => q.statut === 'ACCEPTE');
    const sentQuotes = quotes.filter(q => ['ENVOYE', 'VU', 'ACCEPTE', 'REFUSE', 'EXPIRE'].includes(q.statut));
    
    const totalRevenue = acceptedQuotes.reduce((sum, quote) => sum + quote.total, 0);
    const conversionRate = sentQuotes.length > 0 ? (acceptedQuotes.length / sentQuotes.length) * 100 : 0;
    const averageBasket = acceptedQuotes.length > 0 ? totalRevenue / acceptedQuotes.length : 0;

    // Métriques d'engagement email
    const totalEmailsSent = emailTracking.length;
    const emailsOpened = emailTracking.filter(e => e.ouvert).length;
    const emailsClicked = emailTracking.filter(e => e.clique).length;
    const emailOpenRate = totalEmailsSent > 0 ? (emailsOpened / totalEmailsSent) * 100 : 0;
    const emailClickRate = totalEmailsSent > 0 ? (emailsClicked / totalEmailsSent) * 100 : 0;

    // Évolution des revenus par mois
    const monthlyRevenue = acceptedQuotes.reduce((acc: any, quote) => {
      const date = quote.dateAcceptation!;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[key]) {
        acc[key] = {
          month: key,
          revenue: 0,
          count: 0,
        };
      }
      
      acc[key].revenue += quote.total;
      acc[key].count += 1;
      
      return acc;
    }, {});

    const monthlyStats = Object.values(monthlyRevenue).sort((a: any, b: any) => a.month.localeCompare(b.month));

    // Répartition des devis par statut
    const quotesByStatus = quotes.reduce((acc: any, quote) => {
      acc[quote.statut] = (acc[quote.statut] || 0) + 1;
      return acc;
    }, {});

    // Timeline des interactions
    const timeline = [...quotes.map(q => ({
      type: 'quote',
      date: q.dateCreation,
      title: `Devis ${q.numero}`,
      description: q.objet,
      status: q.statut,
    })), ...interactions.map(i => ({
      type: 'interaction',
      date: i.date,
      title: i.objet || i.type,
      description: i.description,
      interactionType: i.type,
    }))].sort((a, b) => b.date.getTime() - a.date.getTime());

    return res.json({
      success: true,
      data: {
        contact,
        metrics: {
          totalQuotes,
          acceptedQuotes: acceptedQuotes.length,
          totalRevenue,
          conversionRate: Math.round(conversionRate * 100) / 100,
          averageBasket: Math.round(averageBasket * 100) / 100,
          totalInteractions: interactions.length,
          emailOpenRate: Math.round(emailOpenRate * 100) / 100,
          emailClickRate: Math.round(emailClickRate * 100) / 100,
        },
        charts: {
          monthlyRevenue: monthlyStats,
          quotesByStatus: Object.entries(quotesByStatus).map(([status, count]) => ({
            status,
            count,
          })),
        },
        timeline: timeline.slice(0, 20), // Limiter à 20 éléments récents
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des métriques du contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const getRevenueAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const period = req.query.period as string || '12m';
    
    // Calculer la période d'analyse
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '3m':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '12m':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '24m':
        startDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    // Récupérer les données de revenus
    const [
      monthlyRevenue,
      topServices,
      topContacts,
      revenueByQuoteStatus
    ] = await Promise.all([
      // Revenus mensuels
      prisma.quote.findMany({
        where: {
          userId: req.user!.id,
          statut: 'ACCEPTE',
          dateAcceptation: { gte: startDate },
        },
        select: {
          total: true,
          dateAcceptation: true,
        },
      }),
      
      // Top services par revenus
      prisma.quoteItem.groupBy({
        by: ['serviceId'],
        where: {
          quote: {
            userId: req.user!.id,
            statut: 'ACCEPTE',
            dateAcceptation: { gte: startDate },
          },
          serviceId: { not: null },
        },
        _sum: {
          total: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            total: 'desc',
          },
        },
        take: 10,
      }),
      
      // Top contacts par revenus
      prisma.quote.groupBy({
        by: ['contactId'],
        where: {
          userId: req.user!.id,
          statut: 'ACCEPTE',
          dateAcceptation: { gte: startDate },
        },
        _sum: {
          total: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            total: 'desc',
          },
        },
        take: 10,
      }),
      
      // Analyse des statuts de devis
      prisma.quote.groupBy({
        by: ['statut'],
        where: {
          userId: req.user!.id,
          dateCreation: { gte: startDate },
        },
        _sum: {
          total: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Enrichir les données des top services
    const enrichedTopServices = await Promise.all(
      topServices.map(async (item) => {
        const service = await prisma.service.findUnique({
          where: { id: item.serviceId! },
          select: { nom: true, categorie: true },
        });
        return {
          ...item,
          service,
        };
      })
    );

    // Enrichir les données des top contacts
    const enrichedTopContacts = await Promise.all(
      topContacts.map(async (item) => {
        const contact = await prisma.contact.findUnique({
          where: { id: item.contactId },
          select: { nom: true, prenom: true, entreprise: true },
        });
        return {
          ...item,
          contact,
        };
      })
    );

    // Grouper les revenus par mois
    const monthlyData = monthlyRevenue.reduce((acc: any, quote) => {
      const date = quote.dateAcceptation!;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[key]) {
        acc[key] = {
          month: key,
          revenue: 0,
          count: 0,
        };
      }
      
      acc[key].revenue += quote.total;
      acc[key].count += 1;
      
      return acc;
    }, {});

    const monthlyStats = Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));

    return res.json({
      success: true,
      data: {
        period,
        monthlyRevenue: monthlyStats,
        topServices: enrichedTopServices,
        topContacts: enrichedTopContacts,
        quoteStatusAnalysis: revenueByQuoteStatus,
        summary: {
          totalRevenue: monthlyRevenue.reduce((sum, q) => sum + q.total, 0),
          totalQuotes: monthlyRevenue.length,
          averageMonthlyRevenue: monthlyStats.length > 0 
            ? monthlyStats.reduce((sum: number, m: any) => sum + m.revenue, 0) / monthlyStats.length 
            : 0,
        },
      },
    });
  } catch (error) {
    logger.error('Erreur lors de l\'analyse des revenus:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};