/**
 * Test de génération de devis avec Puppeteer (version premium)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Créer le dossier de sortie s'il n'existe pas
const outputDir = './uploads/pdfs';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Données du devis (identiques au test PDFKit)
const devisData = {
  numero: 'DEV-2024-0001',
  objet: 'Développement application web complète',
  dateCreation: new Date('2024-07-02'),
  dateValidite: new Date('2024-08-02'),
  user: {
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@velocit-ai.fr',
    entreprise: 'VelocitAI Solutions',
    siret: '12345678901234',
    telephone: '01 23 45 67 89',
    adresse: '123 Rue de la Technologie',
    codePostal: '75001',
    ville: 'Paris',
    pays: 'France'
  },
  contact: {
    nom: 'Martin',
    prenom: 'Sophie',
    email: 'sophie.martin@client.com',
    entreprise: 'Client Corporation',
    adresse: '456 Avenue du Commerce',
    codePostal: '69000',
    ville: 'Lyon',
    pays: 'France'
  },
  items: [
    {
      designation: 'Développement Frontend React',
      description: 'Interface utilisateur responsive avec React, TypeScript et Tailwind CSS',
      quantite: 1,
      prixUnitaire: 3500.00,
      total: 3500.00
    },
    {
      designation: 'Développement Backend Node.js',
      description: 'API REST avec authentification JWT, base de données PostgreSQL',
      quantite: 1,
      prixUnitaire: 3000.00,
      total: 3000.00
    },
    {
      designation: 'Intégration paiement Stripe',
      description: 'Module de paiement sécurisé avec gestion des abonnements',
      quantite: 1,
      prixUnitaire: 1500.00,
      total: 1500.00
    },
    {
      designation: 'Formation et documentation',
      description: 'Formation utilisateur 8h + documentation technique complète',
      quantite: 1,
      prixUnitaire: 1000.00,
      total: 1000.00
    }
  ],
  sousTotal: 9000.00,
  tva: 1800.00,
  total: 10800.00,
  conditions: 'Paiement à 30 jours fin de mois. Acompte de 40% à la commande. Garantie 6 mois.',
  notes: 'Projet incluant hébergement gratuit pendant 3 mois et maintenance corrective.'
};

function genererTemplateHTML(data) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Devis ${data.numero}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12px;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        }
        
        .header {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          padding: 30px;
          border-radius: 15px;
          margin-bottom: 30px;
          box-shadow: 0 10px 30px rgba(0,123,255,0.3);
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          transform: rotate(45deg);
        }
        
        .header-content {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .company-info h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .company-details {
          font-size: 14px;
          opacity: 0.9;
          line-height: 1.4;
        }
        
        .quote-badge {
          background: rgba(255,255,255,0.2);
          padding: 20px 30px;
          border-radius: 50px;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255,255,255,0.3);
          text-align: center;
        }
        
        .quote-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        
        .quote-number {
          font-size: 18px;
          font-weight: 500;
        }
        
        .dates-section {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .date-card {
          flex: 1;
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          border-left: 5px solid #007bff;
          text-align: center;
        }
        
        .date-label {
          font-size: 11px;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
          font-weight: 600;
        }
        
        .date-value {
          font-size: 16px;
          font-weight: 700;
          color: #007bff;
        }
        
        .addresses {
          display: flex;
          gap: 30px;
          margin-bottom: 30px;
        }
        
        .address-card {
          flex: 1;
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          border-top: 4px solid #007bff;
        }
        
        .address-title {
          font-size: 14px;
          font-weight: 700;
          color: #007bff;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .address-content {
          line-height: 1.6;
          color: #495057;
        }
        
        .address-content .company-name {
          font-weight: 700;
          font-size: 14px;
          color: #212529;
          margin-bottom: 5px;
        }
        
        .quote-object {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          padding: 25px;
          border-radius: 12px;
          margin-bottom: 30px;
          border-left: 5px solid #2196f3;
        }
        
        .quote-object h3 {
          color: #1565c0;
          font-size: 16px;
          margin-bottom: 10px;
          font-weight: 700;
        }
        
        .quote-object-text {
          font-size: 14px;
          color: #0d47a1;
          font-weight: 500;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        
        .items-table thead {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
        }
        
        .items-table th {
          padding: 18px 15px;
          text-align: left;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 11px;
        }
        
        .items-table td {
          padding: 20px 15px;
          border-bottom: 1px solid #e9ecef;
          vertical-align: top;
        }
        
        .items-table tbody tr {
          transition: background-color 0.3s ease;
        }
        
        .items-table tbody tr:hover {
          background-color: #f8f9fa;
        }
        
        .items-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        .item-designation {
          font-weight: 700;
          color: #212529;
          margin-bottom: 5px;
          font-size: 13px;
        }
        
        .item-description {
          font-size: 11px;
          color: #6c757d;
          line-height: 1.4;
          font-style: italic;
        }
        
        .quantity-cell {
          text-align: center;
          font-weight: 600;
          font-size: 14px;
        }
        
        .price-cell {
          text-align: right;
          font-weight: 600;
          font-size: 13px;
        }
        
        .total-cell {
          text-align: right;
          font-weight: 700;
          font-size: 14px;
          color: #007bff;
        }
        
        .totals-section {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        
        .totals-table {
          width: 100%;
          max-width: 350px;
          margin-left: auto;
          border-collapse: collapse;
        }
        
        .totals-table td {
          padding: 12px 20px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .totals-label {
          text-align: right;
          font-weight: 600;
          color: #495057;
        }
        
        .totals-amount {
          text-align: right;
          font-weight: 700;
          width: 120px;
          color: #212529;
        }
        
        .final-total {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          font-size: 16px;
          font-weight: 700;
        }
        
        .final-total td {
          border-bottom: none;
          padding: 15px 20px;
        }
        
        .conditions-section,
        .notes-section {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          margin-bottom: 20px;
        }
        
        .conditions-section {
          border-left: 5px solid #ffc107;
        }
        
        .notes-section {
          border-left: 5px solid #17a2b8;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .conditions-section .section-title {
          color: #856404;
        }
        
        .notes-section .section-title {
          color: #0c5460;
        }
        
        .section-content {
          line-height: 1.7;
          color: #495057;
          font-size: 12px;
        }
        
        .footer {
          text-align: center;
          margin-top: 40px;
          padding: 20px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          font-size: 10px;
          color: #6c757d;
          border: 1px solid #dee2e6;
        }
        
        .footer-logo {
          font-weight: 700;
          color: #007bff;
          margin-bottom: 5px;
        }
        
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .header::before {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          <div class="company-info">
            <h1>${data.user.entreprise}</h1>
            <div class="company-details">
              ${data.user.prenom} ${data.user.nom}<br>
              ${data.user.adresse}<br>
              ${data.user.codePostal} ${data.user.ville}, ${data.user.pays}<br>
              📧 ${data.user.email} | 📞 ${data.user.telephone}<br>
              SIRET: ${data.user.siret}
            </div>
          </div>
          <div class="quote-badge">
            <div class="quote-title">DEVIS</div>
            <div class="quote-number">N° ${data.numero}</div>
          </div>
        </div>
      </div>

      <div class="dates-section">
        <div class="date-card">
          <div class="date-label">Date de création</div>
          <div class="date-value">${data.dateCreation.toLocaleDateString('fr-FR')}</div>
        </div>
        <div class="date-card">
          <div class="date-label">Date de validité</div>
          <div class="date-value">${data.dateValidite.toLocaleDateString('fr-FR')}</div>
        </div>
      </div>

      <div class="addresses">
        <div class="address-card">
          <div class="address-title">Émetteur</div>
          <div class="address-content">
            <div class="company-name">${data.user.entreprise}</div>
            ${data.user.prenom} ${data.user.nom}<br>
            ${data.user.adresse}<br>
            ${data.user.codePostal} ${data.user.ville}<br>
            ${data.user.pays}<br>
            📧 ${data.user.email}
          </div>
        </div>
        <div class="address-card">
          <div class="address-title">Destinataire</div>
          <div class="address-content">
            <div class="company-name">${data.contact.entreprise}</div>
            ${data.contact.prenom} ${data.contact.nom}<br>
            ${data.contact.adresse}<br>
            ${data.contact.codePostal} ${data.contact.ville}<br>
            ${data.contact.pays}<br>
            📧 ${data.contact.email}
          </div>
        </div>
      </div>

      <div class="quote-object">
        <h3>🎯 Objet du devis</h3>
        <div class="quote-object-text">${data.objet}</div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 45%;">Désignation</th>
            <th style="width: 10%;">Qté</th>
            <th style="width: 20%;">Prix unitaire</th>
            <th style="width: 25%;">Total HT</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>
                <div class="item-designation">${item.designation}</div>
                <div class="item-description">${item.description}</div>
              </td>
              <td class="quantity-cell">${item.quantite}</td>
              <td class="price-cell">${item.prixUnitaire.toLocaleString('fr-FR')} €</td>
              <td class="total-cell">${item.total.toLocaleString('fr-FR')} €</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-section">
        <table class="totals-table">
          <tr>
            <td class="totals-label">Sous-total HT :</td>
            <td class="totals-amount">${data.sousTotal.toLocaleString('fr-FR')} €</td>
          </tr>
          <tr>
            <td class="totals-label">TVA (20%) :</td>
            <td class="totals-amount">${data.tva.toLocaleString('fr-FR')} €</td>
          </tr>
          <tr class="final-total">
            <td class="totals-label">TOTAL TTC :</td>
            <td class="totals-amount">${data.total.toLocaleString('fr-FR')} €</td>
          </tr>
        </table>
      </div>

      ${data.conditions ? `
        <div class="conditions-section">
          <div class="section-title">⚖️ Conditions générales</div>
          <div class="section-content">${data.conditions}</div>
        </div>
      ` : ''}

      ${data.notes ? `
        <div class="notes-section">
          <div class="section-title">📝 Notes</div>
          <div class="section-content">${data.notes}</div>
        </div>
      ` : ''}

      <div class="footer">
        <div class="footer-logo">VelocitaLeads CRM - Version Premium</div>
        <div>Devis généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
        <div>Powered by Puppeteer & Modern Web Technologies</div>
      </div>
    </body>
    </html>
  `;
}

async function genererDevisPuppeteer() {
  console.log('🎨 Génération du devis avec Puppeteer...');
  
  const fileName = `devis-puppeteer-${Date.now()}.pdf`;
  const filePath = path.join(outputDir, fileName);
  
  let browser = null;
  
  try {
    // Générer le HTML
    const htmlContent = genererTemplateHTML(devisData);

    // Lancer Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run'
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
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    });

    await browser.close();
    browser = null;

    const stats = fs.statSync(filePath);
    console.log(`✅ Devis Puppeteer généré: ${fileName}`);
    console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Chemin: ${filePath}`);
    
    return filePath;

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

// Exécuter la génération
if (require.main === module) {
  genererDevisPuppeteer()
    .then(() => {
      console.log('🎉 Génération terminée avec succès !');
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = { genererDevisPuppeteer, devisData };