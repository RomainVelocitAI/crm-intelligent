const fetch = require('node-fetch');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function testAuth() {
  const API_URL = 'https://crm-intelligent.onrender.com';
  
  console.log(`${colors.blue}🔍 Test de l'authentification sur Render${colors.reset}`);
  console.log(`${colors.yellow}URL: ${API_URL}${colors.reset}\n`);
  
  // Test 1: Vérifier que le backend est accessible
  console.log('1. Test de santé du backend...');
  try {
    const healthRes = await fetch(`${API_URL}/health`);
    const health = await healthRes.json();
    console.log(`${colors.green}✓ Backend accessible:${colors.reset}`, health);
  } catch (error) {
    console.log(`${colors.red}✗ Erreur health:${colors.reset}`, error.message);
  }
  
  // Test 2: Vérifier les variables d'environnement
  console.log('\n2. Vérification de l\'environnement...');
  try {
    const envRes = await fetch(`${API_URL}/debug-env`);
    const env = await envRes.json();
    console.log(`${colors.green}✓ Configuration:${colors.reset}`);
    console.log(`  - Base de données: ${env.env.dbHost}`);
    console.log(`  - Bcrypt rounds: ${env.env.bcryptRounds}`);
    console.log(`  - Environnement: ${env.env.nodeEnv}`);
  } catch (error) {
    console.log(`${colors.red}✗ Erreur env:${colors.reset}`, error.message);
  }
  
  // Test 3: Tenter une connexion
  console.log('\n3. Test de connexion...');
  const credentials = {
    email: 'romain.cano33@gmail.com',
    password: 'Temoignage2025!'
  };
  
  console.log(`  Email: ${credentials.email}`);
  console.log(`  Password: ${credentials.password}`);
  
  try {
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    console.log(`  Status: ${loginRes.status} ${loginRes.statusText}`);
    
    const result = await loginRes.json();
    
    if (result.success) {
      console.log(`${colors.green}✓ Connexion réussie!${colors.reset}`);
      console.log('  User:', result.data.user);
      console.log('  Token:', result.data.accessToken ? 'Présent' : 'Absent');
    } else {
      console.log(`${colors.red}✗ Connexion échouée:${colors.reset}`, result.message);
    }
  } catch (error) {
    console.log(`${colors.red}✗ Erreur login:${colors.reset}`, error.message);
  }
  
  // Test 4: Essayer avec l'autre compte
  console.log('\n4. Test avec le compte ami@example.com...');
  const credentials2 = {
    email: 'ami@example.com',
    password: 'TestPass2025!'
  };
  
  try {
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials2)
    });
    
    console.log(`  Status: ${loginRes.status} ${loginRes.statusText}`);
    
    const result = await loginRes.json();
    
    if (result.success) {
      console.log(`${colors.green}✓ Connexion réussie!${colors.reset}`);
      console.log('  User:', result.data.user);
    } else {
      console.log(`${colors.red}✗ Connexion échouée:${colors.reset}`, result.message);
    }
  } catch (error) {
    console.log(`${colors.red}✗ Erreur login:${colors.reset}`, error.message);
  }
}

testAuth().catch(console.error);