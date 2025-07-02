import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { quotesService } from '../services/api';
import toast from 'react-hot-toast';
import {
  DocumentTextIcon,
  EyeIcon,
  PaperAirplaneIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  CurrencyEuroIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const QuotesPage = () => {
  const { leads } = useApp();
  const [allQuotes, setAllQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    totalValue: 0,
    sent: 0,
    signed: 0
  });

  useEffect(() => {
    loadAllQuotes();
  }, [leads]);

  useEffect(() => {
    applyFilters();
  }, [allQuotes, searchQuery, statusFilter]);

  const loadAllQuotes = async () => {
    setLoading(true);
    try {
      const quotesPromises = leads.map(async (lead) => {
        try {
          const response = await quotesService.getByLead(lead.id);
          if (response.success) {
            return response.quotes.map(quote => ({
              ...quote,
              leadName: lead.contact?.name || 'N/A',
              leadEmail: lead.contact?.email || 'N/A',
              leadCompany: lead.contact?.company || 'N/A'
            }));
          }
          return [];
        } catch (error) {
          console.error(`Erreur chargement devis pour lead ${lead.id}:`, error);
          return [];
        }
      });

      const quotesArrays = await Promise.all(quotesPromises);
      const quotes = quotesArrays.flat();
      
      setAllQuotes(quotes);
      calculateStats(quotes);
    } catch (error) {
      console.error('Erreur chargement devis:', error);
      toast.error('Erreur lors du chargement des devis');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (quotes) => {
    const stats = {
      total: quotes.length,
      totalValue: quotes.reduce((sum, quote) => sum + (quote.data.total || 0), 0),
      sent: quotes.filter(q => ['envoye', 'lu', 'signe'].includes(q.status)).length,
      signed: quotes.filter(q => q.status === 'signe').length
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...allQuotes];

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(quote =>
        quote.leadName.toLowerCase().includes(query) ||
        quote.leadEmail.toLowerCase().includes(query) ||
        quote.leadCompany.toLowerCase().includes(query)
      );
    }

    // Filtre par statut
    if (statusFilter) {
      filtered = filtered.filter(quote => quote.status === statusFilter);
    }

    // Tri par date de création (plus récent en premier)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredQuotes(filtered);
  };

  const handleSendQuote = async (quoteId) => {
    try {
      const response = await quotesService.send(quoteId);
      if (response.success) {
        await loadAllQuotes();
        toast.success('Devis envoyé avec succès !');
      }
    } catch (error) {
      console.error('Erreur envoi devis:', error);
      toast.error('Erreur lors de l\'envoi du devis');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      brouillon: 'badge badge-gray',
      genere: 'badge badge-warning',
      envoye: 'badge badge-info',
      lu: 'badge badge-success',
      signe: 'badge badge-success',
      expire: 'badge badge-danger'
    };
    return badges[status] || 'badge badge-gray';
  };

  const getStatusText = (status) => {
    const texts = {
      brouillon: 'Brouillon',
      genere: 'Généré',
      envoye: 'Envoyé',
      lu: 'Lu',
      signe: 'Signé',
      expire: 'Expiré'
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'envoye':
        return <PaperAirplaneIcon className="h-4 w-4" />;
      case 'lu':
        return <EyeIcon className="h-4 w-4" />;
      case 'signe':
        return <CheckCircleIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Devis</h1>
          <p className="text-gray-600 mt-1">
            {filteredQuotes.length} devis
            {searchQuery && ` trouvé${filteredQuotes.length > 1 ? 's' : ''} pour "${searchQuery}"`}
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Devis</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <PaperAirplaneIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Envoyés</p>
              <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <CurrencyEuroIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valeur Totale</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalValue.toLocaleString('fr-FR')} €
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-500">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taux Signature</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total > 0 ? Math.round((stats.signed / stats.total) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un devis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 form-input"
            />
          </div>

          {/* Filtre statut */}
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input w-auto"
            >
              <option value="">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="genere">Généré</option>
              <option value="envoye">Envoyé</option>
              <option value="lu">Lu</option>
              <option value="signe">Signé</option>
              <option value="expire">Expiré</option>
            </select>

            {(searchQuery || statusFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                }}
                className="btn-secondary text-sm"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Liste des devis */}
      {filteredQuotes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <DocumentTextIcon className="empty-state-icon" />
            <h3 className="empty-state-title">
              {searchQuery || statusFilter ? 'Aucun devis trouvé' : 'Aucun devis'}
            </h3>
            <p className="empty-state-description">
              {searchQuery || statusFilter ? 
                'Essayez de modifier vos critères de recherche' : 
                'Les devis apparaîtront ici une fois générés'}
            </p>
            {!searchQuery && !statusFilter && (
              <Link to="/leads" className="btn-primary">
                Gérer les leads
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Devis</th>
                  <th>Client</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Créé le</th>
                  <th>Dernière action</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id}>
                    <td>
                      <div className="flex items-center">
                        {getStatusIcon(quote.status)}
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">
                            Devis #{quote.version}
                          </div>
                          <div className="text-sm text-gray-500">
                            {quote.template === 'premium' ? 'Premium' : 'Standard'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="font-medium text-gray-900">{quote.leadName}</div>
                        <div className="text-sm text-gray-500">{quote.leadCompany}</div>
                        <div className="text-sm text-gray-500">{quote.leadEmail}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="font-medium text-gray-900">
                          {quote.data.totalTTC?.toLocaleString('fr-FR')} € TTC
                        </div>
                        <div className="text-sm text-gray-500">
                          {quote.data.total?.toLocaleString('fr-FR')} € HT
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={getStatusBadge(quote.status)}>
                        {getStatusText(quote.status)}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-900">
                        {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-500">
                        {quote.readAt ? 
                          `Lu le ${new Date(quote.readAt).toLocaleDateString('fr-FR')}` :
                          quote.sentAt ? 
                          `Envoyé le ${new Date(quote.sentAt).toLocaleDateString('fr-FR')}` :
                          'Aucune action'
                        }
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        {quote.pdfUrl && (
                          <a
                            href={`http://localhost:5000${quote.pdfUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                            title="Télécharger PDF"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </a>
                        )}
                        
                        {quote.status === 'genere' && (
                          <button
                            onClick={() => handleSendQuote(quote.id)}
                            className="text-green-600 hover:text-green-700"
                            title="Envoyer par email"
                          >
                            <PaperAirplaneIcon className="h-4 w-4" />
                          </button>
                        )}

                        <Link
                          to={`/leads/${quote.leadId}`}
                          className="text-gray-600 hover:text-gray-700"
                          title="Voir le lead"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotesPage;