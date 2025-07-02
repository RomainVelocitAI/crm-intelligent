const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Service email simulé pour la démo
class EmailService {
  constructor() {
    this.sentEmails = new Map();
  }

  async sendQuoteEmail(to, subject, content, attachmentPath) {
    // Simulation d'envoi d'email
    await new Promise(resolve => setTimeout(resolve, 1000));

    const emailId = `email-${Date.now()}`;
    const email = {
      id: emailId,
      to,
      subject,
      content,
      attachmentPath,
      sentAt: new Date().toISOString(),
      status: 'sent',
      opens: 0,
      clicks: 0
    };

    this.sentEmails.set(emailId, email);
    return email;
  }

  async trackOpen(emailId) {
    const email = this.sentEmails.get(emailId);
    if (email) {
      email.opens += 1;
      email.lastOpenAt = new Date().toISOString();
      this.sentEmails.set(emailId, email);
    }
    return email;
  }

  async trackClick(emailId) {
    const email = this.sentEmails.get(emailId);
    if (email) {
      email.clicks += 1;
      email.lastClickAt = new Date().toISOString();
      this.sentEmails.set(emailId, email);
    }
    return email;
  }

  getEmailStats(emailId) {
    return this.sentEmails.get(emailId);
  }
}

const emailService = new EmailService();

// Envoyer un email de test
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { to, subject, content } = req.body;

    if (!to || !subject || !content) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const result = await emailService.sendQuoteEmail(to, subject, content);

    res.json({
      success: true,
      emailId: result.id,
      message: 'Email de test envoyé (simulé)',
      result
    });
  } catch (error) {
    console.error('Erreur envoi email test:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi' });
  }
});

// Templates d'emails prédéfinis
router.get('/templates', authenticateToken, (req, res) => {
  const templates = {
    quote_standard: {
      subject: 'Votre devis personnalisé - {{company}}',
      content: `Bonjour {{name}},

Suite à notre échange, veuillez trouver ci-joint votre devis personnalisé.

Ce devis est valable 30 jours et comprend :
- Solution CRM adaptée à vos besoins
- Formation de votre équipe
- Support technique inclus

N'hésitez pas à me contacter pour toute question.

Cordialement,
L'équipe CRM Intelligent`
    },
    quote_premium: {
      subject: 'Votre solution premium - {{company}}',
      content: `Bonjour {{name}},

J'ai le plaisir de vous présenter votre solution CRM premium.

Cette offre exclusive comprend :
- Toutes les fonctionnalités avancées
- Intégrations sur-mesure
- Support prioritaire 24/7
- Formation approfondie

Je reste à votre disposition pour finaliser ce projet.

Bien à vous,
L'équipe CRM Intelligent`
    },
    follow_up: {
      subject: 'Relance - Votre devis {{company}}',
      content: `Bonjour {{name}},

J'espère que vous allez bien.

Je me permets de revenir vers vous concernant le devis que je vous ai envoyé le {{date}}.

Avez-vous eu l'occasion de l'examiner ? Souhaitez-vous que nous en discutions ?

Je reste disponible pour répondre à vos questions.

Cordialement,
L'équipe CRM Intelligent`
    }
  };

  res.json({ success: true, templates });
});

// Personnaliser un template
router.post('/templates/personalize', authenticateToken, (req, res) => {
  try {
    const { template, variables } = req.body;

    if (!template || !variables) {
      return res.status(400).json({ error: 'Template et variables requis' });
    }

    let personalizedSubject = template.subject;
    let personalizedContent = template.content;

    // Remplacer les variables
    Object.keys(variables).forEach(key => {
      const placeholder = `{{${key}}}`;
      personalizedSubject = personalizedSubject.replace(new RegExp(placeholder, 'g'), variables[key]);
      personalizedContent = personalizedContent.replace(new RegExp(placeholder, 'g'), variables[key]);
    });

    res.json({
      success: true,
      personalizedEmail: {
        subject: personalizedSubject,
        content: personalizedContent
      }
    });
  } catch (error) {
    console.error('Erreur personnalisation template:', error);
    res.status(500).json({ error: 'Erreur lors de la personnalisation' });
  }
});

// Tracking d'ouverture d'email (pixel invisible)
router.get('/track/open/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    
    await emailService.trackOpen(emailId);
    
    // Retourner un pixel transparent 1x1
    const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(pixel);
  } catch (error) {
    console.error('Erreur tracking ouverture:', error);
    res.status(500).end();
  }
});

// Tracking de clic
router.get('/track/click/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    const { url } = req.query;
    
    await emailService.trackClick(emailId);
    
    // Rediriger vers l'URL originale
    res.redirect(url || '/');
  } catch (error) {
    console.error('Erreur tracking clic:', error);
    res.redirect('/');
  }
});

// Statistiques d'un email
router.get('/stats/:emailId', authenticateToken, (req, res) => {
  try {
    const { emailId } = req.params;
    const stats = emailService.getEmailStats(emailId);
    
    if (!stats) {
      return res.status(404).json({ error: 'Email non trouvé' });
    }

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Erreur stats email:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Configuration SMTP (pour plus tard)
router.get('/config', authenticateToken, (req, res) => {
  res.json({
    success: true,
    config: {
      smtp: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        user: process.env.EMAIL_USER || 'demo@crm-intelligent.com'
      },
      features: {
        tracking: true,
        templates: true,
        scheduling: false // Future feature
      }
    }
  });
});

module.exports = router;