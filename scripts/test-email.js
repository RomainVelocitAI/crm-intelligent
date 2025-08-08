#!/usr/bin/env node

/**
 * Script de test d'envoi d'email
 * Teste l'envoi d'un email réel pour vérifier la configuration
 */

require('dotenv').config();

async function testEmail() {
  console.log('🧪 TEST D\'ENVOI D\'EMAIL');
  console.log('=======================\n');
  
  // Vérifier la configuration
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY manquante - Configurez-la d\'abord');
    process.exit(1);
  }
  
  const testEmail = process.argv[2] || process.env.TEST_EMAIL || 'test@example.com';
  
  console.log(`📧 Envoi d'un email de test à: ${testEmail}`);
  console.log('Patientez...');
  
  try {
    const { sendTestEmail } = require('../dist/services/resendEmailService');
    await sendTestEmail(testEmail);
    
    console.log('\n✅ Email de test envoyé avec succès !');
    console.log('Vérifiez votre boîte de réception.');
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'envoi:', error.message);
    
    if (error.message.includes('API')) {
      console.log('\n💡 Solution: Vérifiez RESEND_API_KEY');
    }
    if (error.message.includes('from')) {
      console.log('\n💡 Solution: Configurez RESEND_FROM_EMAIL avec un domaine vérifié');
    }
    
    process.exit(1);
  }
}

// Compiler le TypeScript d'abord si nécessaire
const { execSync } = require('child_process');

console.log('🔨 Compilation du code...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Compilation terminée\n');
  
  // Lancer le test
  testEmail();
} catch (error) {
  console.error('❌ Erreur de compilation:', error.message);
  process.exit(1);
}
