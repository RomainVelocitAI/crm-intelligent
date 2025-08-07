const fetch = require('node-fetch');

async function testDetailedAuth() {
  const API_URL = 'https://crm-intelligent.onrender.com';
  
  console.log('🔍 Test détaillé de l\'authentification\n');
  
  // D'abord vérifier que les comptes existent et sont valides
  console.log('1. Vérification des comptes avec l\'endpoint de debug:\n');
  
  const accounts = [
    { email: 'romain.cano33@gmail.com', password: 'Temoignage2025!' },
    { email: 'ami@example.com', password: 'TestPass2025!' }
  ];
  
  for (const account of accounts) {
    console.log(`📧 ${account.email}:`);
    
    // Test avec l'endpoint de debug
    try {
      const debugRes = await fetch(`${API_URL}/debug-check-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account)
      });
      const debugResult = await debugRes.json();
      console.log(`   Debug: Trouvé=${debugResult.found}, Valide=${debugResult.passwordValid}`);
    } catch (error) {
      console.log(`   Debug: Erreur - ${error.message}`);
    }
    
    // Test avec l'endpoint de login
    try {
      const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account)
      });
      const loginResult = await loginRes.json();
      console.log(`   Login: Status=${loginRes.status}, Success=${loginResult.success}`);
      if (loginResult.success) {
        console.log(`   Token: ${loginResult.data.accessToken ? 'Présent' : 'Absent'}`);
      } else {
        console.log(`   Message: ${loginResult.message}`);
      }
    } catch (error) {
      console.log(`   Login: Erreur - ${error.message}`);
    }
    
    console.log('');
  }
  
  // Test avec des variations d'email
  console.log('2. Test avec variations d\'email:\n');
  const emailVariations = [
    'romain.cano33@gmail.com',
    'Romain.cano33@gmail.com',
    'ROMAIN.CANO33@GMAIL.COM',
    ' romain.cano33@gmail.com ',
    'romain.cano33@gmail.com '
  ];
  
  for (const email of emailVariations) {
    console.log(`Test: "${email}"`);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Temoignage2025!' })
      });
      console.log(`   Status: ${res.status}`);
    } catch (error) {
      console.log(`   Erreur: ${error.message}`);
    }
  }
}

testDetailedAuth().catch(console.error);