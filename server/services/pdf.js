const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  constructor() {
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dirs = ['./uploads', './uploads/quotes'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async generateQuote(quoteData, leadData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const filename = `quote-${quoteData.id || Date.now()}.pdf`;
        const filepath = path.join('./uploads/quotes', filename);
        
        // Stream vers fichier
        doc.pipe(fs.createWriteStream(filepath));

        // En-tête
        this.addHeader(doc, leadData);
        
        // Informations client
        this.addClientInfo(doc, leadData);
        
        // Tableau des produits
        this.addProductsTable(doc, quoteData.data);
        
        // Totaux
        this.addTotals(doc, quoteData.data);
        
        // Conditions
        this.addConditions(doc, quoteData.data);
        
        // Pied de page
        this.addFooter(doc);

        doc.end();

        doc.on('end', () => {
          resolve({
            filename,
            filepath,
            url: `/api/quotes/pdf/${filename}`
          });
        });

        doc.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  addHeader(doc, leadData) {
    // Logo et titre (simulé)
    doc.fontSize(24)
       .fillColor('#2563eb')
       .text('CRM INTELLIGENT', 50, 50);
    
    doc.fontSize(12)
       .fillColor('#666')
       .text('Votre partenaire en automatisation commerciale', 50, 80);

    // Informations entreprise
    doc.fontSize(10)
       .fillColor('#333')
       .text('123 Rue de la Tech', 400, 50)
       .text('75001 Paris', 400, 65)
       .text('contact@crm-intelligent.com', 400, 80)
       .text('01 23 45 67 89', 400, 95);

    // Titre devis
    doc.fontSize(20)
       .fillColor('#1f2937')
       .text('DEVIS', 50, 140);

    // Numéro et date
    const today = new Date().toLocaleDateString('fr-FR');
    doc.fontSize(10)
       .text(`N° DEV-${Date.now().toString().slice(-6)}`, 400, 140)
       .text(`Date: ${today}`, 400, 155)
       .text(`Validité: 30 jours`, 400, 170);

    doc.moveDown(3);
  }

  addClientInfo(doc, leadData) {
    const y = 200;
    
    doc.fontSize(12)
       .fillColor('#1f2937')
       .text('DESTINATAIRE:', 50, y);

    doc.fontSize(10)
       .fillColor('#333')
       .text(leadData.contact.name, 50, y + 20)
       .text(leadData.contact.company, 50, y + 35)
       .text(leadData.contact.email, 50, y + 50)
       .text(leadData.contact.phone || '', 50, y + 65);

    doc.moveDown(4);
  }

  addProductsTable(doc, data) {
    const startY = 300;
    let currentY = startY;

    // En-têtes du tableau
    doc.fontSize(10)
       .fillColor('#1f2937')
       .text('DÉSIGNATION', 50, currentY)
       .text('QTÉ', 350, currentY)
       .text('PRIX UNIT.', 400, currentY)
       .text('TOTAL HT', 480, currentY);

    // Ligne de séparation
    currentY += 20;
    doc.moveTo(50, currentY)
       .lineTo(550, currentY)
       .stroke('#ddd');

    currentY += 10;

    // Produits
    data.produits.forEach(produit => {
      doc.fontSize(9)
         .fillColor('#333')
         .text(produit.name, 50, currentY)
         .text(produit.description, 50, currentY + 12, { width: 280 })
         .text(produit.quantity.toString(), 350, currentY)
         .text(`${produit.price.toLocaleString('fr-FR')} €`, 400, currentY)
         .text(`${(produit.price * produit.quantity).toLocaleString('fr-FR')} €`, 480, currentY);

      currentY += 40;
    });

    return currentY;
  }

  addTotals(doc, data) {
    const startY = 450;
    
    // Ligne de séparation
    doc.moveTo(350, startY)
       .lineTo(550, startY)
       .stroke('#ddd');

    // Totaux
    doc.fontSize(10)
       .fillColor('#333')
       .text('Sous-total HT:', 400, startY + 15)
       .text(`${data.total.toLocaleString('fr-FR')} €`, 480, startY + 15)
       .text('TVA (20%):', 400, startY + 30)
       .text(`${data.tva.toLocaleString('fr-FR')} €`, 480, startY + 30);

    // Total TTC
    doc.fontSize(12)
       .fillColor('#1f2937')
       .text('TOTAL TTC:', 400, startY + 50)
       .text(`${data.totalTTC.toLocaleString('fr-FR')} €`, 480, startY + 50);
  }

  addConditions(doc, data) {
    const startY = 550;
    
    doc.fontSize(12)
       .fillColor('#1f2937')
       .text('CONDITIONS:', 50, startY);

    doc.fontSize(9)
       .fillColor('#333')
       .text(data.conditions, 50, startY + 20, { width: 500 })
       .text(`Devis valable ${data.validite}`, 50, startY + 40)
       .text('Règlement par virement bancaire ou chèque', 50, startY + 55)
       .text('Livraison sous 2 à 4 semaines après signature', 50, startY + 70);
  }

  addFooter(doc) {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 100;

    doc.fontSize(8)
       .fillColor('#666')
       .text('CRM Intelligent - SAS au capital de 10 000€ - SIRET: 123 456 789 00012', 50, footerY)
       .text('RCS Paris - TVA: FR12345678901', 50, footerY + 15)
       .text('Ce devis a été généré automatiquement par notre IA', 50, footerY + 30);
  }
}

module.exports = new PDFService();