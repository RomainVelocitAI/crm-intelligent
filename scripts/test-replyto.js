#!/usr/bin/env node

import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

console.log('=== TEST REPLY-TO ===');

async function testReplyTo() {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY manquante!');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    console.log('📧 Test d\'envoi avec reply-to...');
    
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'contact@velocit-ai.fr',
      to: 'direction@velocit-ai.fr',
      replyTo: 'elevenlabs.io@paced.info', // Email de l'utilisateur qui envoie
      subject: `Test Reply-To - ${new Date().toLocaleString('fr-FR')}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Reply-To</h2>
          <p>Cet email est envoyé depuis: <strong>${process.env.RESEND_FROM_EMAIL || 'contact@velocit-ai.fr'}</strong></p>
          <p>Mais si vous cliquez sur "Répondre", la réponse ira à: <strong>elevenlabs.io@paced.info</strong></p>
          <hr>
          <p>Ceci simule l'envoi d'un devis où:</p>
          <ul>
            <li>FROM = contact@velocit-ai.fr (domaine vérifié)</li>
            <li>REPLY-TO = email de l'utilisateur qui envoie le devis</li>
          </ul>
        </div>
      `
    });
    
    console.log('✅ Email envoyé avec succès!');
    console.log('Message ID:', result.data?.id);
    console.log('\n📋 Configuration utilisée:');
    console.log('  FROM: contact@velocit-ai.fr');
    console.log('  TO: direction@velocit-ai.fr');
    console.log('  REPLY-TO: elevenlabs.io@paced.info');
    console.log('\n✉️ Vérifiez que quand vous cliquez sur "Répondre", l\'email est bien adressé à elevenlabs.io@paced.info');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testReplyTo().catch(console.error);