const http = require('http');
const fs = require('fs');

// Credentials
const credentials = {
  email: 'admin@velocitalead.fr',
  password: 'Demo123!'
};

function makeRequest(hostname, port, path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = [];
      
      res.on('data', (chunk) => {
        data.push(chunk);
      });
      
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        resolve({
          status: res.statusCode,
          headers: res.headers,
          buffer,
          body: () => {
            try {
              return JSON.parse(buffer.toString());
            } catch {
              return buffer.toString();
            }
          }
        });
      });
    });
    
    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function test() {
  console.log('🔐 Authentification...');
  
  // Login
  const loginRes = await makeRequest('localhost', 3001, '/api/auth/login', 'POST', {}, credentials);
  
  if (loginRes.status !== 200) {
    console.log('❌ Échec de connexion:', loginRes.status, loginRes.body());
    return;
  }
  
  const loginData = loginRes.body();
  const accessToken = loginData.data?.accessToken || loginData.accessToken;
  console.log('✅ Connecté avec succès');
  
  // Get quotes
  const quotesRes = await makeRequest('localhost', 3001, '/api/quotes', 'GET', {
    'Authorization': `Bearer ${accessToken}`
  });
  
  if (quotesRes.status !== 200) {
    console.log('❌ Impossible de récupérer les devis:', quotesRes.status);
    return;
  }
  
  const quotesData = quotesRes.body();
  const quotes = quotesData.data?.quotes || quotesData.quotes || quotesData;
  
  if (!quotes || !quotes.length) {
    console.log('❌ Aucun devis disponible');
    console.log('Response:', quotesRes.body());
    return;
  }
  
  const quoteId = quotes[0].id;
  console.log(`📄 Test avec le devis: ${quoteId}`);
  
  // Test 1: Direct API
  console.log('\n📥 Test 1: Téléchargement direct (API port 3001)...');
  const directRes = await makeRequest('localhost', 3001, `/api/quotes/${quoteId}/download-pdf`, 'GET', {
    'Authorization': `Bearer ${accessToken}`
  });
  
  if (directRes.status === 200) {
    const header = directRes.buffer.slice(0, 5).toString();
    console.log('  Header:', header);
    console.log('  Taille:', directRes.buffer.length, 'octets');
    console.log('  Résultat:', header === '%PDF-' ? '✅ PDF valide' : '❌ PDF corrompu');
    fs.writeFileSync('/tmp/test-direct.pdf', directRes.buffer);
    console.log('  Sauvé: /tmp/test-direct.pdf');
  } else {
    console.log('  ❌ Erreur:', directRes.status);
  }
  
  // Test 2: Via Vite proxy
  console.log('\n📥 Test 2: Téléchargement via proxy Vite (port 3100)...');
  const proxyRes = await makeRequest('localhost', 3100, `/api/quotes/${quoteId}/download-pdf`, 'GET', {
    'Authorization': `Bearer ${accessToken}`
  });
  
  if (proxyRes.status === 200) {
    const header = proxyRes.buffer.slice(0, 5).toString();
    console.log('  Header:', header);
    console.log('  Taille:', proxyRes.buffer.length, 'octets');
    console.log('  Résultat:', header === '%PDF-' ? '✅ PDF valide' : '❌ PDF corrompu');
    fs.writeFileSync('/tmp/test-proxy.pdf', proxyRes.buffer);
    console.log('  Sauvé: /tmp/test-proxy.pdf');
  } else {
    console.log('  ❌ Erreur:', proxyRes.status);
  }
  
  console.log('\n📊 Résumé du test terminé');
  console.log('Vérifiez les fichiers:');
  console.log('- /tmp/test-direct.pdf');
  console.log('- /tmp/test-proxy.pdf');
}

test().catch(console.error);