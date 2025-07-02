/**
 * Test de pagination PDFKit - Vérification des sauts de page
 * Ce script teste la gestion des tableaux longs qui dépassent une page
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Créer le dossier de sortie s'il n'existe pas
const outputDir = './uploads/pdfs';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Données de test avec BEAUCOUP d'éléments pour forcer la pagination
const devisLongData = {
  numero: 'DEV-2024-LONG',
  objet: 'Développement application complète avec nombreuses prestations',
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
      designation: 'Analyse et conception',
      description: 'Étude des besoins, architecture technique, maquettes UX/UI',
      quantite: 1,
      prixUnitaire: 2500.00,
      total: 2500.00
    },
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
      designation: 'Base de données PostgreSQL',
      description: 'Conception, optimisation et mise en place de la base de données',
      quantite: 1,
      prixUnitaire: 1200.00,
      total: 1200.00
    },
    {
      designation: 'Authentification et sécurité',
      description: 'Système d\'authentification JWT, hashage bcrypt, protection CSRF',
      quantite: 1,
      prixUnitaire: 1800.00,
      total: 1800.00
    },
    {
      designation: 'Intégration paiement Stripe',
      description: 'Module de paiement sécurisé avec gestion des abonnements et webhooks',
      quantite: 1,
      prixUnitaire: 1500.00,
      total: 1500.00
    },
    {
      designation: 'Système de notifications',
      description: 'Notifications email et push, templates personnalisables',
      quantite: 1,
      prixUnitaire: 800.00,
      total: 800.00
    },
    {
      designation: 'Dashboard administrateur',
      description: 'Interface d\'administration avec statistiques et gestion utilisateurs',
      quantite: 1,
      prixUnitaire: 2200.00,
      total: 2200.00
    },
    {
      designation: 'API REST complète',
      description: 'Documentation Swagger, versioning, rate limiting, monitoring',
      quantite: 1,
      prixUnitaire: 1600.00,
      total: 1600.00
    },
    {
      designation: 'Tests automatisés',
      description: 'Tests unitaires Jest, tests d\'intégration, couverture 80%+',
      quantite: 1,
      prixUnitaire: 1400.00,
      total: 1400.00
    },
    {
      designation: 'Déploiement et DevOps',
      description: 'Configuration serveur, CI/CD GitHub Actions, monitoring',
      quantite: 1,
      prixUnitaire: 1800.00,
      total: 1800.00
    },
    {
      designation: 'Optimisation performances',
      description: 'Cache Redis, optimisation requêtes, compression assets',
      quantite: 1,
      prixUnitaire: 1200.00,
      total: 1200.00
    },
    {
      designation: 'Responsive design',
      description: 'Adaptation mobile et tablette, Progressive Web App',
      quantite: 1,
      prixUnitaire: 1000.00,
      total: 1000.00
    },
    {
      designation: 'Système de logs',
      description: 'Logging Winston, rotation des logs, monitoring erreurs',
      quantite: 1,
      prixUnitaire: 600.00,
      total: 600.00
    },
    {
      designation: 'Backup automatique',
      description: 'Sauvegarde quotidienne base de données et fichiers',
      quantite: 1,
      prixUnitaire: 500.00,
      total: 500.00
    },
    {
      designation: 'Documentation technique',
      description: 'Documentation complète API, guide développeur, README',
      quantite: 1,
      prixUnitaire: 800.00,
      total: 800.00
    },
    {
      designation: 'Formation équipe',
      description: 'Formation développeurs 16h, documentation utilisateur',
      quantite: 1,
      prixUnitaire: 1600.00,
      total: 1600.00
    },
    {
      designation: 'Support technique 3 mois',
      description: 'Support email et téléphone, corrections bugs, mises à jour',
      quantite: 1,
      prixUnitaire: 2400.00,
      total: 2400.00
    },
    {
      designation: 'Maintenance préventive',
      description: 'Mises à jour sécurité, monitoring, rapports mensuels',
      quantite: 3,
      prixUnitaire: 400.00,
      total: 1200.00
    },
    {
      designation: 'Hébergement premium 1 an',
      description: 'Serveur dédié, SSL, CDN, monitoring 24/7',
      quantite: 12,
      prixUnitaire: 150.00,
      total: 1800.00
    }
  ],
  conditions: 'Paiement à 30 jours fin de mois. Acompte de 40% à la commande. Garantie 6 mois sur tous les développements. Les sources sont livrées en fin de projet. Support technique inclus pendant 3 mois.',
  notes: 'Projet incluant hébergement gratuit pendant 3 mois et maintenance corrective. Formation sur site possible avec supplément de 500€. Possibilité d\'évolutions futures selon devis séparé.'
};

// Calculer les totaux
const sousTotal = devisLongData.items.reduce((sum, item) => sum + item.total, 0);
const tva = sousTotal * 0.20;
const total = sousTotal + tva;

devisLongData.sousTotal = sousTotal;
devisLongData.tva = tva;
devisLongData.total = total;

async function genererDevisAvecPagination() {
  console.log('📄 Test de pagination PDFKit...');
  console.log(`📊 Nombre d'éléments: ${devisLongData.items.length}`);
  
  const fileName = `devis-pagination-test-${Date.now()}.pdf`;
  const filePath = path.join(outputDir, fileName);
  
  return new Promise((resolve, reject) => {
    try {
      // Créer un nouveau document PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Devis ${devisLongData.numero}`,
          Author: `${devisLongData.user.prenom} ${devisLongData.user.nom}`,
          Subject: devisLongData.objet,
          Creator: 'VelocitaLeads CRM - Test Pagination'
        }
      });

      // Créer le stream de sortie
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Variables pour la gestion de la pagination
      const pageHeight = 792; // Hauteur page A4 en points
      const marginBottom = 100; // Marge du bas pour éviter de couper
      let currentY = 50;

      // Fonction pour vérifier si on a assez de place
      function checkPageBreak(neededHeight) {
        if (currentY + neededHeight > pageHeight - marginBottom) {
          doc.addPage();
          currentY = 50;
          console.log(`📄 Nouvelle page ajoutée à Y=${currentY}`);
          return true;
        }
        return false;
      }

      // === EN-TÊTE ===
      doc.fontSize(28)
         .fillColor('#007bff')
         .text('DEVIS', 50, currentY, { align: 'center' });
      currentY += 40;

      doc.fontSize(18)
         .fillColor('#000000')
         .text(`N° ${devisLongData.numero}`, 50, currentY, { align: 'center' });
      currentY += 30;

      // Ligne de séparation
      doc.moveTo(50, currentY)
         .lineTo(545, currentY)
         .strokeColor('#007bff')
         .lineWidth(2)
         .stroke();
      currentY += 20;

      // === INFORMATIONS ENTREPRISE ET CLIENT ===
      checkPageBreak(150); // Vérifier qu'on a la place pour les infos

      // Émetteur (gauche)
      doc.fontSize(14)
         .fillColor('#007bff')
         .text('ÉMETTEUR', 50, currentY);

      let yPosLeft = currentY + 25;
      doc.fontSize(11)
         .fillColor('#000000')
         .text(`${devisLongData.user.entreprise}`, 50, yPosLeft);
      yPosLeft += 15;
      doc.text(`${devisLongData.user.prenom} ${devisLongData.user.nom}`, 50, yPosLeft);
      yPosLeft += 15;
      doc.text(devisLongData.user.adresse, 50, yPosLeft);
      yPosLeft += 15;
      doc.text(`${devisLongData.user.codePostal} ${devisLongData.user.ville}`, 50, yPosLeft);

      // Client (droite)
      let yPosRight = currentY;
      doc.fontSize(14)
         .fillColor('#007bff')
         .text('CLIENT', 320, yPosRight);

      yPosRight += 25;
      doc.fontSize(11)
         .fillColor('#000000')
         .text(`${devisLongData.contact.entreprise}`, 320, yPosRight);
      yPosRight += 15;
      doc.text(`${devisLongData.contact.prenom} ${devisLongData.contact.nom}`, 320, yPosRight);

      currentY = Math.max(yPosLeft, yPosRight) + 30;

      // === DATES ===
      checkPageBreak(40);
      doc.fontSize(12)
         .fillColor('#666666')
         .text(`Date: ${devisLongData.dateCreation.toLocaleDateString('fr-FR')}`, 50, currentY);
      doc.text(`Validité: ${devisLongData.dateValidite.toLocaleDateString('fr-FR')}`, 320, currentY);
      currentY += 30;

      // === OBJET ===
      checkPageBreak(60);
      doc.fontSize(14)
         .fillColor('#007bff')
         .text('OBJET DU DEVIS', 50, currentY);
      currentY += 20;

      doc.fontSize(12)
         .fillColor('#000000')
         .text(devisLongData.objet, 50, currentY, { width: 495 });
      currentY += 50;

      // === TABLEAU DES PRESTATIONS ===
      checkPageBreak(80); // S'assurer qu'on a la place pour l'en-tête du tableau

      const tableLeft = 50;
      const tableWidth = 495;
      const rowHeight = 50; // Hauteur fixe par ligne pour éviter les coupures

      // En-tête du tableau
      doc.fontSize(10)
         .fillColor('#ffffff')
         .rect(tableLeft, currentY, tableWidth, 30)
         .fill('#007bff');

      doc.fillColor('#ffffff')
         .text('DÉSIGNATION', tableLeft + 10, currentY + 10, { width: 200 })
         .text('QTÉ', tableLeft + 220, currentY + 10, { width: 40, align: 'center' })
         .text('PRIX UNITAIRE', tableLeft + 270, currentY + 10, { width: 80, align: 'center' })
         .text('TOTAL HT', tableLeft + 360, currentY + 10, { width: 80, align: 'right' });

      currentY += 30;

      // Lignes du tableau avec gestion de pagination
      devisLongData.items.forEach((item, index) => {
        // Vérifier si on a assez de place pour cette ligne
        if (checkPageBreak(rowHeight + 10)) {
          // Redessiner l'en-tête du tableau sur la nouvelle page
          doc.fontSize(10)
             .fillColor('#ffffff')
             .rect(tableLeft, currentY, tableWidth, 30)
             .fill('#007bff');

          doc.fillColor('#ffffff')
             .text('DÉSIGNATION', tableLeft + 10, currentY + 10, { width: 200 })
             .text('QTÉ', tableLeft + 220, currentY + 10, { width: 40, align: 'center' })
             .text('PRIX UNITAIRE', tableLeft + 270, currentY + 10, { width: 80, align: 'center' })
             .text('TOTAL HT', tableLeft + 360, currentY + 10, { width: 80, align: 'right' });

          currentY += 30;
          console.log(`📋 En-tête tableau redessiner sur nouvelle page`);
        }

        // Fond alterné
        if (index % 2 === 0) {
          doc.fillColor('#f8f9fa')
             .rect(tableLeft, currentY, tableWidth, rowHeight)
             .fill();
        }

        // Contenu de la ligne
        doc.fillColor('#000000')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(item.designation, tableLeft + 10, currentY + 8, { width: 200 });

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#666666')
           .text(item.description, tableLeft + 10, currentY + 22, { width: 200 });

        doc.fontSize(10)
           .fillColor('#000000')
           .text(item.quantite.toString(), tableLeft + 220, currentY + 15, { width: 40, align: 'center' })
           .text(`${item.prixUnitaire.toLocaleString('fr-FR')} €`, tableLeft + 270, currentY + 15, { width: 80, align: 'center' })
           .font('Helvetica-Bold')
           .text(`${item.total.toLocaleString('fr-FR')} €`, tableLeft + 360, currentY + 15, { width: 80, align: 'right' });

        currentY += rowHeight;
        console.log(`✅ Ligne ${index + 1}/${devisLongData.items.length}: ${item.designation} - Y=${currentY}`);
      });

      // === TOTAUX ===
      checkPageBreak(120);
      currentY += 20;

      const totalsLeft = 350;
      const totalsWidth = 195;

      // Sous-total
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica')
         .text('Sous-total HT:', totalsLeft, currentY)
         .text(`${devisLongData.sousTotal.toLocaleString('fr-FR')} €`, totalsLeft + 100, currentY, { width: 95, align: 'right' });

      currentY += 20;
      // TVA
      doc.text('TVA (20%):', totalsLeft, currentY)
         .text(`${devisLongData.tva.toLocaleString('fr-FR')} €`, totalsLeft + 100, currentY, { width: 95, align: 'right' });

      currentY += 30;
      // Total TTC
      doc.fontSize(14)
         .fillColor('#ffffff')
         .rect(totalsLeft - 10, currentY - 8, totalsWidth + 20, 30)
         .fill('#007bff');

      doc.font('Helvetica-Bold')
         .text('TOTAL TTC:', totalsLeft, currentY + 5)
         .text(`${devisLongData.total.toLocaleString('fr-FR')} €`, totalsLeft + 100, currentY + 5, { width: 95, align: 'right' });

      currentY += 50;

      // === CONDITIONS ===
      if (devisLongData.conditions) {
        checkPageBreak(80);
        doc.fontSize(12)
           .fillColor('#007bff')
           .font('Helvetica-Bold')
           .text('CONDITIONS GÉNÉRALES', 50, currentY);

        currentY += 20;
        doc.fontSize(10)
           .fillColor('#000000')
           .font('Helvetica')
           .text(devisLongData.conditions, 50, currentY, { width: 495, lineGap: 3 });
        
        currentY += 60;
      }

      // === NOTES ===
      if (devisLongData.notes) {
        checkPageBreak(80);
        doc.fontSize(12)
           .fillColor('#007bff')
           .font('Helvetica-Bold')
           .text('NOTES', 50, currentY);

        currentY += 20;
        doc.fontSize(10)
           .fillColor('#000000')
           .font('Helvetica')
           .text(devisLongData.notes, 50, currentY, { width: 495, lineGap: 3 });
      }

      // === FOOTER ===
      doc.fontSize(8)
         .fillColor('#999999')
         .text('Devis généré par VelocitaLeads CRM - Test de pagination', 50, 750, { align: 'center', width: 495 });

      // Finaliser le document
      doc.end();

      // Attendre que le stream soit terminé
      stream.on('finish', () => {
        const stats = fs.statSync(filePath);
        console.log(`✅ Devis avec pagination généré: ${fileName}`);
        console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`   Chemin: ${filePath}`);
        console.log(`   Total HT: ${devisLongData.sousTotal.toLocaleString('fr-FR')} €`);
        console.log(`   Total TTC: ${devisLongData.total.toLocaleString('fr-FR')} €`);
        resolve(filePath);
      });

      stream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
}

// Exécuter le test
if (require.main === module) {
  genererDevisAvecPagination()
    .then(() => {
      console.log('🎉 Test de pagination terminé avec succès !');
      console.log('📋 Vérifiez que les éléments du tableau ne sont pas coupés entre les pages');
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = { genererDevisAvecPagination, devisLongData };