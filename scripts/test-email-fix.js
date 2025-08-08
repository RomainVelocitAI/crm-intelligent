#!/usr/bin/env node

import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

console.log('=== TEST EMAIL FIX PRODUCTION ===');
console.log('Variables d\'environnement:');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'PRÉSENTE' : 'MANQUANTE');
console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'MANQUANTE');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RENDER:', process.env.RENDER);

async function testEmails() {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY manquante!');
    console.log('Ajoutez cette variable sur Render:');
    console.log('RESEND_API_KEY=re_LNwfCezV_7TjNzz9EFJHWVS2HiyhwpAsf');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  
  // Essayer plusieurs adresses d'envoi
  const fromEmails = [
    process.env.RESEND_FROM_EMAIL,
    'contact@velocit-ai.fr',
    'onboarding@resend.dev',
    'noreply@velocitaleads.com'
  ].filter(Boolean);
  
  console.log('\n🔧 Test avec différentes adresses d\'envoi:');
  
  for (const fromEmail of fromEmails) {
    try {
      console.log(`\n📧 Tentative avec: ${fromEmail}`);
      
      const result = await resend.emails.send({
        from: fromEmail,
        to: 'direction@velocit-ai.fr',
        subject: `Test VelocitaLeads - ${new Date().toLocaleString('fr-FR')}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Test d'envoi d'email</h2>
            <p>Cet email a été envoyé depuis: <strong>${fromEmail}</strong></p>
            <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
            <p>Si vous recevez cet email, la configuration fonctionne!</p>
          </div>
        `
      });
      
      console.log('✅ SUCCÈS avec:', fromEmail);
      console.log('Message ID:', result.data?.id);
      console.log('\n🎉 SOLUTION TROUVÉE!');
      console.log('Configurez cette variable sur Render:');
      console.log(`RESEND_FROM_EMAIL=${fromEmail}`);
      
      return;
      
    } catch (error) {
      console.log(`❌ Échec:`, error.message);
    }
  }
  
  console.log('\n😔 Aucune adresse ne fonctionne');
  console.log('Solutions possibles:');
  console.log('1. Vérifiez que votre domaine est vérifié sur Resend');
  console.log('2. Utilisez "onboarding@resend.dev" temporairement');
  console.log('3. Vérifiez votre API key');
}

testEmails().catch(console.error);