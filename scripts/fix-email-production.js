#\!/usr/bin/env node

/**
 * Script de test SIMPLE et DIRECT pour identifier le problème email en production
 * PAS DE COMPLEXITÉ - JUSTE LES BASES
 */

import dotenv from 'dotenv';
import { Resend } from 'resend';

// Charger les variables d'environnement
dotenv.config();

console.log('===========================================');
console.log('     TEST EMAIL PRODUCTION - SIMPLE');
console.log('===========================================\n');

// 1. AFFICHER LES VARIABLES
console.log('📋 ÉTAPE 1: Variables d\'environnement');
console.log('--------------------------------------');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ DÉFINIE' : '❌ MANQUANTE');
console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || '❌ MANQUANTE');
console.log('NODE_ENV:', process.env.NODE_ENV || 'non défini');
console.log('RENDER:', process.env.RENDER || 'non défini');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ DÉFINIE' : '❌ MANQUANTE');

// 2. TEST DIRECT AVEC RESEND
console.log('\n📧 ÉTAPE 2: Test direct avec Resend');
console.log('--------------------------------------');

async function testDirect() {
  // Si pas de clé API, on arrête
  if (\!process.env.RESEND_API_KEY) {
    console.log('❌ IMPOSSIBLE: RESEND_API_KEY manquante\!');
    console.log('\n💡 SOLUTION:');
    console.log('1. Allez sur Render.com');
    console.log('2. Settings > Environment Variables');
    console.log('3. Ajoutez: RESEND_API_KEY = re_LNwfCezV_7TjNzz9EFJHWVS2HiyhwpAsf');
    return;
  }

  try {
    console.log('Initialisation de Resend...');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    console.log('Envoi de l\'email de test...');
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'contact@velocit-ai.fr',
      to: 'direction@velocit-ai.fr',
      subject: 'Test direct depuis production - ' + new Date().toLocaleString('fr-FR'),
      html: `
        <h2>Test Email Production</h2>
        <p>Si vous recevez ceci, Resend fonctionne en production\!</p>
        <hr>
        <p>Envoyé le: ${new Date().toLocaleString('fr-FR')}</p>
        <p>Environnement: ${process.env.NODE_ENV || 'inconnu'}</p>
        <p>Serveur: ${process.env.RENDER === 'true' ? 'Render' : 'Local'}</p>
      `
    });
    
    console.log('✅ SUCCÈS\! Email envoyé');
    console.log('ID du message:', result.data?.id);
    console.log('\n🎉 RESEND FONCTIONNE EN PRODUCTION\!');
    
  } catch (error) {
    console.log('❌ ÉCHEC de l\'envoi');
    console.log('Message d\'erreur:', error.message);
    
    // Analyser l'erreur pour donner des solutions
    if (error.message?.includes('API')) {
      console.log('\n💡 PROBLÈME: Clé API invalide');
      console.log('SOLUTION: Vérifiez la clé dans Render');
    } else if (error.message?.includes('from')) {
      console.log('\n💡 PROBLÈME: Email d\'envoi non vérifié');
      console.log('SOLUTION: Vérifiez contact@velocit-ai.fr dans Resend');
    } else if (error.message?.includes('DNS')) {
      console.log('\n💡 PROBLÈME: Domaine non configuré');
      console.log('SOLUTION: Configurez les DNS pour velocit-ai.fr');
    } else {
      console.log('\n💡 ERREUR INCONNUE:', error);
    }
  }
}

// 3. TEST AVEC CLÉ EN DUR (TEMPORAIRE)
console.log('\n🔑 ÉTAPE 3: Test avec clé en dur');
console.log('--------------------------------------');

async function testAvecCleEnDur() {
  try {
    console.log('Test avec la clé API directement...');
    // TEMPORAIRE - juste pour tester
    const resend = new Resend('re_LNwfCezV_7TjNzz9EFJHWVS2HiyhwpAsf');
    
    const result = await resend.emails.send({
      from: 'contact@velocit-ai.fr',
      to: 'direction@velocit-ai.fr',
      subject: 'Test avec clé en dur - ' + new Date().toLocaleString('fr-FR'),
      html: '<p>Test avec clé API en dur</p>'
    });
    
    console.log('✅ SUCCÈS avec clé en dur\!');
    console.log('Cela signifie que le problème vient des variables d\'environnement');
    
  } catch (error) {
    console.log('❌ ÉCHEC même avec clé en dur');
    console.log('Erreur:', error.message);
  }
}

// Lancer les tests
async function main() {
  await testDirect();
  
  // Si le premier test échoue, essayer avec la clé en dur
  if (\!process.env.RESEND_API_KEY) {
    await testAvecCleEnDur();
  }
  
  console.log('\n===========================================');
  console.log('           FIN DES TESTS');
  console.log('===========================================');
}

main().catch(console.error);
