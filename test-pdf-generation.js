/**
 * Test de génération de PDF avec Puppeteer et PDFKit
 * Ce script teste la génération de devis PDF
 */

// Import du service PDF compilé
const pdfService = require('./dist/services/pdfService');
const fs = require('fs');
const path = require('path');

// Données de test pour un devis
const testQuoteData = {
  id: 'test-quote-001',
  numero: 'DEV-2024-0001',
  objet: 'Développement site web e-commerce',
  dateCreation: new Date('2024-07-01'),
  dateValidite: new Date('2024-08-01'),
  sousTotal: 5000.00,
  tva: 1000.00,
  total: 6000.00,
  conditions: 'Paiement à 30 jours. Acompte de 30% à la commande.',
  notes: 'Projet incluant la formation utilisateur.',
  user: {
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@velocit-ai.fr',
    entreprise: 'VelocitAI Solutions',
    siret: '12345678901234',
    telephone: '01 23 45 67 89',
    adresse: '123 Rue de la Tech',
    codePostal: '75001',
    ville: 'Paris',
    pays: 'France'
  },
  contact: {
    nom: 'Martin',
    prenom: 'Sophie',
    email: 'sophie.martin@client.com',
    entreprise: 'Client Corp',
    adresse: '456 Avenue du Commerce',
    codePostal: '69000',
    ville: 'Lyon',
    pays: 'France'
  },
  items: [
    {
      designation: 'Développement frontend React',
      description: 'Interface utilisateur responsive avec React et TypeScript',
      quantite: 1,
      prixUnitaire: 2500.00,
      total: 2500.00
    },
    {
      designation: 'Développement backend Node.js',
      description: 'API REST avec authentification et base de données',
      quantite: 1,
      prixUnitaire: 2000.00,
      total: 2000.00
    },
    {
      designation: 'Formation utilisateur',
      description: 'Session de formation de 4 heures',
      quantite: 1,
      prixUnitaire: 500.00,
      total: 500.00
    }
  ]
};

async function testPDFGeneration() {
  console.log('🚀 Début du test de génération PDF...');
  
  try {
    // Test 1: PDF basique avec PDFKit
    console.log('\n📄 Test 1: Génération PDF basique (PDFKit)');
    const basicPdfPath = await pdfService.generateQuotePDF(testQuoteData, {
      templateType: 'basic',
      isPremium: false,
      protectionLevel: 'none'
    });
    
    console.log('✅ PDF basique généré:', basicPdfPath);
    
    // Vérifier que le fichier existe
    if (fs.existsSync(basicPdfPath)) {
      const stats = fs.statSync(basicPdfPath);
      console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`);
    }
    
    // Test 2: PDF premium avec Puppeteer
    console.log('\n🎨 Test 2: Génération PDF premium (Puppeteer)');
    const premiumPdfPath = await pdfService.generateQuotePDF(testQuoteData, {
      templateType: 'premium',
      isPremium: true,
      protectionLevel: 'none',
      customBranding: {
        colors: {
          primary: '#007bff',
          secondary: '#6c757d'
        }
      }
    });
    
    console.log('✅ PDF premium généré:', premiumPdfPath);
    
    // Vérifier que le fichier existe
    if (fs.existsSync(premiumPdfPath)) {
      const stats = fs.statSync(premiumPdfPath);
      console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`);
    }
    
    console.log('\n🎉 Tous les tests PDF ont réussi !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test PDF:', error);
    process.exit(1);
  }
}

// Exécuter le test
if (require.main === module) {
  testPDFGeneration();
}

module.exports = { testPDFGeneration, testQuoteData };