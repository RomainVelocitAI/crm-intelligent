import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import {
  UserGroupIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const DashboardPage = () => {
  const { user } = useAuth();
  const { stats, leads, loadStats, loadLeads } = useApp();
  const [recentLeads, setRecentLeads] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    await Promise.all([
      loadStats(),
      loadLeads()
    ]);
  };

  useEffect(() => {
    // R√©cup√©rer les 5 leads les plus r√©cents
    const sortedLeads = [...leads]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);
    setRecentLeads(sortedLeads);
  }, [leads]);

  const getStatusBadge = (status) => {
    const badges = {
      nouveau: 'badge badge-info',
      qualifie: 'badge badge-warning',
      devis_envoye: 'badge badge-success',
      signe: 'badge badge-success',
      perdu: 'badge badge-danger'
    };
    return badges[status] || 'badge badge-gray';
  };

  const getStatusText = (status) => {
    const texts = {
      nouveau: 'Nouveau',
      qualifie: 'Qualifi√©',
      devis_envoye: 'Devis envoy√©',
      devis_genere: 'Devis g√©n√©r√©',
      signe: 'Sign√©',
      perdu: 'Perdu'
    };
    return texts[status] || status;
  };

  const getTemperatureColor = (temperature) => {
    const colors = {
      chaud: 'text-red-500',
      tiede: 'text-yellow-500',
      froid: 'text-blue-500'
    };
    return colors[temperature] || 'text-gray-500';
  };

  const statsCards = [
    {
      title: 'Total Leads',
      value: stats?.leads?.total || 0,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Devis Envoyés',
      value: stats?.leads?.devis_envoye || 0,
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'Valeur Totale',
      value: `${(stats?.quotes?.totalValue || 0).toLocaleString('fr-FR')} €`,
      icon: CurrencyEuroIcon,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'increase'
    },
    {
      title: 'Taux Conversion',
      value: (stats?.leads?.total || 0) > 0 ? 
        `${Math.round((stats?.leads?.signe || 0) / (stats?.leads?.total || 1) * 100)}%` : '0%',
      icon: ChartBarIcon,
      color: 'bg-orange-500',
      change: '+3%',
      changeType: 'increase'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour {user?.name} !
        </h1>
        <p className="text-gray-600 mt-1">
          Voici un aperçu de votre activité commerciale
        </p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <div key={index} className="card card-hover">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {stat.changeType === 'increase' ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-1">vs mois dernier</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads récents */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Leads Récents</h2>
              <Link
                to="/leads"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Voir tout
              </Link>
            </div>

            {recentLeads.length === 0 ? (
              <div className="empty-state">
                <UserGroupIcon className="empty-state-icon" />
                <h3 className="empty-state-title">Aucun lead</h3>
                <p className="empty-state-description">
                  Commencez par ajouter votre premier lead
                </p>
                <Link to="/leads" className="btn-primary">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Ajouter un lead
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {(lead.contact?.name || 'N/A').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {lead.contact?.name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">{lead.contact?.company || 'N/A'}</p>
                        <p className="text-xs text-gray-400">{lead.contact?.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`h-2 w-2 rounded-full ${getTemperatureColor(lead.temperature)}`} />
                      <span className={getStatusBadge(lead.status)}>
                        {getStatusText(lead.status)}
                      </span>
                      <Link
                        to={`/leads/${lead.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Voir
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions rapides et statistiques */}
        <div className="space-y-6">
          {/* Actions rapides */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h2>
            <div className="space-y-3">
              <Link
                to="/leads"
                className="flex items-center p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-3 text-gray-400" />
                Ajouter un lead
              </Link>
              <Link
                to="/leads"
                className="flex items-center p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <DocumentTextIcon className="h-5 w-5 mr-3 text-gray-400" />
                Import CSV/Excel
              </Link>
              <Link
                to="/quotes"
                className="flex items-center p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ChartBarIcon className="h-5 w-5 mr-3 text-gray-400" />
                Voir les devis
              </Link>
            </div>
          </div>

          {/* Répartition par statut */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Répartition des Leads</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Nouveaux</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {stats?.leads?.nouveau || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Qualifiés</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {stats?.leads?.qualifie || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Devis envoyés</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {stats?.leads?.devis_envoye || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-purple-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Signés</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {stats?.leads?.signe || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Prochaines actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">À Faire</h2>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <ClockIcon className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {stats?.leads?.nouveau || 0} leads à qualifier
                  </p>
                  <p className="text-xs text-yellow-600">Utilisez l'IA pour qualifier</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Système opérationnel
                  </p>
                  <p className="text-xs text-green-600">Tout fonctionne parfaitement</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;