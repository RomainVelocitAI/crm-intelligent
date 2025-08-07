const fetch = require('node-fetch');
const fs = require('fs');

async function testDownload() {
  // First, let's get a valid token
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@velocitalead.fr', password: 'Demo123!' })
  });
  
  if (!loginRes.ok) {
    console.log('Login failed:', loginRes.status);
    return;
  }
  
  const loginData = await loginRes.json();
  const token = loginData.token || loginData.accessToken;
  console.log('✅ Authentifié avec succès');
  
  // Get quotes to find a valid ID
  const quotesRes = await fetch('http://localhost:3001/api/quotes', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!quotesRes.ok) {
    console.log('Failed to get quotes:', quotesRes.status);
    return;
  }
  
  const quotes = await quotesRes.json();
  if (quotes.length === 0) {
    console.log('No quotes available to test');
    return;
  }
  
  const quoteId = quotes[0].id;
  console.log('📄 Test avec le devis:', quoteId);
  
  // Test direct API download
  console.log('\n📥 Test 1: Téléchargement direct API (port 3001)...');
  const directRes = await fetch('http://localhost:3001/api/quotes/' + quoteId + '/download-pdf', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (directRes.ok) {
    const buffer = await directRes.buffer();
    const header = buffer.slice(0, 5).toString();
    console.log('  Header PDF:', header);
    console.log('  Taille:', buffer.length, 'octets');
    console.log('  Résultat:', header === '%PDF-' ? '✅ PDF valide' : '❌ PDF corrompu');
    
    // Save for manual inspection
    fs.writeFileSync('/tmp/test-direct.pdf', buffer);
    console.log('  Sauvé dans: /tmp/test-direct.pdf');
  } else {
    console.log('  ❌ Erreur:', directRes.status);
  }
  
  // Test via Vite proxy
  console.log('\n📥 Test 2: Téléchargement via proxy Vite (port 3100)...');
  const proxyRes = await fetch('http://localhost:3100/api/quotes/' + quoteId + '/download-pdf', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (proxyRes.ok) {
    const buffer = await proxyRes.buffer();
    const header = buffer.slice(0, 5).toString();
    console.log('  Header PDF:', header);
    console.log('  Taille:', buffer.length, 'octets');
    console.log('  Résultat:', header === '%PDF-' ? '✅ PDF valide' : '❌ PDF corrompu');
    
    // Save for manual inspection
    fs.writeFileSync('/tmp/test-proxy.pdf', buffer);
    console.log('  Sauvé dans: /tmp/test-proxy.pdf');
  } else {
    console.log('  ❌ Erreur:', proxyRes.status);
  }
  
  console.log('\n📊 Résumé:');
  console.log('Pour vérifier manuellement:');
  console.log('1. cat /tmp/test-direct.pdf | head -c 5  # Devrait afficher %PDF-');
  console.log('2. cat /tmp/test-proxy.pdf | head -c 5   # Devrait afficher %PDF-');
}

testDownload().catch(console.error);