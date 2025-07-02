import { useState } from 'react';
import { 
  TrendingUp, FileText, Mail, Send, CheckCircle, XCircle, 
  Eye as EyeIcon, X
} from 'lucide-react';
import { useQuotes } from '@/hooks/useQuotes';
import { quotesService } from '@/services/api';
import { Contact, QuoteStatus } from '@/types';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Tooltip } from './Tooltip';

interface ContactDetailsProps {
  contact: Contact;
}

export default function ContactDetails({ contact }: ContactDetailsProps) {
  const { quotes } = useQuotes();
  const queryClient = useQueryClient();
  // Etats pour la modal de relance
  const [showRelanceModal, setShowRelanceModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [relanceSubject, setRelanceSubject] = useState('');
  const [relanceContent, setRelanceContent] = useState('');
  const [isLoadingRelance, setIsLoadingRelance] = useState(false);
  
  // Etats pour les actions sur les devis
  const [isUpdatingQuote, setIsUpdatingQuote] = useState<string | null>(null);

  // Fonction pour obtenir le label du statut
  const getStatusLabel = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.BROUILLON:
        return 'Brouillon';
      case QuoteStatus.PRET:
        return 'Prêt';
      case QuoteStatus.ENVOYE:
        return 'Envoyé';
      case QuoteStatus.VU:
        return 'Consulté';
      case QuoteStatus.ACCEPTE:
        return 'Accepté';
      case QuoteStatus.REFUSE:
        return 'Refusé';
      case QuoteStatus.EXPIRE:
        return 'Expiré';
      default:
        return status;
    }
  };


  // Filtrer les devis du contact
  const contactQuotes = quotes?.filter(quote => quote.contactId === contact.id) || [];

  // Fonction pour calculer les jours depuis creation
  const getDaysSinceCreation = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Fonction pour calculer les jours depuis l'envoi d'un devis
  const getDaysSinceQuoteSent = (quote: any) => {
    if (!quote.dateEnvoi) return 0;
    const sentDate = new Date(quote.dateEnvoi);
    const today = new Date();
    const diffTime = today.getTime() - sentDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Fonction pour déterminer l'urgence de relance (sur 7 jours)
  const getRelanceUrgency = (quote: any) => {
    if (quote.statut !== QuoteStatus.ENVOYE && quote.statut !== QuoteStatus.VU) {
      return { level: 'none', percentage: 0, message: '' };
    }

    const daysSinceSent = getDaysSinceQuoteSent(quote);
    const percentage = Math.min((daysSinceSent / 7) * 100, 100);

    if (daysSinceSent >= 7) {
      return { 
        level: 'urgent', 
        percentage: 100, 
        message: 'Relance urgente recommandée' 
      };
    } else if (daysSinceSent >= 5) {
      return { 
        level: 'warning', 
        percentage, 
        message: 'Relance bientôt nécessaire' 
      };
    } else if (daysSinceSent >= 3) {
      return { 
        level: 'info', 
        percentage, 
        message: 'Suivi en cours' 
      };
    } else {
      return { 
        level: 'good', 
        percentage, 
        message: 'Récemment envoyé' 
      };
    }
  };


  // Fonction pour obtenir la couleur du bouton de relance
  const getRelanceButtonColor = (days: number) => {
    if (days < 3) return 'border-blue-500 text-blue-600 hover:bg-blue-50';
    if (days <= 6) return 'border-orange-500 text-orange-600 hover:bg-orange-50';
    return 'border-red-500 text-red-600 hover:bg-red-50';
  };

  // Fonction pour obtenir le label d'urgence
  const getUrgenceLabel = (days: number) => {
    if (days < 3) return { label: 'Récent', color: 'bg-blue-100 text-blue-800' };
    if (days <= 6) return { label: 'À relancer', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Urgent', color: 'bg-red-100 text-red-800' };
  };

  // Fonctions pour les actions sur les devis
  const handleAcceptQuote = async (quote: any) => {
    setIsUpdatingQuote(quote.id);
    try {
      await quotesService.updateQuoteStatus(quote.id, QuoteStatus.ACCEPTE);
      toast.success('Devis marqué comme accepté');
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsUpdatingQuote(null);
    }
  };

  const handleRefuseQuote = async (quote: any) => {
    setIsUpdatingQuote(quote.id);
    try {
      await quotesService.updateQuoteStatus(quote.id, QuoteStatus.REFUSE);
      toast.success('Devis marqué comme refusé');
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsUpdatingQuote(null);
    }
  };

  const handlePrepareRelance = (quote: any) => {
    setSelectedQuote(quote);
    setRelanceSubject(`Relance - Devis ${quote.numero}`);
    setRelanceContent(`Bonjour,

J'espère que vous allez bien. Je me permets de revenir vers vous concernant notre devis ${quote.numero} pour ${quote.objet}.

Avez-vous eu l'occasion de l'examiner ? Je reste à votre disposition pour toute question ou clarification.

Cordialement`);
    setShowRelanceModal(true);
  };

  const handleSendRelance = async () => {
    if (!selectedQuote) return;
    
    setIsLoadingRelance(true);
    try {
      await quotesService.sendRelance(selectedQuote.id, {
        subject: relanceSubject,
        content: relanceContent
      });
      toast.success('Relance envoyée avec succès');
      setShowRelanceModal(false);
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la relance');
    } finally {
      setIsLoadingRelance(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  // Fonction pour extraire les informations de tracking d'un devis
  const getTrackingInfo = (quote: any) => {
    if (!quote.emailTracking || quote.emailTracking.length === 0) {
      return null;
    }

    // Prendre le premier tracking (il peut y en avoir plusieurs si plusieurs emails)
    const tracking = quote.emailTracking[0];
    
    return {
      premiereOuverture: tracking.dateOuverture ? formatDate(tracking.dateOuverture) : null,
      derniereOuverture: tracking.derniereActivite ? formatDate(tracking.derniereActivite) : (tracking.dateOuverture ? formatDate(tracking.dateOuverture) : null),
      nombreOuvertures: tracking.nombreOuvertures || 0,
      isOpened: tracking.ouvert || false
    };
  };

  // Calculer les métriques
  const totalQuotes = contactQuotes.length;
  const totalValue = contactQuotes.reduce((sum, quote) => sum + quote.total, 0);
  const acceptedQuotes = contactQuotes.filter(q => q.statut === QuoteStatus.ACCEPTE).length;
  const pendingQuotes = contactQuotes.filter(q => 
    q.statut === QuoteStatus.PRET || q.statut === QuoteStatus.ENVOYE || q.statut === QuoteStatus.VU
  ).length;

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Devis</p>
              <p className="text-2xl font-bold text-blue-900">{totalQuotes}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Valeur Totale</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totalValue)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Acceptés</p>
              <p className="text-2xl font-bold text-purple-900">{acceptedQuotes}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">En Attente</p>
              <p className="text-2xl font-bold text-orange-900">{pendingQuotes}</p>
            </div>
            <Mail className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Timeline des devis et emails */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Historique des interactions</h3>
        </div>
        
        <div className="p-6">
          {contactQuotes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun devis pour ce contact</p>
            </div>
          ) : (
            <div className="space-y-6">
              {contactQuotes.map((quote) => {
                const daysSince = getDaysSinceCreation(quote.dateCreation);
                const urgence = getUrgenceLabel(daysSince);
                const canRelance = quote.statut === QuoteStatus.ENVOYE || quote.statut === QuoteStatus.VU;
                const isUpdating = isUpdatingQuote === quote.id;

                return (
                  <div key={quote.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{quote.numero}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgence.color}`}>
                            {urgence.label}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-1">{quote.objet}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Créé le {formatDate(quote.dateCreation)}</span>
                          <span>•</span>
                          <span className="font-medium">{formatCurrency(quote.total)}</span>
                          {quote.dateEnvoi && (
                            <>
                              <span>•</span>
                              <span>Envoyé le {formatDate(quote.dateEnvoi)}</span>
                            </>
                          )}
                        </div>
                        
                        {/* Barre de progression pour les devis envoyés */}
                        {(quote.statut === QuoteStatus.ENVOYE || quote.statut === QuoteStatus.VU) && quote.dateEnvoi && (() => {
                          const urgency = getRelanceUrgency(quote);
                          const daysSinceSent = getDaysSinceQuoteSent(quote);
                          
                          return (
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-600">
                                  Relance ({daysSinceSent}/7 jours)
                                </span>
                                <span className={`text-xs font-medium ${
                                  urgency.level === 'urgent' ? 'text-red-600' :
                                  urgency.level === 'warning' ? 'text-orange-600' :
                                  urgency.level === 'info' ? 'text-blue-600' :
                                  'text-green-600'
                                }`}>
                                  {urgency.message}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    urgency.level === 'urgent' ? 'bg-red-500' :
                                    urgency.level === 'warning' ? 'bg-orange-500' :
                                    urgency.level === 'info' ? 'bg-blue-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${urgency.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        {/* Affichage du statut avec icône appropriée */}
                        <Tooltip 
                          content={quote.dateEnvoi ? `Devis envoyé le ${formatDate(quote.dateEnvoi)}` : `Statut: ${getStatusLabel(quote.statut)}`}
                          position="top"
                        >
                          <div className="flex items-center gap-1">
                            {quote.statut === QuoteStatus.BROUILLON && (
                              <>
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">{getStatusLabel(quote.statut)}</span>
                              </>
                            )}
                            {quote.statut === QuoteStatus.PRET && (
                              <>
                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                <span className="text-gray-600">{getStatusLabel(quote.statut)}</span>
                              </>
                            )}
                            {quote.statut === QuoteStatus.ENVOYE && (
                              <>
                                <Send className="w-4 h-4 text-blue-500" />
                                <span className="text-gray-600">{getStatusLabel(quote.statut)}</span>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </>
                            )}
                            {(quote.statut === QuoteStatus.VU || quote.statut === QuoteStatus.ACCEPTE || quote.statut === QuoteStatus.REFUSE) && (
                              <>
                                <Send className="w-4 h-4 text-blue-500" />
                                <span className="text-gray-600">{getStatusLabel(quote.statut)}</span>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </>
                            )}
                          </div>
                        </Tooltip>
                        
                        {(() => {
                          const trackingInfo = getTrackingInfo(quote);
                          const isOpened = quote.statut === QuoteStatus.VU || (trackingInfo && trackingInfo.isOpened);
                          
                          if (isOpened && trackingInfo) {
                            return (
                              <Tooltip 
                                content={`Première ouverture le : ${trackingInfo.premiereOuverture || 'Date inconnue'}\nDernière ouverture le : ${trackingInfo.derniereOuverture || 'Date inconnue'}\nNombre d'ouvertures : ${trackingInfo.nombreOuvertures}`}
                                position="top"
                              >
                                <div className="flex items-center gap-1">
                                  <EyeIcon className="w-4 h-4 text-green-500" />
                                  <span className="text-gray-600">Ouvert</span>
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                </div>
                              </Tooltip>
                            );
                          } else {
                            return (
                              <Tooltip 
                                content={`Devis pas encore ouvert par le client\nStatut : Envoyé mais non consulté\nLe client n'a pas encore pris connaissance du devis\n\nLe statut passera à "Ouvert" lors de la première consultation`}
                                position="top"
                              >
                                <div className="flex items-center gap-1">
                                  <EyeIcon className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-400">Non ouvert</span>
                                  <XCircle className="w-4 h-4 text-gray-400" />
                                </div>
                              </Tooltip>
                            );
                          }
                        })()}
                      </div>

                      <div className="flex items-center gap-2">
                        {canRelance && (
                          <button
                            className={`px-3 py-1 border rounded-lg text-sm font-medium transition-colors ${getRelanceButtonColor(daysSince)}`}
                            onClick={() => handlePrepareRelance(quote)}
                            disabled={isUpdating}
                          >
                            <Send className="w-4 h-4 inline mr-1" />
                            Relancer
                          </button>
                        )}
                        
                        {(quote.statut === QuoteStatus.PRET || quote.statut === QuoteStatus.ENVOYE || quote.statut === QuoteStatus.VU) && (
                          <div className="flex gap-1">
                            <button
                              className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                              onClick={() => handleAcceptQuote(quote)}
                              disabled={isUpdating}
                              title="Marquer ce devis comme accepté par le client"
                            >
                              {isUpdating ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              Accepté
                            </button>
                            <button
                              className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                              onClick={() => handleRefuseQuote(quote)}
                              disabled={isUpdating}
                              title="Marquer ce devis comme refusé par le client"
                            >
                              {isUpdating ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              Refusé
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de relance */}
      {showRelanceModal && selectedQuote && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowRelanceModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Relancer le devis {selectedQuote.numero}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowRelanceModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Objet
                    </label>
                    <input
                      type="text"
                      value={relanceSubject}
                      onChange={(e) => setRelanceSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      value={relanceContent}
                      onChange={(e) => setRelanceContent(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRelanceModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSendRelance}
                  disabled={isLoadingRelance}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isLoadingRelance ? 'Envoi...' : 'Envoyer la relance'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}