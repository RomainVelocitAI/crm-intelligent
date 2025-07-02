import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '@/middleware/auth';
import { logger } from '@/utils/logger';
import { updateUserOnboardingInAirtable } from '@/services/airtableService';

const prisma = new PrismaClient();

// Validation pour l'onboarding - simplifiée
export const onboardingValidation = [
  body('businessType').optional().isString().withMessage('Type d\'entreprise invalide'),
  body('sector').optional().isString().withMessage('Secteur invalide'),
  body('siret').optional().isString().withMessage('SIRET invalide'),
  body('annualTarget').optional().isNumeric().withMessage('Objectif annuel invalide'),
  body('monthlyTarget').optional().isNumeric().withMessage('Objectif mensuel invalide'),
  body('followUpFrequency').optional().isInt({ min: 1, max: 30 }).withMessage('Fréquence de relance invalide (1-30 jours)'),
  body('notificationSettings').optional().isObject().withMessage('Paramètres de notification invalides'),
];

// Sauvegarder les données d'onboarding
export const saveOnboarding = async (req: AuthRequest, res: Response) => {
  try {
    logger.info('Début saveOnboarding - Body reçu:', req.body);
    logger.info('Utilisateur:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Erreurs de validation:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array(),
      });
    }

    const {
      businessType,
      sector, 
      siret,
      annualTarget,
      monthlyTarget,
      followUpFrequency,
      emailTemplates,
      notificationSettings
    } = req.body;

    // Calculer monthlyTarget automatiquement si non fourni
    const calculatedMonthlyTarget = monthlyTarget || (annualTarget ? annualTarget / 12 : null);

    logger.info(`Début onboarding pour l'utilisateur ${req.user!.id}`);

    // 1. Sauvegarder dans PostgreSQL d'abord
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: req.user!.id },
      update: {
        businessType,
        sector,
        siret,
        annualTarget: annualTarget ? parseFloat(annualTarget) : 50000,
        monthlyTarget: calculatedMonthlyTarget ? parseFloat(calculatedMonthlyTarget) : 4166.67,
        followUpFrequency: followUpFrequency || 7,
        emailTemplates: emailTemplates || null,
        notificationSettings: notificationSettings || {
          emailAlerts: true,
          dashboardReminders: true,
          weeklyReport: true
        },
        onboardingCompleted: true,
        updatedAt: new Date(),
      },
      create: {
        userId: req.user!.id,
        businessType,
        sector,
        siret,
        annualTarget: annualTarget ? parseFloat(annualTarget) : 50000,
        monthlyTarget: calculatedMonthlyTarget ? parseFloat(calculatedMonthlyTarget) : 4166.67,
        followUpFrequency: followUpFrequency || 7,
        emailTemplates: emailTemplates || null,
        notificationSettings: notificationSettings || {
          emailAlerts: true,
          dashboardReminders: true,
          weeklyReport: true
        },
        onboardingCompleted: true,
      },
    });

    logger.info(`Onboarding sauvegardé en PostgreSQL pour l'utilisateur ${req.user!.id}`);

    // 2. Ensuite sauvegarder dans Airtable (non bloquant)
    try {
      const success = await updateUserOnboardingInAirtable(req.user!, {
        businessType,
        sector,
        siret,
        annualTarget: annualTarget ? parseFloat(annualTarget) : 50000,
        monthlyTarget: calculatedMonthlyTarget ? parseFloat(calculatedMonthlyTarget) : 4166.67,
        followUpFrequency: followUpFrequency || 7,
        notificationSettings: notificationSettings || {
          emailAlerts: true,
          dashboardReminders: true,
          weeklyReport: true
        }
      });
      
      if (success) {
        logger.info(`Onboarding synchronisé avec Airtable pour l'utilisateur ${req.user!.id}`);
      } else {
        logger.warn(`Échec synchronisation Airtable (non bloquant) pour l'utilisateur ${req.user!.id}`);
      }
    } catch (airtableError) {
      logger.error('Erreur lors de la synchronisation Airtable (non bloquante):', airtableError);
    }

    return res.json({
      success: true,
      message: 'Onboarding complété avec succès',
      data: preferences,
    });
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde de l\'onboarding:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

// Récupérer les préférences utilisateur
export const getUserPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: req.user!.id },
    });

    if (!preferences) {
      return res.json({
        success: true,
        data: {
          onboardingCompleted: false,
          preferences: null,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        onboardingCompleted: preferences.onboardingCompleted,
        preferences,
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des préférences:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

// Mettre à jour les préférences utilisateur
export const updateUserPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array(),
      });
    }

    const {
      businessType,
      sector,
      siret,
      annualTarget,
      monthlyTarget,
      followUpFrequency,
      emailTemplates,
      notificationSettings,
      tutorialPreferences
    } = req.body;

    // Créer les données à mettre à jour (seulement les champs fournis)
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (businessType !== undefined) updateData.businessType = businessType;
    if (sector !== undefined) updateData.sector = sector;
    if (siret !== undefined) updateData.siret = siret;
    if (annualTarget !== undefined) updateData.annualTarget = parseFloat(annualTarget);
    if (monthlyTarget !== undefined) updateData.monthlyTarget = parseFloat(monthlyTarget);
    if (followUpFrequency !== undefined) updateData.followUpFrequency = followUpFrequency;
    if (emailTemplates !== undefined) updateData.emailTemplates = emailTemplates;
    if (notificationSettings !== undefined) updateData.notificationSettings = notificationSettings;
    if (tutorialPreferences !== undefined) updateData.tutorialPreferences = tutorialPreferences;

    // Upsert pour gérer le cas où les préférences n'existent pas encore
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        ...updateData,
      },
      update: updateData,
    });

    logger.info(`Préférences mises à jour pour l'utilisateur ${req.user!.id}`, { 
      updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt')
    });

    return res.json({
      success: true,
      message: 'Préférences mises à jour avec succès',
      data: preferences,
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour des préférences:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

// Sauvegarder la progression du tutorial
export const saveTutorialProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { tutorialStep, completed, progress } = req.body;

    if (!tutorialStep) {
      return res.status(400).json({
        success: false,
        message: 'Étape du tutorial requise',
      });
    }

    // Récupérer les préférences existantes
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: req.user!.id },
    });

    // Créer les préférences si elles n'existent pas
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          userId: req.user!.id,
          tutorialProgress: {
            [tutorialStep]: { completed, progress, completedAt: new Date() }
          },
        },
      });
    } else {
      // Mettre à jour la progression du tutorial
      const currentProgress = preferences.tutorialProgress as any || {};
      currentProgress[tutorialStep] = {
        completed,
        progress,
        completedAt: new Date()
      };

      preferences = await prisma.userPreferences.update({
        where: { userId: req.user!.id },
        data: {
          tutorialProgress: currentProgress,
          updatedAt: new Date(),
        },
      });
    }

    return res.json({
      success: true,
      message: 'Progression du tutorial sauvegardée',
      data: preferences.tutorialProgress,
    });
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde de la progression du tutorial:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

// Récupérer la progression du tutorial
export const getTutorialProgress = async (req: AuthRequest, res: Response) => {
  try {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: req.user!.id },
      select: { tutorialProgress: true },
    });

    return res.json({
      success: true,
      data: preferences?.tutorialProgress || {},
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération de la progression du tutorial:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};