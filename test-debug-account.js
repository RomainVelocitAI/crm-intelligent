const fetch = require('node-fetch');

async function testDebugAccount() {
  const API_URL = 'https://crm-intelligent.onrender.com';
  
  console.log('🔍 Test du debug account sur Render\n');
  
  const accounts = [
    { email: 'romain.cano33@gmail.com', password: 'Temoignage2025!' },
    { email: 'ami@example.com', password: 'TestPass2025!' }
  ];
  
  for (const account of accounts) {
    console.log(`📧 Test de ${account.email}:`);
    
    try {
      const response = await fetch(`${API_URL}/debug-check-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(account)
      });
      
      const result = await response.json();
      
      if (result.error) {
        console.log(`   ❌ Erreur: ${result.error}`);
      } else if (!result.found) {
        console.log(`   ❌ Utilisateur non trouvé`);
        console.log(`   📋 Emails dans la base: ${result.allEmails?.join(', ')}`);
      } else {
        console.log(`   ✅ Utilisateur trouvé`);
        console.log(`   ID: ${result.id}`);
        console.log(`   Hash: ${result.hashPrefix}...`);
        console.log(`   Mot de passe valide: ${result.passwordValid ? '✅ OUI' : '❌ NON'}`);
        console.log(`   Bcrypt rounds: ${result.bcryptRounds}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur réseau: ${error.message}`);
    }
    
    console.log('');
  }
}

testDebugAccount().catch(console.error);