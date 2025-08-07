#!/usr/bin/env node

import { Resend } from 'resend';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '.env') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResendWithVerifiedDomain() {
  console.log('🔧 Test de l\'API Resend avec domaine vérifié');
  console.log('Configuration:');
  console.log('- API Key:', process.env.RESEND_API_KEY ? '✅ Configurée' : '❌ Manquante');
  console.log('- From Email:', process.env.RESEND_FROM_EMAIL);
  console.log('- Domaine vérifié: velocit-ai.fr');
  console.log('');

  try {
    console.log('📧 Envoi d\'un email de test avec votre domaine vérifié...');
    
    const { data, error } = await resend.emails.send({
      from: 'VelocitaLeads <contact@velocit-ai.fr>',
      to: 'direction@velocit-ai.fr', // Votre email
      subject: 'Test VelocitaLeads - Domaine Vérifié ✅',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">✅ Configuration Réussie!</h2>
          <p>Félicitations ! Votre domaine <strong>velocit-ai.fr</strong> est maintenant configuré correctement avec Resend.</p>
          <hr style="border: 1px solid #e0e0e0;">
          <p style="color: #666;">
            <strong>Configuration active:</strong><br>
            • Domaine vérifié: velocit-ai.fr<br>
            • Email d'envoi: contact@velocit-ai.fr<br>
            • API: Resend (pas SMTP)<br>
            • Région: Tokyo (ap-northeast-1)
          </p>
          <p style="margin-top: 20px;">
            <strong>Prochaines étapes:</strong><br>
            1. ✅ Les emails seront maintenant envoyés depuis contact@velocit-ai.fr<br>
            2. ✅ Vous pouvez envoyer à n'importe quelle adresse email<br>
            3. ✅ Le tracking des ouvertures fonctionnera correctement
          </p>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            VelocitaLeads - CRM Intelligent<br>
            Powered by Resend
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Erreur Resend:', error);
    } else {
      console.log('✅ Email envoyé avec succès!');
      console.log('ID du message:', data?.id);
      console.log('');
      console.log('🎉 Votre configuration est maintenant complète !');
      console.log('Vous pouvez envoyer des emails à n\'importe quelle adresse.');
    }
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
  
  process.exit(0);
}

// Lancer le test
testResendWithVerifiedDomain();