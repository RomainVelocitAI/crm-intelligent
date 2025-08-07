#!/usr/bin/env node

/**
 * Script de test pour vérifier le téléchargement des PDF
 */

const fs = require('fs');
const path = require('path');

async function testPDFDownload() {
  try {
    // Configuration
    const API_URL = 'http://localhost:3001';
    const CLIENT_URL = 'http://localhost:3100';
    
    // Récupérer le token depuis l'environnement ou utiliser un token de test
    const token = process.env.AUTH_TOKEN || 'votre-token-ici';
    const quoteId = process.env.QUOTE_ID || 'ID-du-devis-a-tester';
    
    console.log('🔍 Test de téléchargement PDF');
    console.log('================================');
    console.log(`API URL: ${API_URL}`);
    console.log(`Quote ID: ${quoteId}`);
    console.log('');
    
    // Test 1: Téléchargement direct depuis l'API (sans proxy)
    console.log('📥 Test 1: Téléchargement direct depuis l\'API...');
    const directResponse = await fetch(`${API_URL}/api/quotes/${quoteId}/download-pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (directResponse.ok) {
      const buffer = await directResponse.arrayBuffer();
      const directPath = path.join(__dirname, 'test-direct.pdf');
      fs.writeFileSync(directPath, Buffer.from(buffer));
      
      // Vérifier que c'est bien un PDF
      const header = Buffer.from(buffer).slice(0, 5).toString();
      if (header === '%PDF-') {
        console.log('✅ Téléchargement direct: PDF valide');
        console.log(`   Taille: ${Buffer.from(buffer).length} octets`);
        console.log(`   Fichier sauvé: ${directPath}`);
      } else {
        console.log('❌ Téléchargement direct: Fichier corrompu');
        console.log(`   Header reçu: ${header}`);
      }
    } else {
      console.log('❌ Erreur téléchargement direct:', directResponse.status, directResponse.statusText);
    }
    
    console.log('');
    
    // Test 2: Téléchargement via le proxy Vite
    console.log('📥 Test 2: Téléchargement via proxy Vite...');
    const proxyResponse = await fetch(`${CLIENT_URL}/api/quotes/${quoteId}/download-pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (proxyResponse.ok) {
      const buffer = await proxyResponse.arrayBuffer();
      const proxyPath = path.join(__dirname, 'test-proxy.pdf');
      fs.writeFileSync(proxyPath, Buffer.from(buffer));
      
      // Vérifier que c'est bien un PDF
      const header = Buffer.from(buffer).slice(0, 5).toString();
      if (header === '%PDF-') {
        console.log('✅ Téléchargement via proxy: PDF valide');
        console.log(`   Taille: ${Buffer.from(buffer).length} octets`);
        console.log(`   Fichier sauvé: ${proxyPath}`);
      } else {
        console.log('❌ Téléchargement via proxy: Fichier corrompu');
        console.log(`   Header reçu: ${header}`);
        console.log(`   Headers de réponse:`, Object.fromEntries(proxyResponse.headers));
      }
    } else {
      console.log('❌ Erreur téléchargement proxy:', proxyResponse.status, proxyResponse.statusText);
    }
    
    console.log('');
    console.log('================================');
    console.log('📊 Résumé du test terminé');
    console.log('');
    console.log('Pour tester manuellement:');
    console.log(`1. Ouvrez test-direct.pdf avec un lecteur PDF`);
    console.log(`2. Ouvrez test-proxy.pdf avec un lecteur PDF`);
    console.log(`3. Comparez les deux fichiers`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Instructions pour l'utilisateur
if (!process.env.AUTH_TOKEN || !process.env.QUOTE_ID) {
  console.log('⚠️  Usage:');
  console.log('AUTH_TOKEN="votre-token" QUOTE_ID="id-du-devis" node test-pdf-download.js');
  console.log('');
  console.log('Exemple:');
  console.log('AUTH_TOKEN="eyJ..." QUOTE_ID="cm4..." node test-pdf-download.js');
  process.exit(1);
}

testPDFDownload();