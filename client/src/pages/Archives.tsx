import { useState, useEffect } from 'react';
import { 
  Archive, 
  Search, 
  Calendar, 
  User, 
  Download,
  FileText,
  Eye,
  Filter,
  X,
  RotateCcw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotesService } from '@/services/api';
import toast from 'react-hot-toast';
import { Quote, QuoteStatus } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Archives() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const queryClient = useQueryClient();

  // Récupérer les devis archivés
  const { data: archivedQuotes, isLoading } = useQuery({
    queryKey: ['archivedQuotes'],
    queryFn: quotesService.getArchivedQuotes,
  });

  // Mutation pour télécharger un devis archivé
  const downloadQuote = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/quotes/${id}/test-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = `/${data.data.pdfPath}`;
        link.download = `devis_${id}.pdf`;
        link.click();
        return data;
      }
      throw new Error(data.message || 'Erreur lors du téléchargement');
    },
    onSuccess: () => {
      toast.success('Devis téléchargé avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors du téléchargement : ' + error.message);
    },
  });

  const quotes = archivedQuotes?.data?.quotes || [];

  // Filtrage des devis
  const filteredQuotes = quotes.filter((quote: Quote) => {
    const matchesSearch = !searchTerm || 
      quote.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.contact?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.contact?.prenom.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = !dateFilter || 
      new Date(quote.dateCreation).toDateString() === new Date(dateFilter).toDateString();

    const matchesClient = !clientFilter ||
      `${quote.contact?.prenom} ${quote.contact?.nom}`.toLowerCase().includes(clientFilter.toLowerCase());

    return matchesSearch && matchesDate && matchesClient;
  });

  // Fonction d'export CSV
  const handleExport = () => {
    if (filteredQuotes.length === 0) {
      toast.error('Aucun devis à exporter');
      return;
    }

    const csvContent = [
      ['Numéro', 'Objet', 'Client', 'Montant', 'Date de création', 'Statut original'].join(','),
      ...filteredQuotes.map((quote: Quote) => [
        quote.numero,
        `"${quote.objet}"`,
        `"${quote.contact?.prenom} ${quote.contact?.nom}"`,
        quote.total,
        format(new Date(quote.dateCreation), 'dd/MM/yyyy', { locale: fr }),
        getStatusLabel(getOriginalStatus(quote))
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // Nom de fichier intelligent basé sur les filtres
    let fileName = 'archives_devis';
    if (searchTerm) fileName += `_recherche-${searchTerm.replace(/[^a-zA-Z0-9]/g, '-')}`;
    if (dateFilter) fileName += `_date-${format(new Date(dateFilter), 'yyyy-MM-dd')}`;
    if (clientFilter) fileName += `_client-${clientFilter.replace(/[^a-zA-Z0-9]/g, '-')}`;
    fileName += `_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    
    link.download = fileName;
    link.click();
    
    toast.success(`Export téléchargé (${filteredQuotes.length} devis)`);
  };

  // Fonction pour télécharger un devis archivé
  const handleDownload = (quote: Quote) => {
    downloadQuote.mutate(quote.id);
  };

  // Mutation pour restaurer un devis archivé
  const restoreQuote = useMutation({
    mutationFn: async ({ id, newStatus }: {id: string, newStatus: string}) => {
      return quotesService.restoreQuote(id, newStatus);
    },
    onSuccess: () => {
      toast.success('Devis restauré avec succès');
      queryClient.invalidateQueries({ queryKey: ['archivedQuotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la restauration : ' + error.message);
    },
  });

  // Fonction pour restaurer un devis archivé
  const handleRestore = (quote: Quote) => {
    if (confirm('Voulez-vous vraiment restaurer ce devis ? Il redeviendra visible dans la liste des devis actifs.')) {
      // Déterminer le statut de restauration approprié
      let newStatus = 'BROUILLON';
      if (quote.dateEnvoi) newStatus = 'ENVOYE';
      if (quote.dateAcceptation) newStatus = 'ACCEPTE';
      
      restoreQuote.mutate({ id: quote.id, newStatus });
    }
  };

  // Fonction pour voir les détails
  const handleViewDetails = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowQuoteModal(true);
  };

  // Obtenir la couleur du statut original
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ENVOYE': return 'bg-blue-100 text-blue-800';
      case 'VU': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTE': return 'bg-green-100 text-green-800';
      case 'REFUSE': return 'bg-red-100 text-red-800';
      case 'EXPIRE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtenir le libellé du statut pour l'affichage
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'BROUILLON': return 'BROUILLON';
      case 'PRET': return 'PRÊT';
      case 'ENVOYE': return 'ENVOYÉ';
      case 'VU': return 'CONSULTÉ';
      case 'ACCEPTE': return 'ACCEPTÉ';
      case 'REFUSE': return 'REFUSÉ';
      case 'EXPIRE': return 'EXPIRÉ';
      case 'TERMINE': return 'TERMINÉ';
      default: return status;
    }
  };

  // Obtenir le statut original (avant archivage)
  const getOriginalStatus = (quote: Quote) => {
    // Utiliser directement le statut stocké dans l'archive
    // Il contient le statut exact au moment de l'archivage
    return quote.statut || 'BROUILLON';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Archive className="w-8 h-8 text-gray-600" />
            <h1 className="text-3xl font-bold text-gray-900">Archives</h1>
          </div>
          <p className="text-gray-600">Gestion des devis archivés</p>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche principale */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro, objet ou client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtres
              </button>
              <button
                onClick={handleExport}
                disabled={filteredQuotes.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
            </div>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de création
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Nom du client..."
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              {/* Bouton pour effacer les filtres */}
              {(dateFilter || clientFilter) && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setDateFilter('');
                      setClientFilter('');
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Effacer les filtres
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Archive className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total archivés</h3>
                <p className="text-2xl font-bold text-blue-600">{quotes.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Résultats filtrés</h3>
                <p className="text-2xl font-bold text-green-600">{filteredQuotes.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Valeur totale</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
                    .format(filteredQuotes.reduce((sum: number, quote: Quote) => sum + quote.total, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des devis archivés */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des archives...</p>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun devis archivé</h3>
            <p className="text-gray-600">
              {quotes.length === 0 
                ? "Vous n'avez pas encore de devis archivés."
                : "Aucun devis ne correspond à vos critères de recherche."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredQuotes.map((quote: Quote) => {
              const originalStatus = getOriginalStatus(quote);
              
              return (
                <div key={quote.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* En-tête de la carte */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{quote.objet}</h3>
                        <p className="text-sm text-gray-600">#{quote.numero}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(originalStatus)}`}>
                          {getStatusLabel(originalStatus)}
                        </span>
                        {originalStatus === 'ACCEPTE' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Conservation légale
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Informations client */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Client</p>
                      <p className="font-medium text-gray-900">
                        {quote.contact?.prenom} {quote.contact?.nom}
                      </p>
                      {quote.contact?.entreprise && (
                        <p className="text-sm text-gray-600">{quote.contact?.entreprise}</p>
                      )}
                    </div>

                    {/* Montant */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Montant</p>
                      <p className="text-xl font-bold text-green-600">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(quote.total)}
                      </p>
                    </div>

                    {/* Dates */}
                    <div className="mb-6 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Créé le:</span>
                        <span>{format(new Date(quote.dateCreation), 'dd/MM/yyyy', { locale: fr })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Archivé le:</span>
                        <span>{format(new Date(quote.updatedAt), 'dd/MM/yyyy', { locale: fr })}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(quote)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Voir
                      </button>
                      <button
                        onClick={() => handleDownload(quote)}
                        className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-1"
                        disabled={downloadQuote.isPending}
                      >
                        <Download className="w-4 h-4" />
                        Télécharger
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de détails du devis */}
        {showQuoteModal && selectedQuote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowQuoteModal(false)}>
            <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* En-tête de la modal */}
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-6 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">Devis Archivé #{selectedQuote.numero}</h2>
                    <p className="text-gray-100">{selectedQuote.objet}</p>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 mt-2">
                      ARCHIVÉ
                    </span>
                  </div>
                  <button
                    onClick={() => setShowQuoteModal(false)}
                    className="text-white hover:text-gray-200 p-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Contenu de la modal */}
              <div className="p-6">
                {/* Informations générales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Client</p>
                        <p className="font-medium">{selectedQuote.contact?.prenom} {selectedQuote.contact?.nom}</p>
                        {selectedQuote.contact?.entreprise && (
                          <p className="text-sm text-gray-600">{selectedQuote.contact?.entreprise}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date de création</p>
                        <p className="font-medium">{format(new Date(selectedQuote.dateCreation), 'dd/MM/yyyy', { locale: fr })}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date d'archivage</p>
                        <p className="font-medium">{format(new Date(selectedQuote.updatedAt), 'dd/MM/yyyy', { locale: fr })}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Montants</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Sous-total HT</p>
                        <p className="font-medium">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(selectedQuote.sousTotal)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">TVA</p>
                        <p className="font-medium">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(selectedQuote.tva)}</p>
                      </div>
                      <div className="border-t pt-2">
                        <p className="text-sm text-gray-500">Total TTC</p>
                        <p className="text-xl font-bold text-green-600">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(selectedQuote.total)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Éléments du devis */}
                {selectedQuote.items && selectedQuote.items.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Éléments du devis</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Désignation</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Quantité</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Prix unitaire</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedQuote.items.map((item: any, index: number) => (
                            <tr key={index}>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium text-gray-900">{item.designation}</p>
                                  {item.description && (
                                    <p className="text-sm text-gray-500">{item.description}</p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-900">{item.quantite}</td>
                              <td className="px-4 py-3 text-gray-900">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.prixUnitaire)}
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-900">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg">
                <div className="flex justify-center gap-4">
                  <button
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setShowQuoteModal(false)}
                  >
                    Fermer
                  </button>
                  
                  <button
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    onClick={() => {
                      handleRestore(selectedQuote);
                      setShowQuoteModal(false);
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restaurer ce devis
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}