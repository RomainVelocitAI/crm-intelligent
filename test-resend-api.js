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

async function testResendAPI() {
  console.log('🔧 Test de l\'API Resend');
  console.log('Configuration:');
  console.log('- API Key:', process.env.RESEND_API_KEY ? '✅ Configurée' : '❌ Manquante');
  console.log('- From Email:', process.env.EMAIL_FROM || 'onboarding@resend.dev');
  console.log('');

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY n\'est pas configurée dans .env');
    process.exit(1);
  }

  try {
    console.log('📧 Envoi d\'un email de test via l\'API Resend...');
    
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: 'test@example.com',
      subject: 'Test VelocitaLeads - API Resend',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">✅ Test API Resend Réussi!</h2>
          <p>L'API Resend fonctionne correctement avec VelocitaLeads.</p>
          <hr style="border: 1px solid #e0e0e0;">
          <p style="color: #666;">
            <strong>Méthode:</strong> API directe (pas SMTP)<br>
            <strong>Clé API:</strong> Configurée et fonctionnelle
          </p>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            VelocitaLeads - CRM Intelligent
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Erreur Resend:', error);
      console.error('');
      
      if (error.name === 'validation_error') {
        console.error('⚠️  Erreur de validation. Vérifiez:');
        console.error('   - L\'adresse email "from" est autorisée');
        console.error('   - Le format des emails est correct');
      } else if (error.name === 'authentication_error') {
        console.error('⚠️  Erreur d\'authentification. Vérifiez:');
        console.error('   - La clé API est correcte');
        console.error('   - La clé API a les permissions nécessaires');
      }
    } else {
      console.log('✅ Email envoyé avec succès!');
      console.log('ID du message:', data?.id);
      console.log('');
      console.log('📋 Détails:');
      console.log(JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
  
  process.exit(0);
}

// Lancer le test
testResendAPI();