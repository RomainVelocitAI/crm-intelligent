/**
 * Test simple de génération de PDF avec Puppeteer et PDFKit
 * Ce script teste les bibliothèques directement
 */

const puppeteer = require('puppeteer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Créer le dossier de sortie s'il n'existe pas
const outputDir = './uploads/pdfs';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Données de test pour un devis
const testQuoteData = {
  numero: 'DEV-2024-0001',
  objet: 'Développement site web e-commerce',
  dateCreation: new Date('2024-07-01'),
  dateValidite: new Date('2024-08-01'),
  sousTotal: 5000.00,
  tva: 1000.00,
  total: 6000.00,
  user: {
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@velocit-ai.fr',
    entreprise: 'VelocitAI Solutions',
    telephone: '01 23 45 67 89',
    adresse: '123 Rue de la Tech',
    ville: 'Paris',
    pays: 'France'
  },
  contact: {
    nom: 'Martin',
    prenom: 'Sophie',
    email: 'sophie.martin@client.com',
    entreprise: 'Client Corp',
    ville: 'Lyon',
    pays: 'France'
  },
  items: [
    {
      designation: 'Développement frontend React',
      quantite: 1,
      prixUnitaire: 2500.00,
      total: 2500.00
    },
    {
      designation: 'Développement backend Node.js',
      quantite: 1,
      prixUnitaire: 2000.00,
      total: 2000.00
    },
    {
      designation: 'Formation utilisateur',
      quantite: 1,
      prixUnitaire: 500.00,
      total: 500.00
    }
  ]
};

// Test 1: Génération PDF avec PDFKit
async function testPDFKit() {
  console.log('📄 Test PDFKit - Génération PDF basique...');
  
  const fileName = `test-pdfkit-${Date.now()}.pdf`;
  const filePath = path.join(outputDir, fileName);
  
  return new Promise((resolve, reject) => {
    try {
      // Créer un nouveau document PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Créer le stream de sortie
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // En-tête
      doc.fontSize(24)
         .fillColor('#007bff')
         .text('DEVIS', 50, 50, { align: 'center' });

      doc.fontSize(16)
         .fillColor('#000000')
         .text(`N° ${testQuoteData.numero}`, 50, 80, { align: 'center' });

      // Informations de l'entreprise
      let yPosition = 120;
      doc.fontSize(14)
         .fillColor('#007bff')
         .text('ÉMETTEUR', 50, yPosition);

      yPosition += 25;
      doc.fontSize(11)
         .fillColor('#000000')
         .text(`${testQuoteData.user.prenom} ${testQuoteData.user.nom}`, 50, yPosition);

      yPosition += 15;
      doc.text(testQuoteData.user.entreprise, 50, yPosition);

      yPosition += 15;
      doc.text(testQuoteData.user.adresse, 50, yPosition);

      yPosition += 15;
      doc.text(`${testQuoteData.user.ville}, ${testQuoteData.user.pays}`, 50, yPosition);

      // Informations du client
      yPosition = 120;
      doc.fontSize(14)
         .fillColor('#007bff')
         .text('CLIENT', 300, yPosition);

      yPosition += 25;
      doc.fontSize(11)
         .fillColor('#000000')
         .text(`${testQuoteData.contact.prenom} ${testQuoteData.contact.nom}`, 300, yPosition);

      yPosition += 15;
      doc.text(testQuoteData.contact.entreprise, 300, yPosition);

      yPosition += 15;
      doc.text(`${testQuoteData.contact.ville}, ${testQuoteData.contact.pays}`, 300, yPosition);

      // Objet du devis
      yPosition = 250;
      doc.fontSize(14)
         .fillColor('#007bff')
         .text('OBJET', 50, yPosition);

      yPosition += 25;
      doc.fontSize(11)
         .fillColor('#000000')
         .text(testQuoteData.objet, 50, yPosition);

      // Tableau des articles
      yPosition = 320;
      const tableTop = yPosition;
      const tableLeft = 50;
      const tableWidth = 500;

      // En-têtes du tableau
      doc.fontSize(10)
         .fillColor('#ffffff')
         .rect(tableLeft, tableTop, tableWidth, 25)
         .fill('#007bff');

      doc.fillColor('#ffffff')
         .text('Désignation', tableLeft + 10, tableTop + 8, { width: 250 })
         .text('Qté', tableLeft + 270, tableTop + 8, { width: 50, align: 'center' })
         .text('Prix unitaire', tableLeft + 330, tableTop + 8, { width: 80, align: 'right' })
         .text('Total HT', tableLeft + 420, tableTop + 8, { width: 70, align: 'right' });

      // Lignes du tableau
      yPosition = tableTop + 25;
      testQuoteData.items.forEach((item, index) => {
        const rowHeight = 25;
        
        doc.fillColor('#000000')
           .fontSize(9)
           .text(item.designation, tableLeft + 10, yPosition + 8, { width: 250 })
           .text(item.quantite.toString(), tableLeft + 270, yPosition + 8, { width: 50, align: 'center' })
           .text(`${item.prixUnitaire.toFixed(2)} €`, tableLeft + 330, yPosition + 8, { width: 80, align: 'right' })
           .text(`${item.total.toFixed(2)} €`, tableLeft + 420, yPosition + 8, { width: 70, align: 'right' });

        yPosition += rowHeight;
      });

      // Totaux
      yPosition += 20;
      const totalsLeft = 350;

      doc.fontSize(10)
         .fillColor('#000000')
         .text('Sous-total HT:', totalsLeft, yPosition)
         .text(`${testQuoteData.sousTotal.toFixed(2)} €`, totalsLeft + 100, yPosition, { align: 'right' });

      yPosition += 20;
      doc.text('TVA (20%):', totalsLeft, yPosition)
         .text(`${testQuoteData.tva.toFixed(2)} €`, totalsLeft + 100, yPosition, { align: 'right' });

      yPosition += 25;
      doc.fontSize(12)
         .fillColor('#007bff')
         .rect(totalsLeft - 10, yPosition - 5, 160, 25)
         .fill()
         .fillColor('#ffffff')
         .text('TOTAL TTC:', totalsLeft, yPosition + 5)
         .text(`${testQuoteData.total.toFixed(2)} €`, totalsLeft + 100, yPosition + 5, { align: 'right' });

      // Finaliser le document
      doc.end();

      // Attendre que le stream soit terminé
      stream.on('finish', () => {
        const stats = fs.statSync(filePath);
        console.log(`✅ PDF PDFKit généré: ${fileName}`);
        console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`);
        resolve(filePath);
      });

      stream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
}

// Test 2: Génération PDF avec Puppeteer
async function testPuppeteer() {
  console.log('🎨 Test Puppeteer - Génération PDF premium...');
  
  const fileName = `test-puppeteer-${Date.now()}.pdf`;
  const filePath = path.join(outputDir, fileName);
  
  let browser = null;
  
  try {
    // Template HTML pour le PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Devis ${testQuoteData.numero}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #007bff, #6c757d); color: white; border-radius: 10px; }
          .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .quote-number { font-size: 18px; background: rgba(255,255,255,0.2); padding: 10px; border-radius: 5px; }
          .addresses { display: flex; justify-content: space-between; margin: 30px 0; }
          .address-block { flex: 1; margin-right: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
          .address-title { font-weight: bold; color: #007bff; margin-bottom: 10px; }
          .quote-object { margin: 30px 0; padding: 20px; background: #e3f2fd; border-radius: 8px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          .items-table th { background: #007bff; color: white; padding: 12px; text-align: left; }
          .items-table td { padding: 10px; border-bottom: 1px solid #ddd; }
          .items-table tr:nth-child(even) { background: #f8f9fa; }
          .totals { margin-top: 30px; text-align: right; }
          .totals table { margin-left: auto; }
          .totals td { padding: 8px 15px; }
          .final-total { background: #007bff; color: white; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${testQuoteData.user.entreprise}</div>
          <div class="quote-number">DEVIS N° ${testQuoteData.numero}</div>
        </div>

        <div class="addresses">
          <div class="address-block">
            <div class="address-title">ÉMETTEUR</div>
            <div>${testQuoteData.user.prenom} ${testQuoteData.user.nom}</div>
            <div>${testQuoteData.user.entreprise}</div>
            <div>${testQuoteData.user.adresse}</div>
            <div>${testQuoteData.user.ville}, ${testQuoteData.user.pays}</div>
            <div>${testQuoteData.user.email}</div>
          </div>
          <div class="address-block">
            <div class="address-title">CLIENT</div>
            <div>${testQuoteData.contact.prenom} ${testQuoteData.contact.nom}</div>
            <div>${testQuoteData.contact.entreprise}</div>
            <div>${testQuoteData.contact.ville}, ${testQuoteData.contact.pays}</div>
            <div>${testQuoteData.contact.email}</div>
          </div>
        </div>

        <div class="quote-object">
          <h3>Objet du devis</h3>
          <div>${testQuoteData.objet}</div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Désignation</th>
              <th>Qté</th>
              <th>Prix unitaire</th>
              <th>Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${testQuoteData.items.map(item => `
              <tr>
                <td>${item.designation}</td>
                <td>${item.quantite}</td>
                <td>${item.prixUnitaire.toFixed(2)} €</td>
                <td>${item.total.toFixed(2)} €</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td>Sous-total HT :</td>
              <td>${testQuoteData.sousTotal.toFixed(2)} €</td>
            </tr>
            <tr>
              <td>TVA (20%) :</td>
              <td>${testQuoteData.tva.toFixed(2)} €</td>
            </tr>
            <tr class="final-total">
              <td>TOTAL TTC :</td>
              <td>${testQuoteData.total.toFixed(2)} €</td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    // Lancer Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Charger le contenu HTML
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });

    // Générer le PDF
    await page.pdf({
      path: filePath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    });

    await browser.close();
    browser = null;

    const stats = fs.statSync(filePath);
    console.log(`✅ PDF Puppeteer généré: ${fileName}`);
    console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`);
    
    return filePath;

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

// Fonction principale de test
async function runTests() {
  console.log('🚀 Début des tests de génération PDF...\n');
  
  try {
    // Test PDFKit
    await testPDFKit();
    
    console.log('');
    
    // Test Puppeteer
    await testPuppeteer();
    
    console.log('\n🎉 Tous les tests ont réussi !');
    console.log(`📁 Fichiers générés dans: ${outputDir}`);
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  }
}

// Exécuter les tests
if (require.main === module) {
  runTests();
}

module.exports = { testPDFKit, testPuppeteer, testQuoteData };