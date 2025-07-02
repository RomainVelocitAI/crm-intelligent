// Service Firebase pour la démo - Version simplifiée sans vraie connexion
class FirebaseService {
  constructor() {
    this.users = new Map();
    this.leads = new Map();
    this.quotes = new Map();
    this.conversations = new Map();
    
    // Données de démo
    this.initDemoData();
  }

  initDemoData() {
    // Utilisateur de démo
    const demoUser = {
      id: 'demo-user-1',
      email: 'demo@crm-intelligent.com',
      name: 'Jean Dupont',
      company: 'Entreprise Demo',
      createdAt: new Date().toISOString(),
      subscription: 'premium'
    };
    this.users.set(demoUser.id, demoUser);

    // Leads de démo
    const demoLeads = [
      {
        id: 'lead-1',
        userId: 'demo-user-1',
        contact: {
          name: 'Marie Martin',
          email: 'marie.martin@exemple.com',
          phone: '06 12 34 56 78',
          company: 'Tech Solutions'
        },
        source: 'website',
        status: 'nouveau',
        temperature: 'chaud',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        notes: 'Intéressée par une solution CRM complète',
        tags: ['tech', 'urgent']
      },
      {
        id: 'lead-2',
        userId: 'demo-user-1',
        contact: {
          name: 'Pierre Durand',
          email: 'pierre.durand@exemple.com',
          phone: '06 98 76 54 32',
          company: 'Construction Plus'
        },
        source: 'manual',
        status: 'qualifie',
        temperature: 'tiede',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Besoin d\'automatisation pour devis BTP',
        tags: ['btp', 'devis']
      },
      {
        id: 'lead-3',
        userId: 'demo-user-1',
        contact: {
          name: 'Sophie Leroy',
          email: 'sophie.leroy@exemple.com',
          phone: '06 11 22 33 44',
          company: 'Conseil & Stratégie'
        },
        source: 'api',
        status: 'devis_envoye',
        temperature: 'chaud',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        notes: 'Devis envoyé pour solution consulting',
        tags: ['conseil', 'premium']
      }
    ];

    demoLeads.forEach(lead => this.leads.set(lead.id, lead));

    // Conversations de démo
    const demoConversations = [
      {
        id: 'lead-1',
        messages: [
          {
            role: 'assistant',
            content: 'Bonjour ! Je suis l\'assistant IA de CRM Intelligent. Pouvez-vous me parler de votre projet ?',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            role: 'user',
            content: 'Nous cherchons une solution CRM pour notre équipe de 15 commerciaux.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString()
          },
          {
            role: 'assistant',
            content: 'Parfait ! Quel est votre secteur d\'activité et quel budget envisagez-vous ?',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString()
          }
        ],
        qualification: {
          secteur: 'tech',
          budget: '10000-20000',
          besoins: ['crm', 'automatisation'],
          urgence: 'haute'
        },
        isComplete: false
      }
    ];

    demoConversations.forEach(conv => this.conversations.set(conv.id, conv));

    // Devis de démo
    const demoQuotes = [
      {
        id: 'quote-1',
        leadId: 'lead-3',
        userId: 'demo-user-1',
        template: 'standard',
        data: {
          produits: [
            { name: 'CRM Premium', description: 'Solution complète', price: 15000, quantity: 1 },
            { name: 'Formation équipe', description: 'Formation 2 jours', price: 2000, quantity: 1 }
          ],
          total: 17000,
          conditions: 'Paiement à 30 jours'
        },
        status: 'envoye',
        pdfUrl: '/demo/quote-1.pdf',
        sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        readAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        version: 1
      }
    ];

    demoQuotes.forEach(quote => this.quotes.set(quote.id, quote));
  }

  // Méthodes pour les utilisateurs
  async getUser(userId) {
    return this.users.get(userId) || null;
  }

  async createUser(userData) {
    const id = `user-${Date.now()}`;
    const user = { id, ...userData, createdAt: new Date().toISOString() };
    this.users.set(id, user);
    return user;
  }

  // Méthodes pour les leads
  async getLeads(userId, filters = {}) {
    const userLeads = Array.from(this.leads.values())
      .filter(lead => lead.userId === userId);
    
    if (filters.status) {
      return userLeads.filter(lead => lead.status === filters.status);
    }
    
    return userLeads;
  }

  async getLead(leadId) {
    return this.leads.get(leadId) || null;
  }

  async createLead(leadData) {
    const id = `lead-${Date.now()}`;
    const lead = {
      id,
      ...leadData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(leadId, updates) {
    const lead = this.leads.get(leadId);
    if (!lead) return null;
    
    const updatedLead = {
      ...lead,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.leads.set(leadId, updatedLead);
    return updatedLead;
  }

  async deleteLead(leadId) {
    return this.leads.delete(leadId);
  }

  // Méthodes pour les conversations
  async getConversation(leadId) {
    return this.conversations.get(leadId) || {
      id: leadId,
      messages: [],
      qualification: {},
      isComplete: false
    };
  }

  async addMessage(leadId, message) {
    let conversation = this.conversations.get(leadId) || {
      id: leadId,
      messages: [],
      qualification: {},
      isComplete: false
    };

    conversation.messages.push({
      ...message,
      timestamp: new Date().toISOString()
    });

    this.conversations.set(leadId, conversation);
    return conversation;
  }

  async updateQualification(leadId, qualification) {
    let conversation = this.conversations.get(leadId) || {
      id: leadId,
      messages: [],
      qualification: {},
      isComplete: false
    };

    conversation.qualification = { ...conversation.qualification, ...qualification };
    conversation.isComplete = this.isQualificationComplete(conversation.qualification);

    this.conversations.set(leadId, conversation);
    return conversation;
  }

  isQualificationComplete(qualification) {
    return qualification.secteur && qualification.budget && 
           qualification.besoins && qualification.urgence;
  }

  // Méthodes pour les devis
  async getQuotes(leadId) {
    return Array.from(this.quotes.values())
      .filter(quote => quote.leadId === leadId);
  }

  async createQuote(quoteData) {
    const id = `quote-${Date.now()}`;
    const quote = {
      id,
      ...quoteData,
      createdAt: new Date().toISOString(),
      version: 1
    };
    this.quotes.set(id, quote);
    return quote;
  }

  async updateQuote(quoteId, updates) {
    const quote = this.quotes.get(quoteId);
    if (!quote) return null;
    
    const updatedQuote = { ...quote, ...updates };
    this.quotes.set(quoteId, updatedQuote);
    return updatedQuote;
  }
}

module.exports = new FirebaseService();