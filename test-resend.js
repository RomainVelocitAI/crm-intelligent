// Test direct de l'envoi d'email avec Resend
import { Resend } from 'resend';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    console.log('Test d\'envoi d\'email avec Resend...');
    console.log('API Key:', process.env.RESEND_API_KEY ? 'Configurée' : 'Manquante');
    console.log('From Email:', process.env.RESEND_FROM_EMAIL);
    console.log('Domain vérifié:', process.env.RESEND_DOMAIN_VERIFIED);
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: ['direction@velocit-ai.fr'],
      subject: 'Test VelocitaLeads - Email fonctionnel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #007bff;">Test réussi !</h2>
          <p>Cet email confirme que l'intégration Resend fonctionne correctement.</p>
          <p>L'envoi d'emails depuis VelocitaLeads est maintenant opérationnel.</p>
          <hr>
          <p style="color: #666; font-size: 14px;">
            Envoyé le ${new Date().toLocaleString('fr-FR')}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Erreur Resend:', error);
      return;
    }

    console.log('✅ Email envoyé avec succès !');
    console.log('ID du message:', data?.id);
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testEmail();