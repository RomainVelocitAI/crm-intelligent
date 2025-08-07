import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';
import { config } from '@/config';
import { logger, logEmail } from '@/utils/logger';

const prisma = new PrismaClient();

// Initialiser Resend avec la clé API
const resend = new Resend(process.env.RESEND_API_KEY || '');

// En mode développement, remplacer l'email du destinataire par l'email de test
const getRecipientEmail = (email: string): string => {
  // Si on n'a pas de domaine vérifié, Resend n'autorise l'envoi qu'à notre propre adresse
  // Pour l'instant, on force le mode dev jusqu'à ce que le domaine soit vérifié
  if (process.env.NODE_ENV === 'development' || process.env.RESEND_DOMAIN_VERIFIED !== 'verified') {
    return process.env.TEST_EMAIL || 'direction@velocit-ai.fr';
  }
  return email;
};

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

// Générer les URLs de tracking
const generateTrackingUrls = (quoteId: string, email: string, filename: string) => {
  const baseUrl = config.tracking.baseUrl;
  const encodedEmail = Buffer.from(email).toString('base64');
  const pixelUrl = `${baseUrl}${config.tracking.pixelPath}/${quoteId}/${encodedEmail}?t=${Date.now()}`;
  const linkUrl = `${baseUrl}/api/tracking/pdf/${quoteId}/${encodedEmail}/${encodeURIComponent(filename)}`;
  
  return { pixelUrl, linkUrl };
};

// Fonction pour envoyer un devis par email avec Resend
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

    const pdfFilename = `Devis_${quote.numero}.pdf`;
    const trackingUrls = generateTrackingUrls(quote.id, quote.contact.email, pdfFilename);

    const defaultMessage = `Veuillez trouver ci-joint votre devis ${quote.numero}.`;
    const message = customMessage || defaultMessage;

    // Lire le fichier PDF pour l'attacher
    const fs = await import('fs/promises');
    const pdfBuffer = await fs.readFile(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

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

    // Envoyer l'email avec Resend
    const recipientEmail = getRecipientEmail(quote.contact.email);
    
    // Log si on remplace l'email en dev
    if (recipientEmail !== quote.contact.email) {
      logger.info(`📧 Mode dev: Email redirigé de ${quote.contact.email} vers ${recipientEmail}`);
    }
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [recipientEmail],
      replyTo: quote.user.email,
      subject: `Devis ${quote.numero} - ${quote.objet} ${recipientEmail !== quote.contact.email ? `(pour ${quote.contact.email})` : ''}`,
      html: htmlContent,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      throw error;
    }

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
        messageId: data?.id,
      }
    );

    logger.info('Devis envoyé par email avec succès via Resend', {
      quoteId: quote.id,
      to: quote.contact.email,
      messageId: data?.id,
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

    logger.error('Erreur lors de l\'envoi du devis par email via Resend:', error);
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

    // Générer les URLs de tracking pour relance (utiliser le système d'emails génériques)
    const pdfFilename = `Devis_${quote.numero}.pdf`;
    const trackingId = `relance_${quote.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const encodedEmail = Buffer.from(to).toString('base64');
    const baseUrl = config.tracking.baseUrl;
    const pixelUrl = `${baseUrl}/api/tracking/email/${trackingId}/${encodedEmail}?t=${Date.now()}`;

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

    const pdfBase64 = pdfBuffer.toString('base64');

    // Envoyer l'email avec Resend
    const recipientEmail = getRecipientEmail(to);
    
    if (recipientEmail !== to) {
      logger.info(`📧 Mode dev: Email redirigé de ${to} vers ${recipientEmail}`);
    }
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [recipientEmail],
      replyTo: quote.user.email,
      subject,
      html: htmlContent,
      attachments: [
        {
          filename: `Devis_${quote.numero}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      throw error;
    }

    // Créer une entrée GenericEmail pour la relance (email séparé dans l'historique)
    if (quote.contact.id && quote.user.id) {
      await prisma.genericEmail.create({
        data: {
          contactId: quote.contact.id,
          userId: quote.user.id,
          trackingId: trackingId,
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
        messageId: data?.id,
      }
    );

    logger.info('Relance de devis envoyée par email avec succès via Resend', {
      quoteId: quote.id,
      to,
      messageId: data?.id,
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

    logger.error('Erreur lors de l\'envoi de la relance par email via Resend:', error);
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

    // Envoyer l'email avec Resend
    const recipientEmail = getRecipientEmail(to);
    
    if (recipientEmail !== to) {
      logger.info(`📧 Mode dev: Email redirigé de ${to} vers ${recipientEmail}`);
    }
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [recipientEmail],
      subject: recipientEmail !== to ? `${subject} (pour ${to})` : subject,
      html: htmlContent,
    });

    if (error) {
      throw error;
    }

    // Créer l'enregistrement GenericEmail si contactId et userId sont fournis
    if (contactId && userId && trackingId) {
      await prisma.genericEmail.create({
        data: {
          contactId,
          userId,
          trackingId: trackingId,
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
        messageId: data?.id,
      }
    );

    logger.info('Email avec tracking envoyé avec succès via Resend', {
      contactId,
      to,
      messageId: data?.id,
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

    logger.error('Erreur lors de l\'envoi de l\'email avec tracking via Resend:', error);
    throw error;
  }
};

// Fonction pour tester la configuration email
export const testEmailConfiguration = async (): Promise<boolean> => {
  try {
    if (!process.env.RESEND_API_KEY) {
      logger.error('Clé API Resend manquante');
      return false;
    }
    logger.info('Configuration email Resend validée');
    return true;
  } catch (error) {
    logger.error('Erreur de configuration email Resend:', error);
    return false;
  }
};

// Fonction pour envoyer un email de test
export const sendTestEmail = async (to: string): Promise<void> => {
  try {
    const recipientEmail = getRecipientEmail(to);
    
    if (recipientEmail !== to) {
      logger.info(`📧 Mode dev: Email redirigé de ${to} vers ${recipientEmail}`);
    }
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [recipientEmail],
      subject: `Test - Configuration email VelocitaLeads${recipientEmail !== to ? ` (pour ${to})` : ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #007bff;">Test - Configuration email VelocitaLeads</h2>
          <p>Ceci est un email de test pour vérifier la configuration email de VelocitaLeads avec Resend.</p>
          <p>Si vous recevez cet email, la configuration fonctionne correctement !</p>
        </div>
      `,
    });

    if (error) {
      throw error;
    }

    logEmail(
      'test_email_sent',
      to,
      'Test - Configuration email VelocitaLeads',
      {
        messageId: data?.id,
      }
    );

    logger.info('Email de test envoyé avec succès via Resend', {
      to,
      messageId: data?.id,
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

    logger.error('Erreur lors de l\'envoi de l\'email de test via Resend:', error);
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

    const recipientEmail = getRecipientEmail(user.email);
    
    if (recipientEmail !== user.email) {
      logger.info(`📧 Mode dev: Email redirigé de ${user.email} vers ${recipientEmail}`);
    }
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [recipientEmail],
      subject: `Bienvenue sur VelocitaLeads !${recipientEmail !== user.email ? ` (pour ${user.email})` : ''}`,
      html: htmlContent,
    });

    if (error) {
      throw error;
    }

    logEmail(
      'welcome_email_sent',
      user.email,
      'Bienvenue sur VelocitaLeads !',
      {
        messageId: data?.id,
      }
    );

    logger.info('Email de bienvenue envoyé avec succès via Resend', {
      to: user.email,
      messageId: data?.id,
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

    logger.error('Erreur lors de l\'envoi de l\'email de bienvenue via Resend:', error);
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