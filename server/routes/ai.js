const express = require('express');
const router = express.Router();
const firebaseService = require('../services/firebase');
const aiService = require('../services/ai');
const { authenticateToken } = require('../middleware/auth');

// Récupérer la conversation d'un lead
router.get('/conversation/:leadId', authenticateToken, async (req, res) => {
  try {
    const { leadId } = req.params;
    
    // Vérifier que le lead appartient à l'utilisateur
    const lead = await firebaseService.getLead(leadId);
    if (!lead || lead.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const conversation = await firebaseService.getConversation(leadId);
    res.json({ success: true, conversation });
  } catch (error) {
    console.error('Erreur récupération conversation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Envoyer un message à l'IA
router.post('/chat/:leadId', authenticateToken, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message vide' });
    }

    // Vérifier que le lead appartient à l'utilisateur
    const lead = await firebaseService.getLead(leadId);
    if (!lead || lead.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Récupérer la conversation existante
    const conversation = await firebaseService.getConversation(leadId);

    // Ajouter le message de l'utilisateur
    await firebaseService.addMessage(leadId, {
      role: 'user',
      content: message.trim()
    });

    // Générer la réponse de l'IA
    const aiResponse = await aiService.generateResponse(message, conversation);
    
    let responseText = aiResponse;
    let qualificationUpdate = {};
    let isComplete = false;

    // Si la réponse contient des données structurées
    if (typeof aiResponse === 'object') {
      responseText = aiResponse.response;
      qualificationUpdate = aiResponse.qualification || {};
      isComplete = aiResponse.isComplete || false;
    }

    // Ajouter la réponse de l'IA
    await firebaseService.addMessage(leadId, {
      role: 'assistant',
      content: responseText
    });

    // Mettre à jour la qualification si nécessaire
    if (Object.keys(qualificationUpdate).length > 0) {
      await firebaseService.updateQualification(leadId, qualificationUpdate);
    }

    // Si la qualification est complète, déclencher la génération de devis
    if (isComplete) {
      // Mettre à jour le statut du lead
      await firebaseService.updateLead(leadId, { status: 'qualifie' });
      
      // Déclencher la génération de devis (sera fait dans la route quotes)
      return res.json({
        success: true,
        message: responseText,
        qualificationComplete: true,
        nextStep: 'generate_quote'
      });
    }

    res.json({
      success: true,
      message: responseText,
      qualificationComplete: false
    });

  } catch (error) {
    console.error('Erreur chat IA:', error);
    res.status(500).json({ error: 'Erreur lors du traitement du message' });
  }
});

// Initialiser une conversation (premier message de l'IA)
router.post('/init/:leadId', authenticateToken, async (req, res) => {
  try {
    const { leadId } = req.params;

    // Vérifier que le lead appartient à l'utilisateur
    const lead = await firebaseService.getLead(leadId);
    if (!lead || lead.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Vérifier si une conversation existe déjà
    const existingConversation = await firebaseService.getConversation(leadId);
    if (existingConversation.messages.length > 0) {
      return res.json({
        success: true,
        message: 'Conversation déjà initialisée',
        conversation: existingConversation
      });
    }

    // Générer le message d'accueil
    const welcomeResponse = await aiService.generateResponse('', { messages: [] });
    
    // Ajouter le message d'accueil
    await firebaseService.addMessage(leadId, {
      role: 'assistant',
      content: welcomeResponse
    });

    res.json({
      success: true,
      message: welcomeResponse,
      conversationStarted: true
    });

  } catch (error) {
    console.error('Erreur initialisation conversation:', error);
    res.status(500).json({ error: 'Erreur lors de l\'initialisation' });
  }
});

// Réinitialiser une conversation
router.delete('/conversation/:leadId', authenticateToken, async (req, res) => {
  try {
    const { leadId } = req.params;

    // Vérifier que le lead appartient à l'utilisateur
    const lead = await firebaseService.getLead(leadId);
    if (!lead || lead.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Réinitialiser la conversation
    await firebaseService.conversations.set(leadId, {
      id: leadId,
      messages: [],
      qualification: {},
      isComplete: false
    });

    // Remettre le lead en statut "nouveau"
    await firebaseService.updateLead(leadId, { status: 'nouveau' });

    res.json({
      success: true,
      message: 'Conversation réinitialisée'
    });

  } catch (error) {
    console.error('Erreur réinitialisation conversation:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
});

// Obtenir le statut de qualification d'un lead
router.get('/qualification/:leadId', authenticateToken, async (req, res) => {
  try {
    const { leadId } = req.params;

    // Vérifier que le lead appartient à l'utilisateur
    const lead = await firebaseService.getLead(leadId);
    if (!lead || lead.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const conversation = await firebaseService.getConversation(leadId);
    
    res.json({
      success: true,
      qualification: conversation.qualification,
      isComplete: conversation.isComplete,
      progress: {
        secteur: !!conversation.qualification.secteur,
        budget: !!conversation.qualification.budget,
        besoins: !!conversation.qualification.besoins,
        urgence: !!conversation.qualification.urgence
      }
    });

  } catch (error) {
    console.error('Erreur récupération qualification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;