import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { quotesService } from '../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const LeadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getLeadById, updateLead } = useApp();
  const [lead, setLead] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [qualification, setQualification] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [generatingQuote, setGeneratingQuote] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadLeadData();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const loadLeadData = async () => {
    setLoading(true);
    try {
      const leadData = getLeadById(id);
      if (!leadData) {
        toast.error('Lead non trouvé');
        navigate('/leads');
        return;
      }
      setLead(leadData);

      // Charger la conversation
      await loadConversation();
      
      // Charger les devis
      await loadQuotes();
      
      // Charger la qualification
      await loadQualification();
    } catch (error) {
      console.error('Erreur chargement lead:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async () => {
    try {
      // TODO: Implement aiService.getConversation
      console.log('AI Service not yet implemented');
      setConversation([]);
    } catch (error) {
      console.error('Erreur chargement conversation:', error);
    }
  };

  const loadQualification = async () => {
    try {
      // TODO: Implement aiService.getQualification
      console.log('AI Service not yet implemented');
      setQualification(null);
    } catch (error) {
      console.error('Erreur chargement qualification:', error);
    }
  };

  const loadQuotes = async () => {
    try {
      const response = await quotesService.getQuotes();
      if (response.success) {
        setQuotes(response.quotes);
      }
    } catch (error) {
      console.error('Erreur chargement devis:', error);
    }
  };

  const initConversation = async () => {
    setChatLoading(true);
    try {
      // TODO: Implement aiService.initConversation
      console.log('AI Service not yet implemented');
      toast.error('Fonctionnalité IA en cours de développement');
    } catch (error) {
      console.error('Erreur initialisation conversation:', error);
      toast.error('Erreur lors de l\'initialisation');
    } finally {
      setChatLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || chatLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setChatLoading(true);

    try {
      // TODO: Implement aiService.sendMessage
      console.log('AI Service not yet implemented');
      toast.error('Fonctionnalité IA en cours de développement');
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setChatLoading(false);
    }
  };

  const generateQuote = async () => {
    setGeneratingQuote(true);
    try {
      const response = await quotesService.generate(id);
      if (response.success) {
        await loadQuotes();
        await updateLead(id, { status: 'devis_genere' });
        setLead(prev => ({ ...prev, status: 'devis_genere' }));
        toast.success('Devis généré avec succès !');
      }
    } catch (error) {
      console.error('Erreur génération devis:', error);
      toast.error('Erreur lors de la génération du devis');
    } finally {
      setGeneratingQuote(false);
    }
  };

  const sendQuote = async (quoteId) => {
    try {
      const response = await quotesService.send(quoteId);
      if (response.success) {
        await loadQuotes();
        await updateLead(id, { status: 'devis_envoye' });
        setLead(prev => ({ ...prev, status: 'devis_envoye' }));
        toast.success('Devis envoyé par email !');
      }
    } catch (error) {
      console.error('Erreur envoi devis:', error);
      toast.error('Erreur lors de l\'envoi du devis');
    }
  };

  const resetConversation = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser la conversation ?')) {
      try {
        // TODO: Implement aiService.resetConversation
        console.log('AI Service not yet implemented');
        await loadConversation();
        await loadQualification();
        toast.success('Conversation réinitialisée');
      } catch (error) {
        console.error('Erreur reset conversation:', error);
        toast.error('Erreur lors de la réinitialisation');
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      nouveau: 'badge badge-info',
      qualifie: 'badge badge-warning',
      devis_genere: 'badge badge-success',
      devis_envoye: 'badge badge-success',
      signe: 'badge badge-success',
      perdu: 'badge badge-danger'
    };
    return badges[status] || 'badge badge-gray';
  };

  const getStatusText = (status) => {
    const texts = {
      nouveau: 'Nouveau',
      qualifie: 'Qualifié',
      devis_genere: 'Devis généré',
      devis_envoye: 'Devis envoyé',
      signe: 'Signé',
      perdu: 'Perdu'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lead non trouvé</h1>
          <Link to="/leads" className="btn-primary">
            Retour aux leads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/leads"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lead.contact?.name || 'N/A'}</h1>
            <p className="text-gray-600">{lead.contact?.company || 'N/A'}</p>
          </div>
        </div>
        <span className={getStatusBadge(lead.status)}>
          {getStatusText(lead.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations du lead */}
        <div className="lg:col-span-1 space-y-6">
          {/* Détails contact */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations Contact</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-900">{lead.contact?.email || 'N/A'}</p>
              </div>
              {lead.contact?.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Téléphone</label>
                  <p className="text-sm text-gray-900">{lead.contact.phone}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Source</label>
                <p className="text-sm text-gray-900 capitalize">{lead.source}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Température</label>
                <div className="flex items-center mt-1">
                  <div className={`h-3 w-3 rounded-full mr-2 ${
                    lead.temperature === 'chaud' ? 'bg-red-500' :
                    lead.temperature === 'tiede' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <span className="text-sm text-gray-900 capitalize">{lead.temperature}</span>
                </div>
              </div>
              {lead.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-sm text-gray-900">{lead.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Progression qualification */}
          {qualification && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Qualification IA</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Secteur d'activité</span>
                  {qualification.progress.secteur ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Budget</span>
                  {qualification.progress.budget ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Besoins</span>
                  {qualification.progress.besoins ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Urgence</span>
                  {qualification.progress.urgence ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                
                {qualification.isComplete && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-green-800">
                        Qualification terminée !
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Vous pouvez maintenant générer un devis
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Devis */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Devis</h2>
              {qualification?.isComplete && (
                <button
                  onClick={generateQuote}
                  disabled={generatingQuote}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {generatingQuote ? (
                    <div className="flex items-center">
                      <div className="spinner mr-2"></div>
                      Génération...
                    </div>
                  ) : (
                    <>
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      Générer
                    </>
                  )}
                </button>
              )}
            </div>

            {quotes.length === 0 ? (
              <div className="text-center py-6">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aucun devis généré</p>
                {!qualification?.isComplete && (
                  <p className="text-xs text-gray-400 mt-1">
                    Terminez la qualification pour générer un devis
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {quotes.map((quote) => (
                  <div key={quote.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Devis #{quote.version}
                      </span>
                      <span className={`badge ${
                        quote.status === 'envoye' ? 'badge-success' :
                        quote.status === 'lu' ? 'badge-info' :
                        quote.status === 'genere' ? 'badge-warning' : 'badge-gray'
                      }`}>
                        {quote.status === 'envoye' ? 'Envoyé' :
                         quote.status === 'lu' ? 'Lu' :
                         quote.status === 'genere' ? 'Généré' : quote.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Total: {quote.data.totalTTC?.toLocaleString('fr-FR')} € TTC
                    </p>
                    <div className="flex space-x-2">
                      {quote.pdfUrl && (
                        <a
                          href={`http://localhost:5000${quote.pdfUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Télécharger PDF
                        </a>
                      )}
                      {quote.status === 'genere' && (
                        <button
                          onClick={() => sendQuote(quote.id)}
                          className="text-xs text-green-600 hover:text-green-700"
                        >
                          Envoyer par email
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat IA */}
        <div className="lg:col-span-2">
          <div className="card h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Assistant IA</h2>
              </div>
              {conversation?.messages?.length > 0 && (
                <button
                  onClick={resetConversation}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  Réinitialiser
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {!conversation?.messages?.length ? (
                <div className="text-center py-12">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">
                    Démarrez une conversation avec l'IA pour qualifier ce lead
                  </p>
                  <button
                    onClick={initConversation}
                    disabled={chatLoading}
                    className="btn-primary"
                  >
                    {chatLoading ? 'Initialisation...' : 'Démarrer la qualification'}
                  </button>
                </div>
              ) : (
                <>
                  {conversation.messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`chat-message ${msg.role}`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <span className="text-xs opacity-75 mt-1 block">
                        {new Date(msg.timestamp).toLocaleTimeString('fr-FR')}
                      </span>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="chat-message assistant">
                      <div className="flex items-center space-x-2">
                        <div className="spinner"></div>
                        <span className="text-sm">L'IA réfléchit...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Zone de saisie */}
            {conversation?.messages?.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex space-x-2">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez votre message..."
                    className="flex-1 form-input resize-none"
                    rows={2}
                    disabled={chatLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!message.trim() || chatLoading}
                    className="btn-primary px-3 disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailPage;