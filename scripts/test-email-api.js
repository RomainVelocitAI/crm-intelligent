import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Créer un token JWT valide pour l'utilisateur
const userId = 'cme1n7y3h0000es256bol6qc2';
const contactId = 'cme1na1p7000ges254ojhzgg5'; // Romain CANO

const token = jwt.sign(
  { userId },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('Token JWT créé:', token);

async function testEmailAPI() {
  try {
    console.log('\n=== Test de l\'API d\'envoi d\'email ===');
    console.log('Contact ID:', contactId);
    console.log('User ID:', userId);
    
    const response = await fetch(`http://localhost:3001/api/contacts/${contactId}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        subject: 'Test VelocitaLeads - Envoi Email',
        content: 'Ceci est un email de test envoyé depuis l\'API VelocitaLeads.\n\nCet email confirme que le système d\'envoi fonctionne correctement.'
      })
    });

    const data = await response.json();
    
    console.log('\nRéponse du serveur:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Email envoyé avec succès !');
    } else {
      console.log('\n❌ Erreur lors de l\'envoi:', data.message || 'Erreur inconnue');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur:', error);
  }
}

testEmailAPI();