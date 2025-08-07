import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient, ContactStatus, QuoteStatus } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { generateTokens, verifyRefreshToken, AuthRequest } from '@/middleware/auth';
import { config } from '@/config';
import { logger, logAuth } from '@/utils/logger';
import { sendWelcomeEmail } from '@/services/resendEmailService';
import { saveUserToAirtable } from '@/services/airtableService';

const prisma = new PrismaClient();

// Fonction pour créer des données d'exemple pour les nouveaux utilisateurs
async function createExampleData(userId: string) {
  try {
    // Vérifier si l'utilisateur a déjà des données
    const existingContactsCount = await prisma.contact.count({
      where: { userId }
    });
    const existingServicesCount = await prisma.service.count({
      where: { userId }
    });

    // Ne créer les données d'exemple que si l'utilisateur n'a aucune donnée
    if (existingContactsCount === 0 && existingServicesCount === 0) {
      
      // Créer des services d'exemple
      const services = await Promise.all([
        prisma.service.create({
          data: {
            userId,
            nom: 'Consultation',
            description: 'Consultation stratégique personnalisée',
            prixUnitaire: 150,
            unite: 'heure',
            categorie: 'Conseil',
          }
        }),
        prisma.service.create({
          data: {
            userId,
            nom: 'Développement',
            description: 'Développement de solutions digitales',
            prixUnitaire: 600,
            unite: 'jour',
            categorie: 'Technique',
          }
        }),
        prisma.service.create({
          data: {
            userId,
            nom: 'Formation',
            description: 'Formation et accompagnement équipes',
            prixUnitaire: 500,
            unite: 'jour',
            categorie: 'Formation',
          }
        })
      ]);

      // Créer un contact d'exemple
      const contact = await prisma.contact.create({
        data: {
          userId,
          nom: 'Dupont',
          prenom: 'Sophie',
          email: 'sophie.dupont@exemple-entreprise.fr',
          telephone: '01 23 45 67 89',
          entreprise: 'Exemple Entreprise SAS',
          poste: 'Directrice Marketing',
          adresse: '15 Rue de la Innovation',
          codePostal: '75001',
          ville: 'Paris',
          statut: ContactStatus.PROSPECT_CHAUD,
          derniereInteraction: new Date(),
          chiffresAffairesTotal: 0,
          tauxConversion: 0,
          panierMoyen: 0,
          scoreValeur: 75,
        }
      });

      // Créer un devis d'exemple
      await prisma.quote.create({
        data: {
          userId,
          contactId: contact.id,
          numero: 'DEMO-001',
          objet: 'Consultation marketing digital',
          statut: QuoteStatus.PRET,
          dateValidite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
          sousTotal: 1200,
          tva: 240,
          total: 1440,
          conditions: 'Paiement à 30 jours. Acompte de 30% à la commande.',
          notes: 'Devis d\'exemple pour découvrir les fonctionnalités.',
          items: {
            create: [
              {
                serviceId: services[0].id, // Consultation
                designation: 'Audit stratégie digitale',
                description: 'Analyse complète de la présence digitale et recommandations',
                quantite: 8,
                prixUnitaire: 150,
                total: 1200,
                ordre: 1,
                conserver: false,
              }
            ]
          }
        }
      });

      logger.info(`Données d'exemple créées pour l'utilisateur ${userId}: ${services.length} services, 1 contact et 1 devis`);
    }
  } catch (error) {
    logger.error('Erreur lors de la création des données d\'exemple:', error);
    throw error;
  }
}

export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères'),
  body('nom').trim().isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('prenom').trim().isLength({ min: 2 }).withMessage('Le prénom doit contenir au moins 2 caractères'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
];

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array(),
      });
    }

    const { email, password, nom, prenom, entreprise, siret, telephone, adresse, codePostal, ville } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un compte avec cet email existe déjà',
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        entreprise,
        siret,
        telephone,
        adresse,
        codePostal,
        ville,
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        entreprise: true,
        isPremium: true,
        createdAt: true,
      },
    });

    // Générer les tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    logAuth('register', user.id, { email });

    // Envoyer un email de bienvenue (asynchrone, ne bloque pas l'inscription)
    sendWelcomeEmail({
      email: user.email,
      prenom: user.prenom,
      nom: user.nom,
      entreprise: user.entreprise,
    }).catch(error => {
      logger.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
    });

    // Enregistrer l'utilisateur dans Airtable pour l'emailing marketing (asynchrone)
    saveUserToAirtable(user).catch(error => {
      logger.error('Erreur lors de l\'enregistrement dans Airtable:', error);
    });

    // Créer des données d'exemple pour aider dans les tutoriels (asynchrone)
    createExampleData(user.id).catch(error => {
      logger.error('Erreur lors de la création des données d\'exemple:', error);
    });

    return res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Erreur lors de l\'inscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Générer les tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    logAuth('login', user.id, { email });

    return res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          entreprise: user.entreprise,
          isPremium: user.isPremium,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la connexion:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Token de rafraîchissement manquant',
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    
    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Générer de nouveaux tokens
    const tokens = generateTokens(user.id);

    logAuth('refresh_token', user.id);

    return res.json({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: tokens,
    });
  } catch (error) {
    logger.error('Erreur lors du rafraîchissement du token:', error);
    return res.status(401).json({
      success: false,
      message: 'Token de rafraîchissement invalide',
    });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        entreprise: true,
        siret: true,
        numeroTvaIntracommunautaire: true,
        telephone: true,
        adresse: true,
        codePostal: true,
        ville: true,
        pays: true,
        isPremium: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du profil:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { nom, prenom, entreprise, siret, numeroTvaIntracommunautaire, telephone, adresse, codePostal, ville } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        nom,
        prenom,
        entreprise,
        siret,
        numeroTvaIntracommunautaire,
        telephone,
        adresse,
        codePostal,
        ville,
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        entreprise: true,
        siret: true,
        numeroTvaIntracommunautaire: true,
        telephone: true,
        adresse: true,
        codePostal: true,
        ville: true,
        pays: true,
        isPremium: true,
        updatedAt: true,
      },
    });

    logAuth('update_profile', user.id);

    return res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: { user },
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du profil:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
      });
    }

    // Récupérer l'utilisateur avec le mot de passe
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Vérifier l'ancien mot de passe
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect',
      });
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    logAuth('change_password', user.id);

    return res.json({
      success: true,
      message: 'Mot de passe changé avec succès',
    });
  } catch (error) {
    logger.error('Erreur lors du changement de mot de passe:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
};