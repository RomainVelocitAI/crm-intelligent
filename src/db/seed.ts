import { PrismaClient, ContactStatus, QuoteStatus, InteractionType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from '@/config';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

// Données de test
const seedData = {
  users: [
    {
      email: 'admin@velocitalead.fr',
      password: 'Demo123!',
      nom: 'Martin',
      prenom: 'Jean',
      entreprise: 'Consulting Digital JM',
      siret: '12345678901234',
      telephone: '06 12 34 56 78',
      adresse: '123 Rue de la République',
      codePostal: '75001',
      ville: 'Paris',
      isPremium: true,
    },
  ],
  
  services: [
    {
      nom: 'Développement Web',
      description: 'Création de sites web modernes et responsives',
      prixUnitaire: 500,
      unite: 'jour',
      categorie: 'Développement',
    },
    {
      nom: 'Conseil Stratégique',
      description: 'Accompagnement stratégique digital',
      prixUnitaire: 800,
      unite: 'jour',
      categorie: 'Conseil',
    },
    {
      nom: 'Formation',
      description: 'Formation aux outils numériques',
      prixUnitaire: 600,
      unite: 'jour',
      categorie: 'Formation',
    },
    {
      nom: 'Maintenance',
      description: 'Maintenance et mise à jour',
      prixUnitaire: 100,
      unite: 'heure',
      categorie: 'Support',
    },
  ],
  
  contacts: [
    {
      nom: 'Dubois',
      prenom: 'Marie',
      email: 'marie.dubois@entreprise.fr',
      telephone: '01 23 45 67 89',
      entreprise: 'Tech Innovations',
      poste: 'Directrice Marketing',
      adresse: '45 Avenue des Champs',
      codePostal: '75008',
      ville: 'Paris',
      statut: ContactStatus.CLIENT_ACTIF,
    },
    {
      nom: 'Leroy',
      prenom: 'Pierre',
      email: 'pierre.leroy@startup.com',
      telephone: '06 98 76 54 32',
      entreprise: 'StartUp Innovante',
      poste: 'CEO',
      adresse: '78 Rue de Rivoli',
      codePostal: '75004',
      ville: 'Paris',
      statut: ContactStatus.PROSPECT_CHAUD,
    },
    {
      nom: 'Bernard',
      prenom: 'Sophie',
      email: 'sophie.bernard@conseil.fr',
      telephone: '02 34 56 78 90',
      entreprise: 'Conseil & Stratégie',
      poste: 'Consultante',
      adresse: '12 Place Vendôme',
      codePostal: '75001',
      ville: 'Paris',
      statut: ContactStatus.PROSPECT_TIEDE,
    },
  ],
};

async function main() {
  try {
    logger.info('🌱 Début du seeding de la base de données...');

    // Nettoyer la base de données
    await prisma.emailTracking.deleteMany();
    await prisma.interaction.deleteMany();
    await prisma.quoteItem.deleteMany();
    await prisma.quote.deleteMany();
    await prisma.service.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.user.deleteMany();

    logger.info('🧹 Base de données nettoyée');

    // Créer l'utilisateur de demo
    const hashedPassword = await bcrypt.hash(seedData.users[0].password, config.security.bcryptRounds);
    
    const user = await prisma.user.create({
      data: {
        ...seedData.users[0],
        password: hashedPassword,
      },
    });

    logger.info(`👤 Utilisateur créé: ${user.email}`);

    // Créer les services
    const services = await Promise.all(
      seedData.services.map(service =>
        prisma.service.create({
          data: {
            ...service,
            userId: user.id,
          },
        })
      )
    );

    logger.info(`🔧 ${services.length} services créés`);

    // Créer les contacts
    const contacts = await Promise.all(
      seedData.contacts.map(contact =>
        prisma.contact.create({
          data: {
            ...contact,
            userId: user.id,
            derniereInteraction: new Date(),
          },
        })
      )
    );

    logger.info(`📞 ${contacts.length} contacts créés`);

    // Créer des devis d'exemple
    const quotes = [];
    
    // Devis accepté pour Marie Dubois
    const quote1 = await prisma.quote.create({
      data: {
        userId: user.id,
        contactId: contacts[0].id,
        numero: 'DEV-2024-0001',
        objet: 'Refonte du site web corporate',
        statut: QuoteStatus.ACCEPTE,
        dateValidite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        dateEnvoi: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        dateAcceptation: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        sousTotal: 5000,
        tva: 1000,
        total: 6000,
        conditions: 'Paiement à 30 jours. 50% à la commande, 50% à la livraison.',
        notes: 'Projet prioritaire avec deadline serrée.',
        items: {
          create: [
            {
              serviceId: services[0].id,
              designation: 'Développement site web',
              description: 'Développement complet du site vitrine avec CMS',
              quantite: 8,
              prixUnitaire: 500,
              total: 4000,
              ordre: 1,
            },
            {
              serviceId: services[1].id,
              designation: 'Conseil stratégique',
              description: 'Audit et recommandations UX/UI',
              quantite: 1,
              prixUnitaire: 800,
              total: 800,
              ordre: 2,
            },
            {
              serviceId: services[2].id,
              designation: 'Formation équipe',
              description: 'Formation à l\'utilisation du CMS',
              quantite: 0.5,
              prixUnitaire: 600,
              total: 300,
              ordre: 3,
            },
          ],
        },
      },
    });
    quotes.push(quote1);

    // Devis envoyé pour Pierre Leroy
    const quote2 = await prisma.quote.create({
      data: {
        userId: user.id,
        contactId: contacts[1].id,
        numero: 'DEV-2024-0002',
        objet: 'Application mobile startup',
        statut: QuoteStatus.ENVOYE,
        dateValidite: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        dateEnvoi: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        sousTotal: 8000,
        tva: 1600,
        total: 9600,
        conditions: 'Développement en 3 phases. Paiement échelonné.',
        items: {
          create: [
            {
              serviceId: services[0].id,
              designation: 'Développement MVP',
              description: 'Développement de la version minimale viable',
              quantite: 15,
              prixUnitaire: 500,
              total: 7500,
              ordre: 1,
            },
            {
              serviceId: services[1].id,
              designation: 'Audit technique',
              description: 'Analyse de faisabilité et architecture',
              quantite: 1,
              prixUnitaire: 800,
              total: 800,
              ordre: 2,
            },
          ],
        },
      },
    });
    quotes.push(quote2);

    // Devis en brouillon pour Sophie Bernard
    const quote3 = await prisma.quote.create({
      data: {
        userId: user.id,
        contactId: contacts[2].id,
        numero: 'DEV-2024-0003',
        objet: 'Optimisation processus métier',
        statut: QuoteStatus.PRET,
        dateValidite: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        sousTotal: 2400,
        tva: 480,
        total: 2880,
        items: {
          create: [
            {
              serviceId: services[1].id,
              designation: 'Audit processus',
              description: 'Analyse complète des processus existants',
              quantite: 2,
              prixUnitaire: 800,
              total: 1600,
              ordre: 1,
            },
            {
              serviceId: services[2].id,
              designation: 'Formation équipe',
              description: 'Formation aux nouvelles méthodes',
              quantite: 1,
              prixUnitaire: 600,
              total: 600,
              ordre: 2,
            },
            {
              serviceId: services[3].id,
              designation: 'Support mise en place',
              description: 'Accompagnement pendant 2 mois',
              quantite: 20,
              prixUnitaire: 100,
              total: 2000,
              ordre: 3,
            },
          ],
        },
      },
    });
    quotes.push(quote3);

    // Devis 4 - Brouillon (nouveau workflow)
    const quote4 = await prisma.quote.create({
      data: {
        userId: user.id,
        contactId: contacts[1].id,
        numero: 'DEV-2024-0004',
        objet: 'Migration données et formation équipe',
        statut: QuoteStatus.BROUILLON,
        dateValidite: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        sousTotal: 3200,
        tva: 640,
        total: 3840,
        conditions: 'Formation en présentiel sur 2 jours. Support inclus pendant 3 mois.',
        notes: 'Devis en cours de finalisation - en attente des détails techniques.',
        items: {
          create: [
            {
              serviceId: services[2].id,
              designation: 'Migration de données',
              description: 'Transfer sécurisé des données existantes',
              quantite: 1,
              prixUnitaire: 1500,
              total: 1500,
              ordre: 1,
            },
            {
              serviceId: services[1].id,
              designation: 'Formation équipe',
              description: 'Formation personnalisée sur 2 jours',
              quantite: 2,
              prixUnitaire: 850,
              total: 1700,
              ordre: 2,
            },
          ],
        },
      },
    });
    quotes.push(quote4);

    logger.info(`📄 ${quotes.length} devis créés`);

    // Créer des interactions
    const interactions = await Promise.all([
      // Interactions pour Marie Dubois
      prisma.interaction.create({
        data: {
          contactId: contacts[0].id,
          type: InteractionType.EMAIL,
          objet: 'Premier contact',
          description: 'Réponse à la demande de devis',
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.interaction.create({
        data: {
          contactId: contacts[0].id,
          type: InteractionType.REUNION,
          objet: 'Réunion de cadrage',
          description: 'Définition des besoins et du périmètre',
          date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.interaction.create({
        data: {
          contactId: contacts[0].id,
          type: InteractionType.DEVIS,
          objet: 'Envoi du devis',
          description: 'Devis DEV-2024-0001 envoyé',
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      }),
      
      // Interactions pour Pierre Leroy
      prisma.interaction.create({
        data: {
          contactId: contacts[1].id,
          type: InteractionType.TELEPHONE,
          objet: 'Appel de prospection',
          description: 'Discussion sur les besoins en développement mobile',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.interaction.create({
        data: {
          contactId: contacts[1].id,
          type: InteractionType.DEVIS,
          objet: 'Envoi du devis mobile',
          description: 'Devis DEV-2024-0002 envoyé',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    logger.info(`💬 ${interactions.length} interactions créées`);

    // Créer des données de tracking email
    await prisma.emailTracking.createMany({
      data: [
        {
          quoteId: quote1.id,
          email: contacts[0].email,
          ouvert: true,
          dateOuverture: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
          nombreOuvertures: 3,
          clique: true,
          dateClique: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          nombreCliques: 1,
        },
        {
          quoteId: quote2.id,
          email: contacts[1].email,
          ouvert: true,
          dateOuverture: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          nombreOuvertures: 2,
          clique: false,
          nombreCliques: 0,
        },
      ],
    });

    logger.info('📧 Données de tracking email créées');

    // Mettre à jour les métriques des contacts
    await prisma.contact.update({
      where: { id: contacts[0].id },
      data: {
        chiffresAffairesTotal: 6000,
        tauxConversion: 100,
        panierMoyen: 6000,
        scoreValeur: 85,
        dernierAchat: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.contact.update({
      where: { id: contacts[1].id },
      data: {
        chiffresAffairesTotal: 0,
        tauxConversion: 0,
        panierMoyen: 0,
        scoreValeur: 65,
      },
    });

    await prisma.contact.update({
      where: { id: contacts[2].id },
      data: {
        chiffresAffairesTotal: 0,
        tauxConversion: 0,
        panierMoyen: 0,
        scoreValeur: 45,
      },
    });

    logger.info('📊 Métriques des contacts mises à jour');

    logger.info('✅ Seeding terminé avec succès !');
    logger.info(`
🎉 Données de démo créées :
   - Utilisateur : ${user.email} (mot de passe: Demo123!)
   - ${services.length} services
   - ${contacts.length} contacts
   - ${quotes.length} devis
   - ${interactions.length} interactions
   
🚀 Vous pouvez maintenant démarrer l'application !
    `);

  } catch (error) {
    logger.error('❌ Erreur lors du seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    logger.error('Erreur fatale lors du seeding:', e);
    process.exit(1);
  });