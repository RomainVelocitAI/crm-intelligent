import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { config } from '@/config';
import { logger, logEmail } from '@/utils/logger';

const prisma = new PrismaClient();

// Types
interface QuoteData {
  id: string;
  numero: string;
  objet: string;
  total: number;
  dateValidite: Date;
  contact: {
    id?: string;
    prenom: string;
    nom: string;
    email: string;
  };
  user: {
    id?: string;
    prenom: string;
    nom: string;
    email: string;
    entreprise?: string;
    telephone?: string;
  };
}

// Créer le transporteur SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.email.smtp.host,
    port: config.email.smtp.port,
    secure: config.email.smtp.secure,
    auth: {
      user: config.email.smtp.user,
      pass: config.email.smtp.pass,
    },
  });
};

// Générer les URLs de tracking
const generateTrackingUrls = (quoteId: string, email: string, filename: string) => {
  const baseUrl = config.tracking.baseUrl;
  const encodedEmail = Buffer.from(email).toString('base64');
  const pixelUrl = `${baseUrl}${config.tracking.pixelPath}/${quoteId}/${encodedEmail}?t=${Date.now()}`;
  const linkUrl = `${baseUrl}/api/tracking/pdf/${quoteId}/${encodedEmail}/${encodeURIComponent(filename)}`;
  
  return { pixelUrl, linkUrl };
};

// Fonction pour envoyer un devis par email
export const sendQuoteEmail = async (
  quote: QuoteData,
  pdfPath: string,
  customMessage?: string
): Promise<void> => {
  try {
    // Vérifications de sécurité
    if (!quote?.contact?.email) {
      throw new Error('Email du contact manquant');
    }
    if (!quote?.contact?.prenom || !quote?.contact?.nom) {
      throw new Error('Nom ou prénom du contact manquant');
    }

    const transporter = createTransporter();
    const pdfFilename = `Devis_${quote.numero}.pdf`;
    const trackingUrls = generateTrackingUrls(quote.id, quote.contact.email, pdfFilename);

    const defaultMessage = `Veuillez trouver ci-joint votre devis ${quote.numero}.`;
    const message = customMessage || defaultMessage;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Devis ${quote.numero}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="font-size: 24px; font-weight: bold; color: #007bff; margin-bottom: 10px;">VelocitaLeads</div>
            <h1>Votre devis ${quote.numero}</h1>
          </div>

          <p>Bonjour ${quote.contact.prenom} ${quote.contact.nom},</p>

          <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; margin: 20px 0; white-space: pre-line;">${message}</div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #007bff;">Détails du devis</h3>
            <p><strong>Numéro :</strong> ${quote.numero}</p>
            <p><strong>Objet :</strong> ${quote.objet}</p>
            <p><strong>Montant total :</strong> <span style="font-size: 18px; font-weight: bold; color: #28a745;">${quote.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span></p>
            <p><strong>Valable jusqu'au :</strong> ${quote.dateValidite.toLocaleDateString('fr-FR')}</p>
          </div>

          <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: center;">
            <p><strong>Le devis complet est joint à cet email au format PDF.</strong></p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d;">
            <h4>Informations de contact :</h4>
            <p>
              <strong>${quote.user.prenom} ${quote.user.nom}</strong><br>
              ${quote.user.entreprise ? `${quote.user.entreprise}<br>` : ''}
              Email : <a href="mailto:${quote.user.email}">${quote.user.email}</a><br>
              ${quote.user.telephone ? `Téléphone : ${quote.user.telephone}<br>` : ''}
            </p>
          </div>
        </div>
        
        <!-- Pixel de tracking -->
        <img src="${trackingUrls.pixelUrl}" width="1" height="1" style="display:none;" alt="">
      </body>
      </html>
    `;

    const textContent = `
Bonjour ${quote.contact.prenom} ${quote.contact.nom},

${message}

DÉTAILS DU DEVIS
================
Numéro : ${quote.numero}
Objet : ${quote.objet}
Montant total : ${quote.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
Valable jusqu'au : ${quote.dateValidite.toLocaleDateString('fr-FR')}

Le devis complet est joint à cet email au format PDF.

INFORMATIONS DE CONTACT
========================
${quote.user.prenom} ${quote.user.nom}
${quote.user.entreprise ? `${quote.user.entreprise}\n` : ''}Email : ${quote.user.email}
${quote.user.telephone ? `Téléphone : ${quote.user.telephone}\n` : ''}

Cordialement,
L'équipe ${quote.user.entreprise || 'VelocitaLeads'}
    `.trim();

    const mailOptions = {
      from: {
        name: `${quote.user.prenom} ${quote.user.nom} - ${config.email.from.name}`,
        address: config.email.from.address,
      },
      to: quote.contact.email,
      replyTo: quote.user.email,
      subject: `Devis ${quote.numero} - ${quote.objet}`,
      text: textContent,
      html: htmlContent,
      attachments: [
        {
          filename: pdfFilename,
          path: pdfPath,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);

    // Créer l'enregistrement de tracking email
    await prisma.emailTracking.create({
      data: {
        quoteId: quote.id,
        email: quote.contact.email,
        ouvert: false,
        clique: false,
        nombreOuvertures: 0,
        nombreCliques: 0,
        scoreConfiance: 0,
        estBot: false,
        estPrechargement: false,
      },
    });

    logEmail(
      'quote_sent',
      quote.contact.email,
      `Devis ${quote.numero} - ${quote.objet}`,
      {
        quoteId: quote.id,
        messageId: info.messageId,
        response: info.response,
      }
    );

    logger.info('Devis envoyé par email avec succès', {
      quoteId: quote.id,
      to: quote.contact.email,
      messageId: info.messageId,
    });
  } catch (error) {
    logEmail(
      'quote_error',
      quote.contact.email,
      `Devis ${quote.numero} - ${quote.objet}`,
      { 
        quoteId: quote.id,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    );

    logger.error('Erreur lors de l\'envoi du devis par email:', error);
    throw error;
  }
};

// Fonction pour envoyer une relance de devis par email
export const sendQuoteRelanceEmail = async (
  to: string,
  subject: string,
  content: string,
  quote: QuoteData,
  pdfBuffer: Buffer
): Promise<void> => {
  try {
    // Vérifications de sécurité
    if (!quote?.contact?.email) {
      throw new Error('Email du contact manquant');
    }
    if (!quote?.contact?.prenom || !quote?.contact?.nom) {
      throw new Error('Nom ou prénom du contact manquant');
    }

    const transporter = createTransporter();

    // Générer les URLs de tracking pour relance (utiliser le système d'emails génériques)
    const pdfFilename = `Devis_${quote.numero}.pdf`;
    const trackingId = `relance_${quote.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const encodedEmail = Buffer.from(to).toString('base64');
    const baseUrl = config.tracking.baseUrl;
    const pixelUrl = `${baseUrl}/api/tracking/email/${trackingId}/${encodedEmail}?t=${Date.now()}`;
    const linkUrl = `${baseUrl}/api/tracking/pdf/${quote.id}/${encodedEmail}/${encodeURIComponent(pdfFilename)}`;

    // Template HTML pour relance
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="font-size: 24px; font-weight: bold; color: #007bff; margin-bottom: 10px;">VelocitaLeads</div>
            <div style="background: #ffc107; color: #212529; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; display: inline-block; margin-bottom: 20px;">RELANCE</div>
            <h1>Rappel concernant votre devis</h1>
          </div>

          <p>Bonjour ${quote.contact.prenom} ${quote.contact.nom},</p>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; white-space: pre-line;">${content}</div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #007bff;">Rappel - Détails du devis</h3>
            <p><strong>Numéro :</strong> ${quote.numero}</p>
            <p><strong>Objet :</strong> ${quote.objet}</p>
            <p><strong>Montant total :</strong> <span style="font-size: 18px; font-weight: bold; color: #28a745;">${quote.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span></p>
            <p><strong>Valable jusqu'au :</strong> ${quote.dateValidite.toLocaleDateString('fr-FR')}</p>
          </div>

          <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: center;">
            <p><strong>Le devis complet est joint à cet email au format PDF.</strong></p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d;">
            <h4>Informations de contact :</h4>
            <p>
              <strong>${quote.user.prenom} ${quote.user.nom}</strong><br>
              ${quote.user.entreprise ? `${quote.user.entreprise}<br>` : ''}
              Email : <a href="mailto:${quote.user.email}">${quote.user.email}</a><br>
              ${quote.user.telephone ? `Téléphone : ${quote.user.telephone}<br>` : ''}
            </p>
          </div>
        </div>
        
        <!-- Pixel de tracking -->
        <img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="">
      </body>
      </html>
    `;

    const textContent = `
Bonjour ${quote.contact.prenom} ${quote.contact.nom},

RELANCE - ${subject}

${content}

RAPPEL - DÉTAILS DU DEVIS
=========================
Numéro : ${quote.numero}
Objet : ${quote.objet}
Montant total : ${quote.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
Valable jusqu'au : ${quote.dateValidite.toLocaleDateString('fr-FR')}

Le devis complet est joint à cet email au format PDF.

INFORMATIONS DE CONTACT
========================
${quote.user.prenom} ${quote.user.nom}
${quote.user.entreprise ? `${quote.user.entreprise}\n` : ''}Email : ${quote.user.email}
${quote.user.telephone ? `Téléphone : ${quote.user.telephone}\n` : ''}

Merci de votre attention,
L'équipe ${quote.user.entreprise || 'VelocitaLeads'}
    `.trim();

    const mailOptions = {
      from: {
        name: `${quote.user.prenom} ${quote.user.nom} - ${config.email.from.name}`,
        address: config.email.from.address,
      },
      to,
      replyTo: quote.user.email,
      subject,
      text: textContent,
      html: htmlContent,
      attachments: [
        {
          filename: `Devis_${quote.numero}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);

    // Créer une entrée GenericEmail pour la relance (email séparé dans l'historique)
    if (quote.contact.id && quote.user.id) {
      await prisma.genericEmail.create({
        data: {
          contactId: quote.contact.id,
          userId: quote.user.id,
          trackingId: trackingId, // Utiliser le même trackingId que pour le pixel
          subject,
          content,
          sentAt: new Date(),
          isOpened: false,
          openCount: 0,
        },
      });
    }

    // Garder aussi le tracking EmailTracking existant pour le devis original
    await prisma.emailTracking.upsert({
      where: {
        quoteId_email: {
          quoteId: quote.id,
          email: to,
        },
      },
      update: {
        // Mettre à jour la dernière activité
        derniereActivite: new Date(),
      },
      create: {
        quoteId: quote.id,
        email: to,
        ouvert: false,
        clique: false,
        nombreOuvertures: 0,
        nombreCliques: 0,
        scoreConfiance: 0,
        estBot: false,
        estPrechargement: false,
      },
    });

    logEmail(
      'quote_relance_sent',
      to,
      subject,
      {
        quoteId: quote.id,
        messageId: info.messageId,
        response: info.response,
      }
    );

    logger.info('Relance de devis envoyée par email avec succès', {
      quoteId: quote.id,
      to,
      messageId: info.messageId,
    });
  } catch (error) {
    logEmail(
      'quote_relance_error',
      to,
      subject,
      { 
        quoteId: quote.id,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    );

    logger.error('Erreur lors de l\'envoi de la relance par email:', error);
    throw error;
  }
};

// Fonction pour envoyer un email avec tracking
export const sendTrackedEmail = async (
  to: string,
  subject: string,
  content: string,
  contactId?: string,
  userId?: string
): Promise<void> => {
  try {
    const transporter = createTransporter();

    // Générer les URLs de tracking pour emails génériques
    let pixelUrl = null;
    let trackingId = null;
    
    if (contactId && userId) {
      trackingId = `generic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const encodedEmail = Buffer.from(to).toString('base64');
      const baseUrl = config.tracking.baseUrl;
      pixelUrl = `${baseUrl}/api/tracking/email/${trackingId}/${encodedEmail}?t=${Date.now()}`;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="font-size: 24px; font-weight: bold; color: #007bff;">VelocitaLeads</div>
            <h1>${subject}</h1>
          </div>

          <div style="white-space: pre-line;">${content}</div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; text-align: center;">
            <p>Cet email a été envoyé via VelocitaLeads</p>
          </div>
        </div>
        
        ${pixelUrl ? `<!-- Pixel de tracking --><img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="">` : ''}
      </body>
      </html>
    `;

    const mailOptions = {
      from: {
        name: config.email.from.name,
        address: config.email.from.address,
      },
      to,
      subject,
      text: content,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    // Créer l'enregistrement GenericEmail si contactId et userId sont fournis
    if (contactId && userId && trackingId) {
      await prisma.genericEmail.create({
        data: {
          contactId,
          userId,
          trackingId: trackingId, // Utiliser le même trackingId que pour le pixel
          subject,
          content,
          sentAt: new Date(),
          isOpened: false,
          openCount: 0,
        },
      });
    }

    logEmail(
      'tracked_email_sent',
      to,
      subject,
      {
        contactId,
        messageId: info.messageId,
        response: info.response,
      }
    );

    logger.info('Email avec tracking envoyé avec succès', {
      contactId,
      to,
      messageId: info.messageId,
    });
  } catch (error) {
    logEmail(
      'tracked_email_error',
      to,
      subject,
      { 
        contactId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    );

    logger.error('Erreur lors de l\'envoi de l\'email avec tracking:', error);
    throw error;
  }
};

// Fonction pour tester la configuration email
export const testEmailConfiguration = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info('Configuration email validée avec succès');
    return true;
  } catch (error) {
    logger.error('Erreur de configuration email:', error);
    return false;
  }
};

// Fonction pour envoyer un email de test
export const sendTestEmail = async (to: string): Promise<void> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: config.email.from.name,
        address: config.email.from.address,
      },
      to,
      subject: 'Test - Configuration email VelocitaLeads',
      text: 'Ceci est un email de test pour vérifier la configuration email de VelocitaLeads.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #007bff;">Test - Configuration email VelocitaLeads</h2>
          <p>Ceci est un email de test pour vérifier la configuration email de VelocitaLeads.</p>
          <p>Si vous recevez cet email, la configuration fonctionne correctement !</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    logEmail(
      'test_email_sent',
      to,
      'Test - Configuration email VelocitaLeads',
      {
        messageId: info.messageId,
        response: info.response,
      }
    );

    logger.info('Email de test envoyé avec succès', {
      to,
      messageId: info.messageId,
    });
  } catch (error) {
    logEmail(
      'test_email_error',
      to,
      'Test - Configuration email VelocitaLeads',
      { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    );

    logger.error('Erreur lors de l\'envoi de l\'email de test:', error);
    throw error;
  }
};

// Fonction pour envoyer un email de bienvenue à un nouvel utilisateur
export const sendWelcomeEmail = async (user: {
  email: string;
  prenom: string;
  nom: string;
  entreprise?: string;
}): Promise<void> => {
  try {
    const transporter = createTransporter();

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue sur VelocitaLeads</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="font-size: 24px; font-weight: bold; color: #007bff; margin-bottom: 10px;">VelocitaLeads</div>
            <h1>Bienvenue sur VelocitaLeads !</h1>
          </div>

          <p>Bonjour ${user.prenom} ${user.nom},</p>

          <p>Nous sommes ravis de vous accueillir sur VelocitaLeads, votre nouvel outil de gestion de devis et de contacts.</p>

          <div style="background: #f0f7ff; border: 1px solid #cce5ff; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #007bff;">Voici ce que vous pouvez faire dès maintenant :</h3>
            <ul style="padding-left: 20px;">
              <li>Créer des contacts et gérer votre base clients</li>
              <li>Générer des devis professionnels en quelques clics</li>
              <li>Suivre l'ouverture de vos devis grâce au tracking intégré</li>
              <li>Relancer automatiquement vos prospects</li>
            </ul>
          </div>

          <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: center;">
            <p><strong>Connectez-vous dès maintenant pour commencer à utiliser VelocitaLeads :</strong></p>
            <a href="${config.app.baseUrl}/login" style="display: inline-block; background: #007bff; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold;">Accéder à mon compte</a>
          </div>

          <p>Si vous avez des questions ou besoin d'aide pour démarrer, n'hésitez pas à nous contacter en répondant simplement à cet email.</p>

          <p>À très bientôt sur VelocitaLeads !</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; text-align: center;">
            <p>L'équipe VelocitaLeads</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Bonjour ${user.prenom} ${user.nom},

Nous sommes ravis de vous accueillir sur VelocitaLeads, votre nouvel outil de gestion de devis et de contacts.

VOICI CE QUE VOUS POUVEZ FAIRE DÈS MAINTENANT :
- Créer des contacts et gérer votre base clients
- Générer des devis professionnels en quelques clics
- Suivre l'ouverture de vos devis grâce au tracking intégré
- Relancer automatiquement vos prospects

Connectez-vous dès maintenant pour commencer à utiliser VelocitaLeads :
${config.app.baseUrl}/login

Si vous avez des questions ou besoin d'aide pour démarrer, n'hésitez pas à nous contacter en répondant simplement à cet email.

À très bientôt sur VelocitaLeads !

L'équipe VelocitaLeads
    `.trim();

    const mailOptions = {
      from: {
        name: config.email.from.name,
        address: config.email.from.address,
      },
      to: user.email,
      subject: 'Bienvenue sur VelocitaLeads !',
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    logEmail(
      'welcome_email_sent',
      user.email,
      'Bienvenue sur VelocitaLeads !',
      {
        messageId: info.messageId,
        response: info.response,
      }
    );

    logger.info('Email de bienvenue envoyé avec succès', {
      to: user.email,
      messageId: info.messageId,
    });
  } catch (error) {
    logEmail(
      'welcome_email_error',
      user.email,
      'Bienvenue sur VelocitaLeads !',
      { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    );

    logger.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
    // Ne pas propager l'erreur pour ne pas bloquer l'inscription
  }
};

export default {
  sendQuoteEmail,
  sendQuoteRelanceEmail,
  testEmailConfiguration,
  sendTestEmail,
  sendTrackedEmail,
  sendWelcomeEmail,
};