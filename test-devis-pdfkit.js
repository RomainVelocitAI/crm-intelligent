/**
 * Test de génération de devis avec PDFKit (version basique)
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Créer le dossier de sortie s'il n'existe pas
const outputDir = './uploads/pdfs';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Données du devis
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

async function genererDevisPDFKit() {
  console.log('📄 Génération du devis avec PDFKit...');
  
  const fileName = `devis-pdfkit-${Date.now()}.pdf`;
  const filePath = path.join(outputDir, fileName);
  
  return new Promise((resolve, reject) => {
    try {
      // Créer un nouveau document PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Devis ${devisData.numero}`,
          Author: `${devisData.user.prenom} ${devisData.user.nom}`,
          Subject: devisData.objet,
          Creator: 'VelocitaLeads CRM - PDFKit'
        }
      });

      // Créer le stream de sortie
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // === EN-TÊTE ===
      doc.fontSize(28)
         .fillColor('#007bff')
         .text('DEVIS', 50, 50, { align: 'center' });

      doc.fontSize(18)
         .fillColor('#000000')
         .text(`N° ${devisData.numero}`, 50, 85, { align: 'center' });

      // Ligne de séparation
      doc.moveTo(50, 120)
         .lineTo(545, 120)
         .strokeColor('#007bff')
         .lineWidth(2)
         .stroke();

      // === INFORMATIONS ENTREPRISE ET CLIENT ===
      let yPos = 140;
      
      // Émetteur (gauche)
      doc.fontSize(14)
         .fillColor('#007bff')
         .text('ÉMETTEUR', 50, yPos);

      yPos += 25;
      doc.fontSize(11)
         .fillColor('#000000')
         .text(`${devisData.user.entreprise}`, 50, yPos, { width: 200 });

      yPos += 15;
      doc.text(`${devisData.user.prenom} ${devisData.user.nom}`, 50, yPos);

      yPos += 15;
      doc.text(devisData.user.adresse, 50, yPos);

      yPos += 15;
      doc.text(`${devisData.user.codePostal} ${devisData.user.ville}`, 50, yPos);

      yPos += 15;
      doc.text(devisData.user.pays, 50, yPos);

      yPos += 15;
      doc.text(`Email: ${devisData.user.email}`, 50, yPos);

      yPos += 15;
      doc.text(`Tél: ${devisData.user.telephone}`, 50, yPos);

      yPos += 15;
      doc.text(`SIRET: ${devisData.user.siret}`, 50, yPos);

      // Client (droite)
      yPos = 140;
      doc.fontSize(14)
         .fillColor('#007bff')
         .text('CLIENT', 320, yPos);

      yPos += 25;
      doc.fontSize(11)
         .fillColor('#000000')
         .text(`${devisData.contact.entreprise}`, 320, yPos, { width: 200 });

      yPos += 15;
      doc.text(`${devisData.contact.prenom} ${devisData.contact.nom}`, 320, yPos);

      yPos += 15;
      doc.text(devisData.contact.adresse, 320, yPos);

      yPos += 15;
      doc.text(`${devisData.contact.codePostal} ${devisData.contact.ville}`, 320, yPos);

      yPos += 15;
      doc.text(devisData.contact.pays, 320, yPos);

      yPos += 15;
      doc.text(`Email: ${devisData.contact.email}`, 320, yPos);

      // === DATES ===
      yPos = 320;
      doc.fontSize(12)
         .fillColor('#666666')
         .text(`Date de création: ${devisData.dateCreation.toLocaleDateString('fr-FR')}`, 50, yPos);

      doc.text(`Date de validité: ${devisData.dateValidite.toLocaleDateString('fr-FR')}`, 320, yPos);

      // === OBJET ===
      yPos += 40;
      doc.fontSize(14)
         .fillColor('#007bff')
         .text('OBJET DU DEVIS', 50, yPos);

      yPos += 20;
      doc.fontSize(12)
         .fillColor('#000000')
         .text(devisData.objet, 50, yPos, { width: 495 });

      // === TABLEAU DES PRESTATIONS ===
      yPos += 60;
      const tableTop = yPos;
      const tableLeft = 50;
      const tableWidth = 495;

      // En-tête du tableau
      doc.fontSize(10)
         .fillColor('#ffffff')
         .rect(tableLeft, tableTop, tableWidth, 30)
         .fill('#007bff');

      doc.fillColor('#ffffff')
         .text('DÉSIGNATION', tableLeft + 10, tableTop + 10, { width: 200 })
         .text('QTÉ', tableLeft + 220, tableTop + 10, { width: 40, align: 'center' })
         .text('PRIX UNITAIRE', tableLeft + 270, tableTop + 10, { width: 80, align: 'center' })
         .text('TOTAL HT', tableLeft + 360, tableTop + 10, { width: 80, align: 'right' });

      // Lignes du tableau
      yPos = tableTop + 30;
      devisData.items.forEach((item, index) => {
        const rowHeight = 50;
        
        // Fond alterné
        if (index % 2 === 0) {
          doc.fillColor('#f8f9fa')
             .rect(tableLeft, yPos, tableWidth, rowHeight)
             .fill();
        }

        // Contenu de la ligne
        doc.fillColor('#000000')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(item.designation, tableLeft + 10, yPos + 8, { width: 200 });

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#666666')
           .text(item.description, tableLeft + 10, yPos + 22, { width: 200 });

        doc.fontSize(10)
           .fillColor('#000000')
           .text(item.quantite.toString(), tableLeft + 220, yPos + 15, { width: 40, align: 'center' })
           .text(`${item.prixUnitaire.toLocaleString('fr-FR')} €`, tableLeft + 270, yPos + 15, { width: 80, align: 'center' })
           .font('Helvetica-Bold')
           .text(`${item.total.toLocaleString('fr-FR')} €`, tableLeft + 360, yPos + 15, { width: 80, align: 'right' });

        yPos += rowHeight;
      });

      // Bordure du tableau
      doc.rect(tableLeft, tableTop, tableWidth, yPos - tableTop)
         .strokeColor('#ddd')
         .lineWidth(1)
         .stroke();

      // === TOTAUX ===
      yPos += 30;
      const totalsLeft = 350;
      const totalsWidth = 195;

      // Sous-total
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica')
         .text('Sous-total HT:', totalsLeft, yPos)
         .text(`${devisData.sousTotal.toLocaleString('fr-FR')} €`, totalsLeft + 100, yPos, { width: 95, align: 'right' });

      yPos += 20;
      // TVA
      doc.text('TVA (20%):', totalsLeft, yPos)
         .text(`${devisData.tva.toLocaleString('fr-FR')} €`, totalsLeft + 100, yPos, { width: 95, align: 'right' });

      yPos += 30;
      // Total TTC
      doc.fontSize(14)
         .fillColor('#ffffff')
         .rect(totalsLeft - 10, yPos - 8, totalsWidth + 20, 30)
         .fill('#007bff');

      doc.font('Helvetica-Bold')
         .text('TOTAL TTC:', totalsLeft, yPos + 5)
         .text(`${devisData.total.toLocaleString('fr-FR')} €`, totalsLeft + 100, yPos + 5, { width: 95, align: 'right' });

      // === CONDITIONS ===
      if (devisData.conditions) {
        yPos += 60;
        doc.fontSize(12)
           .fillColor('#007bff')
           .font('Helvetica-Bold')
           .text('CONDITIONS GÉNÉRALES', 50, yPos);

        yPos += 20;
        doc.fontSize(10)
           .fillColor('#000000')
           .font('Helvetica')
           .text(devisData.conditions, 50, yPos, { width: 495, lineGap: 3 });
      }

      // === NOTES ===
      if (devisData.notes) {
        yPos += 40;
        doc.fontSize(12)
           .fillColor('#007bff')
           .font('Helvetica-Bold')
           .text('NOTES', 50, yPos);

        yPos += 20;
        doc.fontSize(10)
           .fillColor('#000000')
           .font('Helvetica')
           .text(devisData.notes, 50, yPos, { width: 495, lineGap: 3 });
      }

      // === FOOTER ===
      doc.fontSize(8)
         .fillColor('#999999')
         .text('Devis généré par VelocitaLeads CRM - Version PDFKit', 50, 750, { align: 'center', width: 495 });

      // Finaliser le document
      doc.end();

      // Attendre que le stream soit terminé
      stream.on('finish', () => {
        const stats = fs.statSync(filePath);
        console.log(`✅ Devis PDFKit généré: ${fileName}`);
        console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`   Chemin: ${filePath}`);
        resolve(filePath);
      });

      stream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
}

// Exécuter la génération
if (require.main === module) {
  genererDevisPDFKit()
    .then(() => {
      console.log('🎉 Génération terminée avec succès !');
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = { genererDevisPDFKit, devisData };