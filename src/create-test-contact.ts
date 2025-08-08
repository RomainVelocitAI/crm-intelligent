import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestContact() {
  try {
    // Create a test contact for the first user
    const contact = await prisma.contact.create({
      data: {
        userId: 'clzxtest001',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@example.com',
        telephone: '0123456789',
        entreprise: 'Test Company',
        poste: 'Manager',
        adresse: '123 rue de la Paix',
        codePostal: '75001',
        ville: 'Paris',
        pays: 'France',
        notes: 'Contact de test pour vérifier l\'envoi d\'emails',
        statut: 'PROSPECT_TIEDE',
        derniereInteraction: new Date(),
      },
    });
    
    console.log('Test contact created:', contact);
    
    // Also create an interaction
    await prisma.interaction.create({
      data: {
        contactId: contact.id,
        type: 'AUTRE',
        objet: 'Contact créé pour test',
        description: 'Contact de test pour vérifier le système d\'envoi d\'emails',
      },
    });
    
    console.log('Contact ID:', contact.id);
    console.log('You can now test the endpoint with:');
    console.log(`curl -X POST http://localhost:3001/api/contacts/${contact.id}/send-email`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestContact();