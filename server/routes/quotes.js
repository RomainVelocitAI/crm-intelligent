const express = require('express');
const router = express.Router();
const firebaseService = require('../services/firebase');
const pdfService = require('../services/pdf');
const aiService = require('../services/ai');
const { authenticateToken } = require('../middleware/auth');
const path = require('path');

// Récupérer tous les devis d'un lead
router.get('/lead/:leadId', authenticateToken, async (req, res) => {
  try {
    const { leadId } = req.params;

    // Vérifier que le lead appartient à l'utilisateur
    const lead = await firebaseService.getLead(leadId);
    if (!lead || lead.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const quotes = await firebaseService.getQuotes(leadId);
    res.json({ success: true, quotes });
  } catch (error) {
    console.error('Erreur récupération devis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Générer un nouveau devis
router.post('/generate/:leadId', authenticateToken, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { template = 'standard' } = req.body;

    // Vérifier que le lead appartient à l'utilisateur
    const lead = await firebaseService.getLead(leadId);
    if (!lead || lead.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Récupérer la qualification
    const conversation = await firebaseService.getConversation(leadId);
    if (!conversation.isComplete) {
      return res.status(400).json({ 
        error: 'Qualification incomplète',
        message: 'La qualification du lead doit être terminée avant de générer un devis'
      });
    }

    // Générer les données du devis avec l'IA
    const quoteData = aiService.generateQuoteData(conversation.qualification, lead);

    // Créer l'enregistrement du devis
    const quote = await firebaseService.createQuote({
      leadId,
      userId: req.user.id,
      template,
      data: quoteData,
      status: 'brouillon'
    });

    // Générer le PDF
    const pdfResult = await pdfService.generateQuote(quote, lead);

    // Mettre à jour le devis avec l'URL du PDF
    const updatedQuote = await firebaseService.updateQuote(quote.id, {
      pdfUrl: pdfResult.url,
      status: 'genere'
    });

    // Mettre à jour le statut du lead
    await firebaseService.updateLead(leadId, { status: 'devis_genere' });

    res.json({
      success: true,
      quote: updatedQuote,
      pdfUrl: pdfResult.url,
      message: 'Devis généré avec succès'
    });

  } catch (error) {
    console.error('Erreur génération devis:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du devis' });
  }
});

// Envoyer un devis par email
router.post('/send/:quoteId', authenticateToken, async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { customMessage = '' } = req.body;

    // Récupérer le devis
    const quote = await firebaseService.quotes.get(quoteId);
    if (!quote) {
      return res.status(404).json({ error: 'Devis non trouvé' });
    }

    // Vérifier que le devis appartient à l'utilisateur
    if (quote.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Récupérer le lead
    const lead = await firebaseService.getLead(quote.leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead non trouvé' });
    }

    // Simuler l'envoi d'email (pour la démo)
    const emailResult = await simulateEmailSend(quote, lead, customMessage);

    // Mettre à jour le statut du devis
    const updatedQuote = await firebaseService.updateQuote(quoteId, {
      status: 'envoye',
      sentAt: new Date().toISOString()
    });

    // Mettre à jour le statut du lead
    await firebaseService.updateLead(quote.leadId, { status: 'devis_envoye' });

    res.json({
      success: true,
      quote: updatedQuote,
      emailResult,
      message: 'Devis envoyé avec succès'
    });

  } catch (error) {
    console.error('Erreur envoi devis:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du devis' });
  }
});

// Simuler l'envoi d'email pour la démo
async function simulateEmailSend(quote, lead, customMessage) {
  // Simulation d'un délai d'envoi
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    success: true,
    to: lead.contact.email,
    subject: `Votre devis personnalisé - ${lead.contact.company}`,
    sentAt: new Date().toISOString(),
    messageId: `demo-${Date.now()}@crm-intelligent.com`
  };
}

// Télécharger un PDF de devis
router.get('/pdf/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(__dirname, '../uploads/quotes', filename);
    
    // Vérifier que le fichier existe
    if (!require('fs').existsSync(filepath)) {
      return res.status(404).json({ error: 'Fichier PDF non trouvé' });
    }

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Erreur téléchargement PDF:', err);
        res.status(500).json({ error: 'Erreur lors du téléchargement' });
      }
    });
  } catch (error) {
    console.error('Erreur téléchargement PDF:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Marquer un devis comme lu (simulation tracking)
router.post('/track/:quoteId/read', async (req, res) => {
  try {
    const { quoteId } = req.params;

    const updatedQuote = await firebaseService.updateQuote(quoteId, {
      status: 'lu',
      readAt: new Date().toISOString()
    });

    if (updatedQuote) {
      res.json({ success: true, message: 'Devis marqué comme lu' });
    } else {
      res.status(404).json({ error: 'Devis non trouvé' });
    }
  } catch (error) {
    console.error('Erreur tracking lecture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Dupliquer un devis
router.post('/duplicate/:quoteId', authenticateToken, async (req, res) => {
  try {
    const { quoteId } = req.params;

    // Récupérer le devis original
    const originalQuote = await firebaseService.quotes.get(quoteId);
    if (!originalQuote || originalQuote.userId !== req.user.id) {
      return res.status(404).json({ error: 'Devis non trouvé' });
    }

    // Créer une copie
    const duplicatedQuote = await firebaseService.createQuote({
      ...originalQuote,
      status: 'brouillon',
      pdfUrl: null,
      sentAt: null,
      readAt: null,
      signedAt: null
    });

    res.json({
      success: true,
      quote: duplicatedQuote,
      message: 'Devis dupliqué avec succès'
    });

  } catch (error) {
    console.error('Erreur duplication devis:', error);
    res.status(500).json({ error: 'Erreur lors de la duplication' });
  }
});

// Statistiques des devis
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    // Récupérer tous les leads de l'utilisateur pour calculer les stats
    const leads = await firebaseService.getLeads(req.user.id);
    let totalQuotes = 0;
    let totalValue = 0;

    for (const lead of leads) {
      const quotes = await firebaseService.getQuotes(lead.id);
      totalQuotes += quotes.length;
      totalValue += quotes.reduce((sum, quote) => sum + (quote.data.total || 0), 0);
    }

    const stats = {
      totalQuotes,
      totalValue,
      averageValue: totalQuotes > 0 ? Math.round(totalValue / totalQuotes) : 0,
      leadsWithQuotes: leads.filter(l => l.status === 'devis_envoye' || l.status === 'signe').length
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Erreur stats devis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;