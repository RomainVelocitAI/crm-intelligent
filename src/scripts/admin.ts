#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { cleanupOldPDFs } from '@/services/pdfService';

const prisma = new PrismaClient();

// Fonction pour créer un utilisateur admin
export const createAdminUser = async (
  email: string,
  password: string,
  nom: string,
  prenom: string,
  entreprise?: string
) => {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`❌ L'utilisateur ${email} existe déjà`);
      return;
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
        isPremium: true, // Les admins sont automatiquement premium
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

    console.log(`✅ Utilisateur admin créé avec succès:`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Nom: ${user.prenom} ${user.nom}`);
    console.log(`   - Entreprise: ${user.entreprise || 'N/A'}`);
    console.log(`   - Premium: ${user.isPremium ? 'Oui' : 'Non'}`);
    console.log(`   - Créé le: ${user.createdAt.toLocaleString('fr-FR')}`);

    return user;
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur admin:', error);
    throw error;
  }
};

// Fonction pour lister tous les utilisateurs
export const listUsers = async () => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        entreprise: true,
        isPremium: true,
        createdAt: true,
        _count: {
          select: {
            contacts: true,
            quotes: true,
            services: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`\n📊 ${users.length} utilisateur(s) trouvé(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.prenom} ${user.nom} (${user.email})`);
      console.log(`   - Entreprise: ${user.entreprise || 'N/A'}`);
      console.log(`   - Premium: ${user.isPremium ? 'Oui' : 'Non'}`);
      console.log(`   - Contacts: ${user._count.contacts}`);
      console.log(`   - Devis: ${user._count.quotes}`);
      console.log(`   - Services: ${user._count.services}`);
      console.log(`   - Créé le: ${user.createdAt.toLocaleString('fr-FR')}`);
      console.log('');
    });

    return users;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
};

// Fonction pour supprimer un utilisateur et toutes ses données
export const deleteUser = async (email: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        _count: {
          select: {
            contacts: true,
            quotes: true,
            services: true,
          },
        },
      },
    });

    if (!user) {
      console.log(`❌ Utilisateur ${email} non trouvé`);
      return;
    }

    console.log(`⚠️  Suppression de l'utilisateur ${user.prenom} ${user.nom} (${user.email})`);
    console.log(`   - ${user._count.contacts} contact(s)`);
    console.log(`   - ${user._count.quotes} devis`);
    console.log(`   - ${user._count.services} service(s)`);

    // Demander confirmation (en mode interactif)
    if (process.stdout.isTTY) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question('Êtes-vous sûr de vouloir supprimer cet utilisateur ? (oui/non): ', resolve);
      });

      rl.close();

      if (answer.toLowerCase() !== 'oui') {
        console.log('❌ Suppression annulée');
        return;
      }
    }

    // Supprimer l'utilisateur (cascade automatique)
    await prisma.user.delete({
      where: { email },
    });

    console.log(`✅ Utilisateur ${email} supprimé avec succès`);
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'utilisateur:', error);
    throw error;
  }
};

// Fonction pour nettoyer la base de données
export const cleanupDatabase = async () => {
  try {
    console.log('🧹 Nettoyage de la base de données...');

    // Supprimer les anciens PDFs
    await cleanupOldPDFs(24); // Supprimer les PDFs de plus de 24h

    // Supprimer les logs de tracking de plus de 1 an
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const deletedTracking = await prisma.emailTracking.deleteMany({
      where: {
        createdAt: {
          lt: oneYearAgo,
        },
      },
    });

    // Supprimer les interactions de plus de 2 ans
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const deletedInteractions = await prisma.interaction.deleteMany({
      where: {
        date: {
          lt: twoYearsAgo,
        },
      },
    });

    console.log(`✅ Nettoyage terminé:`);
    console.log(`   - ${deletedTracking.count} enregistrement(s) de tracking supprimé(s)`);
    console.log(`   - ${deletedInteractions.count} interaction(s) supprimée(s)`);
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  }
};

// Fonction pour afficher les statistiques globales
export const showStats = async () => {
  try {
    const [
      totalUsers,
      totalContacts,
      totalQuotes,
      totalServices,
      totalRevenue,
      premiumUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.contact.count(),
      prisma.quote.count(),
      prisma.service.count(),
      prisma.quote.aggregate({
        where: { statut: 'ACCEPTE' },
        _sum: { total: true },
      }),
      prisma.user.count({ where: { isPremium: true } }),
    ]);

    console.log(`\n📈 Statistiques globales VelocitaLeads:\n`);
    console.log(`👥 Utilisateurs: ${totalUsers} (dont ${premiumUsers} Premium)`);
    console.log(`📞 Contacts: ${totalContacts}`);
    console.log(`📄 Devis: ${totalQuotes}`);
    console.log(`🔧 Services: ${totalServices}`);
    console.log(`💰 Chiffre d'affaires total: ${(totalRevenue._sum.total || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
    console.log(`📊 CA moyen par utilisateur: ${totalUsers > 0 ? ((totalRevenue._sum.total || 0) / totalUsers).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '0 €'}`);
    console.log('');

    // Statistiques par mois (3 derniers mois)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const monthlyStats = await prisma.quote.groupBy({
      by: ['dateCreation'],
      where: {
        dateCreation: { gte: threeMonthsAgo },
      },
      _count: { id: true },
      _sum: { total: true },
    });

    console.log(`📅 Activité des 3 derniers mois:`);
    monthlyStats.forEach(stat => {
      const month = stat.dateCreation.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
      console.log(`   - ${month}: ${stat._count.id} devis, ${(stat._sum.total || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    throw error;
  }
};

// Fonction pour réinitialiser les métriques des contacts
export const recalculateContactMetrics = async (userId?: string) => {
  try {
    console.log('🔄 Recalcul des métriques des contacts...');

    const whereClause = userId ? { userId } : {};
    const contacts = await prisma.contact.findMany({
      where: whereClause,
      include: {
        quotes: {
          include: {
            emailTracking: true,
          },
        },
      },
    });

    let updatedCount = 0;

    for (const contact of contacts) {
      const acceptedQuotes = contact.quotes.filter(q => q.statut === 'ACCEPTE');
      const sentQuotes = contact.quotes.filter(q => ['ENVOYE', 'VU', 'ACCEPTE', 'REFUSE', 'EXPIRE'].includes(q.statut));

      const chiffresAffairesTotal = acceptedQuotes.reduce((sum, quote) => sum + quote.total, 0);
      const tauxConversion = sentQuotes.length > 0 ? (acceptedQuotes.length / sentQuotes.length) * 100 : 0;
      const panierMoyen = acceptedQuotes.length > 0 ? chiffresAffairesTotal / acceptedQuotes.length : 0;

      // Calcul du score de valeur
      const dernierAchat = acceptedQuotes.length > 0 ? Math.max(...acceptedQuotes.map(q => q.dateAcceptation?.getTime() || 0)) : null;
      const recenceScore = dernierAchat ? Math.max(0, 100 - ((Date.now() - dernierAchat) / (1000 * 60 * 60 * 24 * 30))) : 0;
      const frequenceScore = Math.min(100, acceptedQuotes.length * 10);
      const caScore = Math.min(100, chiffresAffairesTotal / 1000);

      const scoreValeur = (caScore * 0.4) + (recenceScore * 0.3) + (frequenceScore * 0.2) + (tauxConversion * 0.1);

      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          chiffresAffairesTotal,
          tauxConversion,
          panierMoyen,
          scoreValeur,
          dernierAchat: dernierAchat ? new Date(dernierAchat) : null,
        },
      });

      updatedCount++;
    }

    console.log(`✅ ${updatedCount} contact(s) mis à jour`);
  } catch (error) {
    console.error('❌ Erreur lors du recalcul des métriques:', error);
    throw error;
  }
};

// CLI interface
const main = async () => {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'create-admin':
        if (args.length < 4) {
          console.log('Usage: npm run admin create-admin <email> <password> <nom> <prenom> [entreprise]');
          process.exit(1);
        }
        await createAdminUser(args[0], args[1], args[2], args[3], args[4]);
        break;

      case 'list-users':
        await listUsers();
        break;

      case 'delete-user':
        if (args.length < 1) {
          console.log('Usage: npm run admin delete-user <email>');
          process.exit(1);
        }
        await deleteUser(args[0]);
        break;

      case 'cleanup':
        await cleanupDatabase();
        break;

      case 'stats':
        await showStats();
        break;

      case 'recalculate-metrics':
        await recalculateContactMetrics(args[0]);
        break;

      default:
        console.log(`
🛠️  VelocitaLeads - Scripts d'administration

Commandes disponibles:
  create-admin <email> <password> <nom> <prenom> [entreprise]  Créer un utilisateur admin
  list-users                                                  Lister tous les utilisateurs
  delete-user <email>                                         Supprimer un utilisateur
  cleanup                                                     Nettoyer la base de données
  stats                                                       Afficher les statistiques
  recalculate-metrics [userId]                               Recalculer les métriques des contacts

Exemples:
  npm run admin create-admin admin@velocitalead.fr motdepasse Admin Admin "VelocitaLeads"
  npm run admin list-users
  npm run admin stats
  npm run admin cleanup
        `);
        break;
    }
  } catch (error) {
    logger.error('Erreur dans le script admin:', error);
    console.error('❌ Une erreur est survenue. Consultez les logs pour plus de détails.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}

export default {
  createAdminUser,
  listUsers,
  deleteUser,
  cleanupDatabase,
  showStats,
  recalculateContactMetrics,
};