import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function getDataInfo() {
  try {
    // Récupérer l'utilisateur avec l'email spécifié
    const user = await prisma.user.findUnique({
      where: {
        email: 'direction@velocit-ai.fr'
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        password: true
      }
    });

    console.log('\n=== Informations Utilisateur ===');
    if (user) {
      console.log('User ID:', user.id);
      console.log('Email:', user.email);
      console.log('Nom complet:', user.prenom, user.nom);
      console.log('Has Password:', user.password ? 'Oui' : 'Non');
      
      // Récupérer les contacts de cet utilisateur
      const contacts = await prisma.contact.findMany({
        where: {
          userId: user.id
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          statut: true
        },
        take: 5
      });

      console.log('\n=== Contacts de l\'utilisateur (5 premiers) ===');
      if (contacts.length > 0) {
        contacts.forEach(contact => {
          console.log(`- ${contact.prenom} ${contact.nom} (${contact.email})`);
          console.log(`  ID: ${contact.id}`);
          console.log(`  Status: ${contact.statut}`);
          console.log('');
        });
      } else {
        console.log('Aucun contact trouvé');
      }

      // Créer un token de test si l'utilisateur existe
      if (!user.password) {
        console.log('\n=== Solution pour l\'authentification ===');
        console.log('L\'utilisateur utilise probablement Google Auth, pas de mot de passe défini.');
        console.log('Pour tester l\'API, vous devez :');
        console.log('1. Utiliser l\'authentification Google dans l\'interface');
        console.log('2. Ou définir un mot de passe temporaire pour les tests');
      }
    } else {
      console.log('Utilisateur non trouvé');
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getDataInfo();