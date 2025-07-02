// Service IA pour la démo - Simulation des réponses OpenAI
class AIService {
  constructor() {
    this.responses = {
      greeting: [
        "Bonjour ! Je suis votre assistant IA pour qualifier votre projet. Pouvez-vous me parler de votre entreprise et de vos besoins ?",
        "Salut ! Je vais vous aider à définir précisément votre projet. Dans quel secteur d'activité évoluez-vous ?",
        "Bonjour ! Pour vous proposer le devis le plus adapté, j'aimerais en savoir plus sur votre activité. Pouvez-vous me la décrire ?"
      ],
      
      secteur_questions: {
        tech: [
          "Parfait ! Dans la tech, quels sont vos principaux défis : gestion client, automatisation des ventes, ou suivi des projets ?",
          "Intéressant ! Combien de collaborateurs utilisent actuellement vos outils de gestion client ?",
          "Pour une entreprise tech, quel budget envisagez-vous pour optimiser votre processus commercial ?"
        ],
        btp: [
          "Le BTP a des besoins spécifiques ! Cherchez-vous à automatiser vos devis, gérer vos chantiers, ou suivre vos clients ?",
          "Dans le BTP, la rapidité de réponse est cruciale. Combien de devis envoyez-vous par mois actuellement ?",
          "Quel est votre budget pour digitaliser votre processus de devis et suivi client ?"
        ],
        conseil: [
          "Le conseil nécessite un suivi client personnalisé ! Voulez-vous automatiser vos propositions commerciales ?",
          "En tant que consultant, combien de prospects gérez-vous simultanément ?",
          "Quel budget allouez-vous à l'optimisation de votre processus commercial ?"
        ],
        default: [
          "Pouvez-vous me préciser votre secteur d'activité pour que je vous pose les bonnes questions ?",
          "Quel est votre domaine d'expertise principal ?",
          "Dans quel secteur votre entreprise évolue-t-elle ?"
        ]
      },

      budget_questions: [
        "Quel budget envisagez-vous pour cette solution ? (moins de 5k€, 5-15k€, 15-30k€, plus de 30k€)",
        "Pour vous aider à dimensionner l'offre, pouvez-vous me donner une fourchette budgétaire ?",
        "Avez-vous défini un budget pour ce projet d'automatisation ?"
      ],

      urgence_questions: [
        "Quelle est votre urgence ? Souhaitez-vous démarrer immédiatement, dans le mois, ou c'est pour plus tard ?",
        "À quel horizon souhaitez-vous mettre en place cette solution ?",
        "Avez-vous une deadline particulière pour ce projet ?"
      ],

      qualification_complete: [
        "Parfait ! J'ai toutes les informations nécessaires. Je vais maintenant générer votre devis personnalisé.",
        "Excellent ! Avec ces éléments, je peux vous proposer une solution sur-mesure. Génération du devis en cours...",
        "Merci pour ces précisions ! Je prépare votre devis adapté à vos besoins spécifiques."
      ]
    };
  }

  async generateResponse(message, conversation) {
    // Simulation d'un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const messages = conversation.messages || [];
    const qualification = conversation.qualification || {};

    // Première interaction
    if (messages.length === 0) {
      return this.getRandomResponse(this.responses.greeting);
    }

    const lastMessage = message.toLowerCase();

    // Détection du secteur
    if (!qualification.secteur) {
      const secteur = this.detectSecteur(lastMessage);
      if (secteur) {
        return {
          response: this.getRandomResponse(this.responses.secteur_questions[secteur] || this.responses.secteur_questions.default),
          qualification: { secteur }
        };
      } else {
        return this.getRandomResponse(this.responses.secteur_questions.default);
      }
    }

    // Questions sur le budget
    if (!qualification.budget) {
      const budget = this.detectBudget(lastMessage);
      if (budget) {
        return {
          response: this.getRandomResponse(this.responses.urgence_questions),
          qualification: { budget }
        };
      } else {
        return this.getRandomResponse(this.responses.budget_questions);
      }
    }

    // Questions sur l'urgence
    if (!qualification.urgence) {
      const urgence = this.detectUrgence(lastMessage);
      if (urgence) {
        return {
          response: this.getRandomResponse(this.responses.qualification_complete),
          qualification: { urgence },
          isComplete: true
        };
      } else {
        return this.getRandomResponse(this.responses.urgence_questions);
      }
    }

    // Qualification complète
    return {
      response: this.getRandomResponse(this.responses.qualification_complete),
      isComplete: true
    };
  }

  detectSecteur(message) {
    const secteurs = {
      tech: ['tech', 'technologie', 'informatique', 'logiciel', 'développement', 'digital', 'numérique'],
      btp: ['btp', 'construction', 'bâtiment', 'travaux', 'chantier', 'maçonnerie', 'rénovation'],
      conseil: ['conseil', 'consulting', 'consultance', 'stratégie', 'accompagnement', 'formation']
    };

    for (const [secteur, keywords] of Object.entries(secteurs)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return secteur;
      }
    }

    return null;
  }

  detectBudget(message) {
    if (message.includes('5') && (message.includes('k') || message.includes('000'))) {
      if (message.includes('moins') || message.includes('<')) return 'moins-5k';
      return '5-15k';
    }
    if (message.includes('15') || message.includes('10')) return '5-15k';
    if (message.includes('30') || message.includes('20')) return '15-30k';
    if (message.includes('plus') || message.includes('>')) return 'plus-30k';
    
    // Détection de montants numériques
    const numbers = message.match(/\d+/g);
    if (numbers) {
      const amount = parseInt(numbers[0]);
      if (amount < 5000) return 'moins-5k';
      if (amount < 15000) return '5-15k';
      if (amount < 30000) return '15-30k';
      return 'plus-30k';
    }

    return null;
  }

  detectUrgence(message) {
    if (message.includes('immédiat') || message.includes('urgent') || message.includes('maintenant')) {
      return 'immediate';
    }
    if (message.includes('mois') || message.includes('semaine')) {
      return 'court-terme';
    }
    if (message.includes('plus tard') || message.includes('futur') || message.includes('année')) {
      return 'long-terme';
    }
    return 'moyen-terme';
  }

  getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  generateQuoteData(qualification, leadData) {
    const secteurProduits = {
      tech: [
        { name: 'CRM Tech Pro', description: 'Solution CRM spécialisée tech', price: 12000, quantity: 1 },
        { name: 'Intégration API', description: 'Connexion avec vos outils', price: 3000, quantity: 1 },
        { name: 'Formation équipe', description: 'Formation 3 jours', price: 2500, quantity: 1 }
      ],
      btp: [
        { name: 'CRM BTP Expert', description: 'Solution CRM spécialisée BTP', price: 15000, quantity: 1 },
        { name: 'Module devis automatique', description: 'Génération devis BTP', price: 5000, quantity: 1 },
        { name: 'App mobile chantier', description: 'Suivi mobile', price: 3000, quantity: 1 }
      ],
      conseil: [
        { name: 'CRM Conseil Premium', description: 'Solution CRM consulting', price: 10000, quantity: 1 },
        { name: 'Templates propositions', description: 'Modèles personnalisés', price: 2000, quantity: 1 },
        { name: 'Signature électronique', description: 'Validation digitale', price: 1500, quantity: 1 }
      ]
    };

    const produits = secteurProduits[qualification.secteur] || secteurProduits.tech;
    const total = produits.reduce((sum, p) => sum + (p.price * p.quantity), 0);

    return {
      produits,
      total,
      conditions: 'Paiement à 30 jours - Garantie 1 an',
      validite: '30 jours',
      tva: total * 0.2,
      totalTTC: total * 1.2
    };
  }
}

module.exports = new AIService();