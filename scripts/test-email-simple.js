#!/usr/bin/env node

// Test ULTRA SIMPLE pour envoyer un email depuis production
// Usage: node scripts/test-email-simple.js

const dotenv = require('dotenv');
dotenv.config();

console.log('\n🚀 TEST EMAIL DIRECT\n');

// Afficher les variables
console.log('Variables:');
console.log('- RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'DÉFINIE' : '❌ MANQUANTE');
console.log('- RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || '❌ MANQUANTE');

async function test() {
  try {
    const { Resend } = require('resend');
    
    // Test avec la clé des variables d'environnement
    const apiKey = process.env.RESEND_API_KEY || 're_LNwfCezV_7TjNzz9EFJHWVS2HiyhwpAsf';
    const resend = new Resend(apiKey);
    
    console.log('\nEnvoi de l\'email...');
    
    const result = await resend.emails.send({
      from: 'contact@velocit-ai.fr',
      to: 'direction@velocit-ai.fr',
      subject: 'Test depuis production - ' + new Date().toLocaleString('fr-FR'),
      html: '<h2>Test Email</h2><p>Si vous recevez ceci, tout fonctionne!</p>'
    });
    
    console.log('✅ SUCCÈS! Email envoyé');
    console.log('ID:', result.data?.id);
    
  } catch (error) {
    console.log('❌ ERREUR:', error.message);
    
    // Si l'erreur contient "not_found", la clé API est invalide
    if (error.message?.includes('not_found')) {
      console.log('\n⚠️ La clé API semble invalide');
      console.log('Vérifiez sur https://resend.com/api-keys');
    }
    
    // Si l'erreur contient "validation", c'est un problème de domaine
    if (error.message?.includes('validation')) {
      console.log('\n⚠️ Problème avec l\'email d\'envoi');
      console.log('Vérifiez que contact@velocit-ai.fr est configuré dans Resend');
    }
  }
}

test();