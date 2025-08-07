#!/usr/bin/env node

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '.env') });

// Configuration SMTP Resend
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true, // true pour le port 465
  auth: {
    user: process.env.SMTP_USER || 'resend',
    pass: process.env.SMTP_PASS || ''
  }
});

async function testEmail() {
  console.log('📧 Test d\'envoi d\'email avec Resend SMTP');
  console.log('Configuration:');
  console.log('- Host:', process.env.SMTP_HOST);
  console.log('- Port:', process.env.SMTP_PORT);
  console.log('- User:', process.env.SMTP_USER);
  console.log('- From:', process.env.EMAIL_FROM);
  console.log('');

  try {
    // Vérifier la connexion SMTP
    console.log('🔄 Vérification de la connexion SMTP...');
    await transporter.verify();
    console.log('✅ Connexion SMTP établie avec succès!');
    
    // Envoyer un email de test
    console.log('\n🚀 Envoi d\'un email de test...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: 'test@example.com', // Email de test
      subject: 'Test VelocitaLeads - Configuration Resend',
      text: 'Ceci est un email de test envoyé depuis VelocitaLeads avec Resend SMTP.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">✅ Test Réussi!</h2>
          <p>Cet email confirme que la configuration Resend SMTP fonctionne correctement.</p>
          <hr style="border: 1px solid #e0e0e0;">
          <p style="color: #666;">
            <strong>Détails de configuration:</strong><br>
            - Serveur SMTP: ${process.env.SMTP_HOST}<br>
            - Port: ${process.env.SMTP_PORT}<br>
            - Sécurisé: SSL/TLS
          </p>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            VelocitaLeads - CRM Intelligent
          </p>
        </div>
      `
    });
    
    console.log('✅ Email envoyé avec succès!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:');
    console.error('Type d\'erreur:', error.code);
    console.error('Message:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n⚠️  Problème d\'authentification. Vérifiez:');
      console.error('   - La clé API Resend (SMTP_PASS)');
      console.error('   - Le nom d\'utilisateur (SMTP_USER)');
    } else if (error.code === 'ECONNECTION') {
      console.error('\n⚠️  Problème de connexion. Vérifiez:');
      console.error('   - Le serveur SMTP (SMTP_HOST)');
      console.error('   - Le port (SMTP_PORT)');
      console.error('   - La configuration SSL/TLS');
    }
  }
  
  process.exit(0);
}

// Lancer le test
testEmail();