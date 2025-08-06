// import puppeteer from 'puppeteer'; // Désactivé pour Render
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
const PDFLibDocument = require('pdf-lib').PDFDocument;
import { config } from '@/config';
import { logger, logPdf } from '@/utils/logger';

// Fonction pour générer un mot de passe PDF sécurisé (non stocké)
const generatePDFPassword = (quoteId: string, quoteNumber: string, timestamp: number): string => {
  // Utilise des données du devis + timestamp pour créer un mot de passe unique
  const salt = process.env.PDF_SALT || 'velocitaleads-pdf-protection-2025';
  const data = `${quoteId}-${quoteNumber}-${timestamp}-${salt}`;
  
  // Génère un hash SHA-256 et prend les 16 premiers caractères
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  
  // Format: VL-XXXX-XXXX pour être plus lisible si besoin
  const password = `VL-${hash.substring(0, 4).toUpperCase()}-${hash.substring(4, 8).toUpperCase()}`;
  
  return password;
};

// Fonction pour protéger un PDF avec un mot de passe (vraie protection avec qpdf)
const protectPDFWithPassword = async (inputPath: string, outputPath: string, password: string): Promise<void> => {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    // Vérifier si qpdf est installé
    try {
      await execAsync('qpdf --version');
    } catch (error) {
      logger.warn('qpdf non installé, utilisation de la protection basique avec métadonnées');
      
      // Fallback : Protection basique avec métadonnées seulement
      const existingPdfBytes = fs.readFileSync(inputPath);
      const pdfDoc = await PDFLibDocument.load(existingPdfBytes);
      
      // Ajouter des métadonnées de protection + watermark
      pdfDoc.setTitle('Document protégé - VelocitaLeads');
      pdfDoc.setSubject(`Devis commercial protégé - Mot de passe: ${password}`);
      pdfDoc.setCreator('VelocitaLeads CRM');
      pdfDoc.setProducer('VelocitaLeads PDF Protection');
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());
      
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(outputPath, pdfBytes);
      
      if (inputPath !== outputPath) {
        fs.unlinkSync(inputPath);
      }
      
      logger.info('PDF protégé avec métadonnées (protection basique)', { outputPath, password });
      return;
    }
    
    // Protection lecture seule avec qpdf (ouverture libre, modification impossible)
    const command = `qpdf --encrypt "" "" 256 --modify=none --extract=n --print=full --assemble=n -- "${inputPath}" "${outputPath}"`;
    
    await execAsync(command);
    
    // Supprimer le fichier temporaire non protégé
    if (inputPath !== outputPath) {
      fs.unlinkSync(inputPath);
    }
    
    logger.info('PDF verrouillé en lecture seule avec qpdf', { outputPath, readOnly: true, canOpen: true, canModify: false });
  } catch (error) {
    logger.error('Erreur lors de la protection du PDF:', error);
    throw error;
  }
};

// Énumération des types de templates
enum TemplateType {
  BASIC = 'basic',
  PREMIUM = 'premium'
}

// Interface pour les options de génération PDF
interface PDFGenerationOptions {
  templateType: TemplateType;
  isPremium: boolean;
  protectionLevel?: 'none' | 'basic' | 'strong'; // none: aucune protection, basic: métadonnées, strong: lecture seule
  customBranding?: {
    logo?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
    fonts?: {
      primary: string;
      secondary: string;
    };
  };
}

// Interface pour les données de devis
interface QuoteData {
  id: string;
  numero: string;
  objet: string;
  dateCreation: Date;
  dateValidite: Date;
  sousTotal: number;
  tva: number;
  total: number;
  conditions?: string | null;
  notes?: string | null;
  user: {
    nom: string;
    prenom: string;
    email: string;
    entreprise?: string | null;
    siret?: string | null;
    telephone?: string | null;
    adresse?: string | null;
    codePostal?: string | null;
    ville?: string | null;
    pays: string;
  };
  contact: {
    nom: string;
    prenom: string;
    email: string;
    entreprise?: string | null;
    adresse?: string | null;
    codePostal?: string | null;
    ville?: string | null;
    pays: string;
  };
  items: Array<{
    designation: string;
    description?: string | null;
    quantite: number;
    prixUnitaire: number;
    total: number;
  }>;
}

// Template HTML pour le PDF de devis
const generateQuotePDFTemplate = (quote: QuoteData): string => {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Devis ${quote.numero}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #007bff;
        }
        
        .company-info {
          flex: 1;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 10px;
        }
        
        .company-details {
          font-size: 11px;
          color: #666;
          line-height: 1.5;
        }
        
        .quote-title {
          text-align: right;
          flex: 1;
        }
        
        .quote-title h1 {
          font-size: 28px;
          color: #007bff;
          margin-bottom: 5px;
        }
        
        .quote-number {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
        }
        
        .quote-dates {
          font-size: 11px;
          color: #666;
        }
        
        .addresses {
          display: flex;
          justify-content: space-between;
          margin: 30px 0;
        }
        
        .address-block {
          flex: 1;
          margin-right: 20px;
        }
        
        .address-block:last-child {
          margin-right: 0;
        }
        
        .address-title {
          font-weight: bold;
          font-size: 13px;
          margin-bottom: 10px;
          color: #007bff;
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 5px;
        }
        
        .address-content {
          font-size: 11px;
          line-height: 1.5;
        }
        
        .quote-object {
          margin: 30px 0;
          padding: 15px;
          background: #f8f9fa;
          border-left: 4px solid #007bff;
        }
        
        .quote-object h3 {
          font-size: 14px;
          margin-bottom: 5px;
          color: #007bff;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
        }
        
        .items-table th {
          background: #007bff;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-size: 11px;
          font-weight: bold;
        }
        
        .items-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #e9ecef;
          font-size: 11px;
        }
        
        .items-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        .items-table .designation {
          width: 40%;
        }
        
        .items-table .quantity {
          width: 10%;
          text-align: center;
        }
        
        .items-table .unit-price {
          width: 15%;
          text-align: right;
        }
        
        .items-table .total {
          width: 15%;
          text-align: right;
          font-weight: bold;
        }
        
        .description {
          font-style: italic;
          color: #666;
          margin-top: 3px;
        }
        
        .totals {
          width: 300px;
          margin-left: auto;
          margin-top: 20px;
        }
        
        .totals table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .totals td {
          padding: 8px 12px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .totals .label {
          text-align: left;
          font-weight: bold;
        }
        
        .totals .amount {
          text-align: right;
        }
        
        .totals .final-total {
          background: #007bff;
          color: white;
          font-weight: bold;
          font-size: 14px;
        }
        
        .conditions {
          margin-top: 40px;
          page-break-inside: avoid;
        }
        
        .conditions h3 {
          font-size: 14px;
          margin-bottom: 10px;
          color: #007bff;
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 5px;
        }
        
        .conditions-content {
          font-size: 11px;
          line-height: 1.6;
          white-space: pre-line;
        }
        
        .notes {
          margin-top: 30px;
          padding: 15px;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
          page-break-inside: avoid;
        }
        
        .notes h3 {
          font-size: 13px;
          margin-bottom: 10px;
          color: #856404;
        }
        
        .notes-content {
          font-size: 11px;
          line-height: 1.6;
          white-space: pre-line;
          color: #856404;
        }
        
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #e9ecef;
          padding-top: 20px;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <div class="company-name">${quote.user.entreprise || `${quote.user.prenom} ${quote.user.nom}`}</div>
          <div class="company-details">
            ${quote.user.prenom} ${quote.user.nom}<br>
            ${quote.user.adresse ? `${quote.user.adresse}<br>` : ''}
            ${quote.user.codePostal ? `${quote.user.codePostal} ` : ''}${quote.user.ville ? `${quote.user.ville}<br>` : ''}
            ${quote.user.telephone ? `Tél : ${quote.user.telephone}<br>` : ''}
            Email : ${quote.user.email}<br>
            ${quote.user.siret ? `SIRET : ${quote.user.siret}` : ''}
          </div>
        </div>
        <div class="quote-title">
          <h1>DEVIS</h1>
          <div class="quote-number">N° ${quote.numero}</div>
          <div class="quote-dates">
            Date : ${quote.dateCreation.toLocaleDateString('fr-FR')}<br>
            Valable jusqu'au : ${quote.dateValidite.toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>

      <div class="addresses">
        <div class="address-block">
          <div class="address-title">ÉMETTEUR</div>
          <div class="address-content">
            ${quote.user.entreprise || `${quote.user.prenom} ${quote.user.nom}`}<br>
            ${quote.user.adresse ? `${quote.user.adresse}<br>` : ''}
            ${quote.user.codePostal ? `${quote.user.codePostal} ` : ''}${quote.user.ville || ''}<br>
            ${quote.user.pays}
          </div>
        </div>
        <div class="address-block">
          <div class="address-title">CLIENT</div>
          <div class="address-content">
            ${quote.contact.prenom} ${quote.contact.nom}<br>
            ${quote.contact.entreprise ? `${quote.contact.entreprise}<br>` : ''}
            ${quote.contact.adresse ? `${quote.contact.adresse}<br>` : ''}
            ${quote.contact.codePostal ? `${quote.contact.codePostal} ` : ''}${quote.contact.ville || ''}<br>
            ${quote.contact.pays}<br>
            ${quote.contact.email}
          </div>
        </div>
      </div>

      <div class="quote-object">
        <h3>Objet du devis</h3>
        <div>${quote.objet}</div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th class="designation">Désignation</th>
            <th class="quantity">Qté</th>
            <th class="unit-price">Prix unitaire</th>
            <th class="total">Total HT</th>
          </tr>
        </thead>
        <tbody>
          ${quote.items.map(item => `
            <tr>
              <td class="designation">
                <strong>${item.designation}</strong>
                ${item.description ? `<div class="description">${item.description}</div>` : ''}
              </td>
              <td class="quantity">${item.quantite}</td>
              <td class="unit-price">${item.prixUnitaire.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
              <td class="total">${item.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <table>
          <tr>
            <td class="label">Sous-total HT :</td>
            <td class="amount">${quote.sousTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
          </tr>
          <tr>
            <td class="label">TVA (20%) :</td>
            <td class="amount">${quote.tva.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
          </tr>
          <tr class="final-total">
            <td class="label">TOTAL TTC :</td>
            <td class="amount">${quote.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
          </tr>
        </table>
      </div>

      ${quote.conditions ? `
        <div class="conditions">
          <h3>Conditions générales</h3>
          <div class="conditions-content">${quote.conditions}</div>
        </div>
      ` : ''}

      ${quote.notes ? `
        <div class="notes">
          <h3>Notes</h3>
          <div class="notes-content">${quote.notes}</div>
        </div>
      ` : ''}

      <div class="footer">
        <p>Devis généré automatiquement par VelocitaLeads CRM le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        <p>Ce devis est valable jusqu'au ${quote.dateValidite.toLocaleDateString('fr-FR')} et ne constitue pas une facture.</p>
      </div>
    </body>
    </html>
  `;
};

// Fonction pour générer un PDF avec PDFKit (template de base avec pagination)
const generateBasicQuotePDF = async (quote: QuoteData, options: PDFGenerationOptions): Promise<string> => {
  try {
    logPdf('pdf_generation_start_basic', quote.id, { numero: quote.numero });

    // S'assurer que le dossier de sortie existe
    const outputDir = config.pdf.outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Nom du fichier PDF
    const timestamp = Date.now();
    const fileName = `Devis_${quote.numero}_${timestamp}.pdf`;
    const filePath = path.join(outputDir, fileName);

    // Créer un nouveau document PDF avec PDFKit
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Devis ${quote.numero}`,
        Author: `${quote.user.prenom} ${quote.user.nom}`,
        Subject: quote.objet,
        Creator: 'VelocitaLeads CRM',
        Producer: 'VelocitaLeads PDF Generator'
      }
    });

    // Créer le stream de sortie
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Couleurs du thème
    const colors = options.customBranding?.colors || {
      primary: '#007bff',
      secondary: '#6c757d'
    };

    // Variables pour la gestion de la pagination
    const pageHeight = 792; // Hauteur page A4 en points
    const marginBottom = 100; // Marge du bas pour éviter de couper
    let currentY = 50;

    // Fonction pour vérifier si on a assez de place
    function checkPageBreak(neededHeight: number): boolean {
      if (currentY + neededHeight > pageHeight - marginBottom) {
        doc.addPage();
        currentY = 50;
        logger.info(`PDF: Nouvelle page ajoutée à Y=${currentY}`);
        return true;
      }
      return false;
    }

    // === EN-TÊTE ===
    doc.fontSize(28)
       .fillColor(colors.primary)
       .text('DEVIS', 50, currentY, { align: 'center' });
    currentY += 40;

    doc.fontSize(18)
       .fillColor('#000000')
       .text(`N° ${quote.numero}`, 50, currentY, { align: 'center' });
    currentY += 30;

    // Ligne de séparation
    doc.moveTo(50, currentY)
       .lineTo(545, currentY)
       .strokeColor(colors.primary)
       .lineWidth(2)
       .stroke();
    currentY += 20;

    // === INFORMATIONS ENTREPRISE ET CLIENT ===
    checkPageBreak(150); // Vérifier qu'on a la place pour les infos

    // Émetteur (gauche)
    doc.fontSize(14)
       .fillColor(colors.primary)
       .text('ÉMETTEUR', 50, currentY);

    let yPosLeft = currentY + 25;
    doc.fontSize(11)
       .fillColor('#000000');

    if (quote.user.entreprise) {
      doc.text(quote.user.entreprise, 50, yPosLeft, { width: 200 });
      yPosLeft += 15;
    }

    doc.text(`${quote.user.prenom} ${quote.user.nom}`, 50, yPosLeft);
    yPosLeft += 15;

    if (quote.user.adresse) {
      doc.text(quote.user.adresse, 50, yPosLeft);
      yPosLeft += 15;
    }

    if (quote.user.codePostal || quote.user.ville) {
      doc.text(`${quote.user.codePostal || ''} ${quote.user.ville || ''}`, 50, yPosLeft);
      yPosLeft += 15;
    }

    doc.text(quote.user.pays, 50, yPosLeft);
    yPosLeft += 15;

    if (quote.user.email) {
      doc.text(`Email: ${quote.user.email}`, 50, yPosLeft);
      yPosLeft += 15;
    }

    if (quote.user.telephone) {
      doc.text(`Tél: ${quote.user.telephone}`, 50, yPosLeft);
      yPosLeft += 15;
    }

    if (quote.user.siret) {
      doc.text(`SIRET: ${quote.user.siret}`, 50, yPosLeft);
      yPosLeft += 15;
    }

    // Client (droite)
    let yPosRight = currentY;
    doc.fontSize(14)
       .fillColor(colors.primary)
       .text('CLIENT', 320, yPosRight);

    yPosRight += 25;
    doc.fontSize(11)
       .fillColor('#000000');

    if (quote.contact.entreprise) {
      doc.text(quote.contact.entreprise, 320, yPosRight, { width: 200 });
      yPosRight += 15;
    }

    doc.text(`${quote.contact.prenom} ${quote.contact.nom}`, 320, yPosRight);
    yPosRight += 15;

    if (quote.contact.adresse) {
      doc.text(quote.contact.adresse, 320, yPosRight);
      yPosRight += 15;
    }

    if (quote.contact.codePostal || quote.contact.ville) {
      doc.text(`${quote.contact.codePostal || ''} ${quote.contact.ville || ''}`, 320, yPosRight);
      yPosRight += 15;
    }

    doc.text(quote.contact.pays, 320, yPosRight);
    yPosRight += 15;

    doc.text(`Email: ${quote.contact.email}`, 320, yPosRight);

    currentY = Math.max(yPosLeft, yPosRight) + 30;

    // === DATES ===
    checkPageBreak(40);
    doc.fontSize(12)
       .fillColor('#666666')
       .text(`Date: ${quote.dateCreation.toLocaleDateString('fr-FR')}`, 50, currentY);
    doc.text(`Validité: ${quote.dateValidite.toLocaleDateString('fr-FR')}`, 320, currentY);
    currentY += 30;

    // === OBJET ===
    checkPageBreak(60);
    doc.fontSize(14)
       .fillColor(colors.primary)
       .text('OBJET DU DEVIS', 50, currentY);
    currentY += 20;

    doc.fontSize(12)
       .fillColor('#000000')
       .text(quote.objet, 50, currentY, { width: 495 });
    currentY += 50;

    // === TABLEAU DES PRESTATIONS ===
    checkPageBreak(80); // S'assurer qu'on a la place pour l'en-tête du tableau

    const tableLeft = 50;
    const tableWidth = 495;
    const rowHeight = 50; // Hauteur fixe par ligne pour éviter les coupures

    // Fonction pour dessiner l'en-tête du tableau
    function drawTableHeader() {
      doc.fontSize(10)
         .fillColor('#ffffff')
         .rect(tableLeft, currentY, tableWidth, 30)
         .fill(colors.primary);

      doc.fillColor('#ffffff')
         .text('DÉSIGNATION', tableLeft + 10, currentY + 10, { width: 200 })
         .text('QTÉ', tableLeft + 220, currentY + 10, { width: 40, align: 'center' })
         .text('PRIX UNITAIRE', tableLeft + 270, currentY + 10, { width: 80, align: 'center' })
         .text('TOTAL HT', tableLeft + 360, currentY + 10, { width: 80, align: 'right' });

      currentY += 30;
    }

    // Dessiner l'en-tête initial
    drawTableHeader();

    // Lignes du tableau avec gestion de pagination
    quote.items.forEach((item, index) => {
      // Vérifier si on a assez de place pour cette ligne
      if (checkPageBreak(rowHeight + 10)) {
        // Redessiner l'en-tête du tableau sur la nouvelle page
        drawTableHeader();
        logger.info(`PDF: En-tête tableau redessiné sur nouvelle page`);
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

      if (item.description) {
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#666666')
           .text(item.description, tableLeft + 10, currentY + 22, { width: 200 });
      }

      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text(item.quantite.toString(), tableLeft + 220, currentY + 15, { width: 40, align: 'center' })
         .text(item.prixUnitaire.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }), 
               tableLeft + 270, currentY + 15, { width: 80, align: 'center' })
         .font('Helvetica-Bold')
         .text(item.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }), 
               tableLeft + 360, currentY + 15, { width: 80, align: 'right' });

      currentY += rowHeight;
    });

    // === TOTAUX ===
    checkPageBreak(120);
    currentY += 30;

    const totalsLeft = 350;
    const totalsWidth = 195;

    // Sous-total
    doc.fontSize(11)
       .fillColor('#000000')
       .font('Helvetica')
       .text('Sous-total HT:', totalsLeft, currentY)
       .text(quote.sousTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }), 
             totalsLeft + 100, currentY, { width: 95, align: 'right' });

    currentY += 20;
    // TVA
    doc.text('TVA (20%):', totalsLeft, currentY)
       .text(quote.tva.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }), 
             totalsLeft + 100, currentY, { width: 95, align: 'right' });

    currentY += 30;
    // Total TTC
    doc.fontSize(14)
       .fillColor('#ffffff')
       .rect(totalsLeft - 10, currentY - 8, totalsWidth + 20, 30)
       .fill(colors.primary);

    doc.font('Helvetica-Bold')
       .text('TOTAL TTC:', totalsLeft, currentY + 5)
       .text(quote.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }), 
             totalsLeft + 100, currentY + 5, { width: 95, align: 'right' });

    currentY += 50;

    // === CONDITIONS ===
    if (quote.conditions) {
      checkPageBreak(80);
      doc.fontSize(12)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text('CONDITIONS GÉNÉRALES', 50, currentY);

      currentY += 20;
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text(quote.conditions, 50, currentY, { width: 495, lineGap: 3 });
      
      currentY += 60;
    }

    // === NOTES ===
    if (quote.notes) {
      checkPageBreak(80);
      doc.fontSize(12)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text('NOTES', 50, currentY);

      currentY += 20;
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text(quote.notes, 50, currentY, { width: 495, lineGap: 3 });
    }

    // === FOOTER ===
    if (!options.isPremium) {
      doc.fontSize(8)
         .fillColor('#999999')
         .text('Devis généré par VelocitaLeads CRM - www.velocitaleads.com', 50, 750, { align: 'center', width: 495 });
    }

    // Finaliser le document
    doc.end();

    // Attendre que le stream soit terminé
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    logPdf('pdf_generation_success_basic', quote.id, { 
      filePath,
      fileSize: fs.statSync(filePath).size 
    });

    return filePath;

  } catch (error) {
    logger.error('Erreur lors de la génération du PDF avec PDFKit:', error);
    throw error;
  }
};

// Fonction pour générer un PDF avec Puppeteer (template premium)
const generatePremiumQuotePDF = async (quote: QuoteData, options: PDFGenerationOptions): Promise<string> => {
  // Puppeteer désactivé pour Render - utiliser le template basique
  return generateBasicQuotePDF(quote, options);
};

// Template HTML premium avec customisation
const generatePremiumQuotePDFTemplate = (quote: QuoteData, options: PDFGenerationOptions): string => {
  const colors = options.customBranding?.colors || {
    primary: '#007bff',
    secondary: '#6c757d'
  };

  const fonts = options.customBranding?.fonts || {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    secondary: 'Georgia, serif'
  };

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Devis ${quote.numero}</title>
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
          font-family: ${fonts.primary};
          font-size: 12px;
          line-height: 1.5;
          color: #333;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding: 30px;
          background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
          color: white;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .company-info {
          flex: 1;
        }
        
        .company-name {
          font-family: ${fonts.secondary};
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 15px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .quote-number {
          font-size: 20px;
          font-weight: bold;
          background: rgba(255,255,255,0.2);
          padding: 10px 20px;
          border-radius: 25px;
          backdrop-filter: blur(10px);
        }
        
        .addresses {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          gap: 40px;
        }
        
        .address-block {
          flex: 1;
          background: white;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          border-left: 5px solid ${colors.primary};
        }
        
        .address-title {
          font-size: 14px;
          font-weight: bold;
          color: ${colors.primary};
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .quote-object {
          background: white;
          padding: 25px;
          margin-bottom: 30px;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          border-left: 5px solid ${colors.secondary};
        }
        
        .quote-object h3 {
          color: ${colors.primary};
          font-size: 16px;
          margin-bottom: 15px;
          font-family: ${fonts.secondary};
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        
        .items-table thead {
          background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
          color: white;
        }
        
        .items-table th {
          padding: 15px;
          text-align: left;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .items-table td {
          padding: 15px;
          border-bottom: 1px solid #eee;
        }
        
        .items-table tbody tr:hover {
          background-color: #f8f9fa;
          transition: background-color 0.3s ease;
        }
        
        .items-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        .designation {
          width: 50%;
        }
        
        .quantity {
          width: 15%;
          text-align: center;
        }
        
        .unit-price {
          width: 20%;
          text-align: right;
        }
        
        .total {
          width: 15%;
          text-align: right;
          font-weight: 600;
        }
        
        .description {
          font-size: 10px;
          color: #666;
          margin-top: 5px;
          font-style: italic;
        }
        
        .totals {
          background: white;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          margin-bottom: 30px;
        }
        
        .totals table {
          width: 100%;
          max-width: 300px;
          margin-left: auto;
        }
        
        .totals .label {
          text-align: right;
          padding: 8px 15px;
          font-weight: 500;
        }
        
        .totals .amount {
          text-align: right;
          padding: 8px 15px;
          font-weight: 600;
          width: 120px;
        }
        
        .final-total {
          background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
          color: white;
          font-size: 14px;
          font-weight: bold;
        }
        
        .final-total .label,
        .final-total .amount {
          padding: 12px 15px;
        }
        
        .conditions,
        .notes {
          background: white;
          padding: 25px;
          margin-bottom: 20px;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        
        .conditions h3,
        .notes h3 {
          color: ${colors.primary};
          font-size: 14px;
          margin-bottom: 15px;
          font-family: ${fonts.secondary};
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .conditions-content,
        .notes-content {
          line-height: 1.6;
          color: #555;
        }
        
        .dates {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          gap: 20px;
        }
        
        .date-item {
          background: white;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.05);
          flex: 1;
          text-align: center;
          border-top: 3px solid ${colors.primary};
        }
        
        .date-label {
          font-size: 10px;
          color: ${colors.secondary};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        
        .date-value {
          font-size: 12px;
          font-weight: 600;
          color: ${colors.primary};
        }
        
        ${!options.isPremium ? '' : `
        .footer {
          text-align: center;
          margin-top: 40px;
          padding: 20px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 10px;
          font-size: 10px;
          color: #666;
        }
        `}
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <div class="company-name">${quote.user.entreprise || `${quote.user.prenom} ${quote.user.nom}`}</div>
          <div>${quote.user.prenom} ${quote.user.nom}</div>
          ${quote.user.adresse ? `<div>${quote.user.adresse}</div>` : ''}
          <div>${quote.user.codePostal ? `${quote.user.codePostal} ` : ''}${quote.user.ville || ''}</div>
          <div>${quote.user.pays}</div>
          <div>${quote.user.email}</div>
          ${quote.user.telephone ? `<div>${quote.user.telephone}</div>` : ''}
          ${quote.user.siret ? `<div>SIRET: ${quote.user.siret}</div>` : ''}
        </div>
        <div class="quote-number">
          DEVIS N° ${quote.numero}
        </div>
      </div>

      <div class="dates">
        <div class="date-item">
          <div class="date-label">Date de création</div>
          <div class="date-value">${quote.dateCreation.toLocaleDateString('fr-FR')}</div>
        </div>
        <div class="date-item">
          <div class="date-label">Date de validité</div>
          <div class="date-value">${quote.dateValidite.toLocaleDateString('fr-FR')}</div>
        </div>
      </div>

      <div class="addresses">
        <div class="address-block">
          <div class="address-title">Destinataire</div>
          <div class="address-content">
            ${quote.contact.prenom} ${quote.contact.nom}<br>
            ${quote.contact.entreprise ? `${quote.contact.entreprise}<br>` : ''}
            ${quote.contact.adresse ? `${quote.contact.adresse}<br>` : ''}
            ${quote.contact.codePostal ? `${quote.contact.codePostal} ` : ''}${quote.contact.ville || ''}<br>
            ${quote.contact.pays}<br>
            ${quote.contact.email}
          </div>
        </div>
      </div>

      <div class="quote-object">
        <h3>Objet du devis</h3>
        <div>${quote.objet}</div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th class="designation">Désignation</th>
            <th class="quantity">Qté</th>
            <th class="unit-price">Prix unitaire</th>
            <th class="total">Total HT</th>
          </tr>
        </thead>
        <tbody>
          ${quote.items.map(item => `
            <tr>
              <td class="designation">
                <strong>${item.designation}</strong>
                ${item.description ? `<div class="description">${item.description}</div>` : ''}
              </td>
              <td class="quantity">${item.quantite}</td>
              <td class="unit-price">${item.prixUnitaire.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
              <td class="total">${item.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <table>
          <tr>
            <td class="label">Sous-total HT :</td>
            <td class="amount">${quote.sousTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
          </tr>
          <tr>
            <td class="label">TVA (20%) :</td>
            <td class="amount">${quote.tva.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
          </tr>
          <tr class="final-total">
            <td class="label">TOTAL TTC :</td>
            <td class="amount">${quote.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
          </tr>
        </table>
      </div>

      ${quote.conditions ? `
        <div class="conditions">
          <h3>Conditions générales</h3>
          <div class="conditions-content">${quote.conditions}</div>
        </div>
      ` : ''}

      ${quote.notes ? `
        <div class="notes">
          <h3>Notes</h3>
          <div class="notes-content">${quote.notes}</div>
        </div>
      ` : ''}

      ${!options.isPremium ? `
        <div class="footer">
          Devis généré par VelocitaLeads CRM - www.velocitaleads.com
        </div>
      ` : ''}
    </body>
    </html>
  `;
};

// Fonction principale pour générer le PDF d'un devis (hybride)
export const generateQuotePDF = async (quote: QuoteData, options?: Partial<PDFGenerationOptions>): Promise<string> => {
  try {
    // Vérifications de sécurité
    if (!quote?.contact?.nom || !quote?.contact?.prenom) {
      throw new Error('Nom ou prénom du contact manquant');
    }
    if (!quote?.contact?.email) {
      throw new Error('Email du contact manquant');
    }
    if (!quote?.user?.nom || !quote?.user?.prenom) {
      throw new Error('Nom ou prénom de l\'utilisateur manquant');
    }

    // Configuration par défaut
    const defaultOptions: PDFGenerationOptions = {
      templateType: TemplateType.BASIC,
      isPremium: false,
      protectionLevel: 'basic', // Protection par défaut
      ...options
    };

    // Déterminer le type de template à utiliser
    const shouldUsePremium = defaultOptions.isPremium && defaultOptions.templateType === TemplateType.PREMIUM;

    logPdf('pdf_generation_start_hybrid', quote.id, { 
      numero: quote.numero,
      templateType: shouldUsePremium ? 'premium' : 'basic',
      isPremium: defaultOptions.isPremium
    });

    let filePath: string;

    if (shouldUsePremium) {
      // Utiliser Puppeteer pour les templates premium
      filePath = await generatePremiumQuotePDF(quote, defaultOptions);
    } else {
      // Utiliser PDFKit pour les templates de base
      filePath = await generateBasicQuotePDF(quote, defaultOptions);
    }

    logPdf('pdf_generation_success_hybrid', quote.id, { 
      filePath,
      templateType: shouldUsePremium ? 'premium' : 'basic',
      fileSize: fs.statSync(filePath).size,
      protectionLevel: defaultOptions.protectionLevel
    });

    // Appliquer la protection à la toute fin pour éviter les conflits pdf-lib
    if (defaultOptions.protectionLevel && defaultOptions.protectionLevel !== 'none') {
      const protectedPath = filePath.replace('.pdf', '_readonly.pdf');
      
      if (defaultOptions.protectionLevel === 'strong') {
        // Protection lecture seule avec qpdf (ouverture libre, modification impossible)
        await protectPDFWithPassword(filePath, protectedPath, ''); // Pas de mot de passe
        filePath = protectedPath;
        
        logPdf('pdf_protection_applied', quote.id, { 
          level: 'readonly', 
          filePath: protectedPath,
          canOpen: true,
          canModify: false,
          canPrint: true,
          warning: 'Document verrouillé en lecture seule'
        });
      } else if (defaultOptions.protectionLevel === 'basic') {
        // Protection basique avec métadonnées seulement
        const existingPdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await PDFLibDocument.load(existingPdfBytes);
        
        pdfDoc.setTitle('Document VelocitaLeads - Lecture seule');
        pdfDoc.setSubject(`Devis commercial ${quote.numero} - Modification interdite`);
        pdfDoc.setCreator('VelocitaLeads CRM');
        pdfDoc.setProducer('VelocitaLeads PDF ReadOnly Protection');
        
        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(protectedPath, pdfBytes);
        fs.unlinkSync(filePath); // Supprimer l'original
        filePath = protectedPath;
        
        logPdf('pdf_protection_applied', quote.id, { 
          level: 'basic', 
          filePath: protectedPath,
          warning: 'Métadonnées de protection uniquement'
        });
      }
    }

    return filePath;

  } catch (error) {
    logger.error('Erreur lors de la génération du PDF hybride:', error);
    throw error;
  }
};

// Fonction de compatibilité pour l'ancienne API (à supprimer plus tard)
export const generateQuotePDFLegacy = async (quote: QuoteData): Promise<string> => {
  // Puppeteer désactivé pour Render - utiliser le template basique
  return generateBasicQuotePDF(quote, {
    templateType: TemplateType.BASIC,
    isPremium: false,
    protectionLevel: 'basic'
  });
};

// Fonction pour récupérer le mot de passe d'un PDF (pour usage interne uniquement)
export const getPDFPassword = (quoteId: string, quoteNumber: string, timestamp: number): string => {
  return generatePDFPassword(quoteId, quoteNumber, timestamp);
};

// Fonction pour nettoyer les anciens fichiers PDF
export const cleanupOldPDFs = async (maxAgeHours: number = 24): Promise<void> => {
  try {
    const outputDir = config.pdf.outputDir;
    
    if (!fs.existsSync(outputDir)) {
      return;
    }

    const files = fs.readdirSync(outputDir);
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000; // en millisecondes

    let deletedCount = 0;

    for (const file of files) {
      if (!file.endsWith('.pdf')) continue;

      const filePath = path.join(outputDir, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    logger.info(`Nettoyage des PDFs terminé`, {
      deletedCount,
      maxAgeHours,
    });
  } catch (error) {
    logger.error('Erreur lors du nettoyage des PDFs:', error);
  }
};

// Fonction pour obtenir les informations d'un PDF
export const getPDFInfo = async (filePath: string): Promise<{
  exists: boolean;
  size?: number;
  createdAt?: Date;
  fileName?: string;
}> => {
  try {
    if (!fs.existsSync(filePath)) {
      return { exists: false };
    }

    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);

    return {
      exists: true,
      size: stats.size,
      createdAt: stats.birthtime,
      fileName,
    };
  } catch (error) {
    logger.error('Erreur lors de la récupération des infos PDF:', error);
    return { exists: false };
  }
};

// Fonction pour supprimer un fichier PDF
export const deletePDF = async (filePath: string): Promise<boolean> => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info('PDF supprimé', { filePath });
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Erreur lors de la suppression du PDF:', error);
    return false;
  }
};

export { TemplateType };

export default {
  generateQuotePDF,
  generateQuotePDFLegacy,
  cleanupOldPDFs,
  getPDFInfo,
  deletePDF,
};