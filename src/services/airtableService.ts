import Airtable from 'airtable';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// Initialiser Airtable avec la clé API
const initAirtable = () => {
  if (!config.airtable?.apiKey || !config.airtable?.baseId) {
    throw new Error('Configuration Airtable manquante (apiKey ou baseId)');
  }
  
  return new Airtable({ apiKey: config.airtable.apiKey }).base(config.airtable.baseId);
};

// Envoyer les données d'un nouvel utilisateur à Airtable
export const saveUserToAirtable = async (user: any): Promise<boolean> => {
  try {
    if (!config.airtable?.enabled) {
      logger.info('Intégration Airtable désactivée, utilisateur non enregistré');
      return false;
    }

    const base = initAirtable();
    const tableName = config.airtable.usersTable || 'Users';

    // Créer un enregistrement dans Airtable
    const record = await base(tableName).create({
      'Email': user.email,
      'Nom': user.nom || user.lastName || '',
      'Prénom': user.prenom || user.firstName || '',
      'Entreprise': user.entreprise || user.company || '',
      'Source': 'CRM Direct',
      'Opt-in Marketing': true, // Par défaut, l'utilisateur accepte de recevoir des emails marketing
      'Notes': `Utilisateur inscrit via VelocitaLeads CRM. ID: ${user.id}`,
      'ID CRM': user.id?.toString() || '',
    });

    logger.info('Utilisateur enregistré dans Airtable avec succès', {
      userId: user.id,
      airtableId: record.id,
    });

    return true;
  } catch (error) {
    logger.error('Erreur lors de l\'enregistrement de l\'utilisateur dans Airtable:', error);
    return false;
  }
};

// Mettre à jour les données d'onboarding dans Airtable
export const updateUserOnboardingInAirtable = async (user: any, onboardingData: any): Promise<boolean> => {
  try {
    if (!config.airtable?.enabled) {
      logger.info('Intégration Airtable désactivée, onboarding non synchronisé');
      return false;
    }

    const base = initAirtable();
    const tableName = config.airtable.usersTable || 'Users';

    // Chercher l'utilisateur existant par email ou ID CRM
    const records = await base(tableName).select({
      filterByFormula: `OR({Email} = '${user.email}', {ID CRM} = '${user.id}')`
    }).firstPage();

    if (records.length === 0) {
      logger.warn('Utilisateur non trouvé dans Airtable pour mise à jour onboarding', { userId: user.id });
      return false;
    }

    const userRecord = records[0];
    if (!userRecord) {
      logger.warn('Aucun enregistrement trouvé dans Airtable pour mise à jour onboarding', { userId: user.id });
      return false;
    }

    // Préparer les données d'onboarding pour Airtable (champs existants uniquement)
    const updateData: any = {
      'Source': 'CRM Direct',
      'Notes': `Onboarding complété le ${new Date().toLocaleDateString('fr-FR')}\n` +
               `Business: ${onboardingData.businessType || 'Non spécifié'}\n` +
               `Secteur: ${onboardingData.sector || 'Non spécifié'}\n` +
               `SIRET: ${onboardingData.siret || 'Non fourni'}\n` +
               `Objectif annuel: ${onboardingData.annualTarget || 0}€\n` +
               `Fréquence relance: ${onboardingData.followUpFrequency || 7} jours\n` +
               `Alertes email: ${onboardingData.notificationSettings?.emailAlerts ? 'Oui' : 'Non'}\n` +
               `Rappels dashboard: ${onboardingData.notificationSettings?.dashboardReminders ? 'Oui' : 'Non'}\n` +
               `Rapport hebdo: ${onboardingData.notificationSettings?.weeklyReport ? 'Oui' : 'Non'}`,
    };

    // Mettre à jour l'enregistrement
    await base(tableName).update(userRecord.id, updateData);

    logger.info('Données d\'onboarding mises à jour dans Airtable avec succès', {
      userId: user.id,
      airtableId: userRecord.id,
    });

    return true;
  } catch (error) {
    logger.error('Erreur lors de la mise à jour de l\'onboarding dans Airtable:', error);
    return false;
  }
};

export default {
  saveUserToAirtable,
  updateUserOnboardingInAirtable,
};