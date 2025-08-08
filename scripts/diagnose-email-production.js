#!/usr/bin/env node

/**
 * Script de diagnostic des problèmes d'email en production
 * Vérifie la configuration Resend et identifie les problèmes
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTIC DES EMAILS EN PRODUCTION');
console.log('=====================================\n');

// 1. Vérifier les variables d'environnement
console.log('📋 Variables d\'environnement:');
console.log('----------------------------');

const requiredVars = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  NODE_ENV: process.env.NODE_ENV,
  RENDER: process.env.RENDER,
  IS_PULL_REQUEST: process.env.IS_PULL_REQUEST,
  RENDER_SERVICE_NAME: process.env.RENDER_SERVICE_NAME,
  TEST_EMAIL: process.env.TEST_EMAIL,
  FORCE_PRODUCTION_EMAIL: process.env.FORCE_PRODUCTION_EMAIL
};

let hasErrors = false;

Object.entries(requiredVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = key.includes('KEY') && value ? value.substring(0, 10) + '...' : (value || 'NON DÉFINI');
  console.log(`${status} ${key}: ${displayValue}`);
  
  if (!value && ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'].includes(key)) {
    hasErrors = true;
  }
});

// 2. Analyser les problèmes de configuration
console.log('\n🔎 Analyse des problèmes:');
console.log('------------------------');

const problems = [];

if (!process.env.RESEND_API_KEY) {
  problems.push({
    severity: 'CRITIQUE',
    issue: 'RESEND_API_KEY manquante',
    impact: 'Aucun email ne peut être envoyé',
    solution: 'Configurer RESEND_API_KEY dans les variables d\'environnement Render'
  });
}

if (!process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL === 'onboarding@resend.dev') {
  problems.push({
    severity: 'CRITIQUE',
    issue: 'RESEND_FROM_EMAIL invalide ou par défaut',
    impact: 'onboarding@resend.dev ne fonctionne qu\'en mode test',
    solution: 'Configurer un domaine vérifié dans Resend et utiliser cet email'
  });
}

// Détection du mode production
const isProduction = 
  process.env.NODE_ENV === 'production' || 
  process.env.RENDER === 'true' ||
  process.env.IS_PULL_REQUEST === 'false' ||
  process.env.RENDER_SERVICE_NAME === 'velocitaleads-api';

console.log(`\n🌍 Environnement détecté: ${isProduction ? 'PRODUCTION' : 'DÉVELOPPEMENT'}`);

if (isProduction && process.env.TEST_EMAIL) {
  problems.push({
    severity: 'AVERTISSEMENT',
    issue: 'TEST_EMAIL configuré en production',
    impact: 'Les emails pourraient être redirigés',
    solution: 'Supprimer TEST_EMAIL en production'
  });
}

// 3. Afficher les problèmes trouvés
if (problems.length > 0) {
  console.log('\n⚠️ PROBLÈMES DÉTECTÉS:');
  console.log('----------------------');
  
  problems.forEach((problem, index) => {
    console.log(`\n${index + 1}. [${problem.severity}] ${problem.issue}`);
    console.log(`   Impact: ${problem.impact}`);
    console.log(`   Solution: ${problem.solution}`);
  });
} else {
  console.log('\n✅ Aucun problème majeur détecté');
}

// 4. Vérifier le service utilisé
console.log('\n📧 Service d\'email utilisé:');
console.log('--------------------------');

const resendServicePath = path.join(__dirname, '../src/services/resendEmailService.ts');
const emailServicePath = path.join(__dirname, '../src/services/emailService.ts');
const contactControllerPath = path.join(__dirname, '../src/controllers/contactController.ts');

if (fs.existsSync(contactControllerPath)) {
  const controllerContent = fs.readFileSync(contactControllerPath, 'utf8');
  
  if (controllerContent.includes('resendEmailService')) {
    console.log('✅ Utilise resendEmailService (Resend API)');
    
    if (!process.env.RESEND_API_KEY) {
      console.log('❌ MAIS la clé API Resend n\'est pas configurée!');
    }
  } else if (controllerContent.includes('emailService')) {
    console.log('⚠️ Utilise emailService (SMTP legacy)');
    console.log('   Considérer la migration vers Resend pour une meilleure fiabilité');
  }
}

// 5. Générer un rapport
console.log('\n📊 RAPPORT DE DIAGNOSTIC:');
console.log('------------------------');

if (hasErrors) {
  console.log('❌ Configuration INVALIDE - Les emails ne fonctionneront pas');
  console.log('\n🔧 Actions requises:');
  console.log('1. Aller sur https://dashboard.render.com');
  console.log('2. Sélectionner le service velocitaleads-api');
  console.log('3. Aller dans Environment');
  console.log('4. Ajouter les variables manquantes:');
  console.log('   - RESEND_API_KEY: Obtenir depuis https://resend.com/api-keys');
  console.log('   - RESEND_FROM_EMAIL: Utiliser un domaine vérifié dans Resend');
  console.log('5. Déployer les changements');
} else {
  console.log('✅ Configuration semble correcte');
  console.log('\nSi les emails ne fonctionnent toujours pas:');
  console.log('1. Vérifier que le domaine est vérifié dans Resend');
  console.log('2. Vérifier les quotas Resend');
  console.log('3. Consulter les logs dans Resend Dashboard');
}

// 6. Test de connexion Resend (optionnel)
console.log('\n🧪 Test de connexion Resend:');
console.log('----------------------------');

if (process.env.RESEND_API_KEY) {
  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    console.log('✅ Connexion Resend initialisée');
    console.log('   Pour tester l\'envoi, exécutez: npm run test:email');
  } catch (error) {
    console.log('❌ Erreur lors de l\'initialisation Resend:', error.message);
  }
} else {
  console.log('⏭️ Test ignoré - RESEND_API_KEY manquante');
}

console.log('\n=====================================');
console.log('Diagnostic terminé.');
process.exit(hasErrors ? 1 : 0);